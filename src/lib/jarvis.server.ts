import {
  buildCompanyContext,
  buildJarvisSystemPrompt,
  type JarvisMode,
} from "./jarvis-prompt";
import type { EmployeeCode, Priority } from "./company-data";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/** JARVISが提案できる唯一のアクション（v1）。実行は必ずCEOの実行ボタン確認を経る。 */
export interface ProposedTask {
  title: string;
  assignee: EmployeeCode;
  priority?: Priority | undefined;
}

export interface JarvisReply {
  text: string;
  proposedTask?: ProposedTask | undefined;
}

const EMPLOYEE_CODES = new Set(["A", "B", "C", "D", "E", "F"]);
const PRIORITIES = new Set(["P0", "P1", "P2"]);

/**
 * モデルからの関数呼び出し引数を検証する。不正な値（存在しない担当コード等）は
 * 提案自体を無効化する（実行ボタンは出さない）— モデルの出力を無条件に信用しない。
 */
function parseProposedTask(args: unknown): ProposedTask | undefined {
  if (!args || typeof args !== "object") return undefined;
  const a = args as Record<string, unknown>;
  const title = typeof a["title"] === "string" ? a["title"].trim() : "";
  const assignee = typeof a["assignee"] === "string" ? a["assignee"] : "";
  const priority = typeof a["priority"] === "string" ? a["priority"] : "";
  if (!title || title.length > 200) return undefined;
  if (!EMPLOYEE_CODES.has(assignee)) return undefined;
  return {
    title,
    assignee: assignee as EmployeeCode,
    priority: PRIORITIES.has(priority) ? (priority as Priority) : undefined,
  };
}

/**
 * create_task の1関数のみを公開するツール定義（Gemini functionDeclarations形式）。
 * 意図的に他の操作は一切公開しない — 増やす場合は個別に承認レベルを検討すること。
 */
const JARVIS_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "create_task",
        description:
          "新しいタスクをtasksテーブルに作成することを提案する。この関数を呼んだ時点ではまだ実行されず、CEOが画面上の実行ボタンを押して初めて実際に作成される。CEOの依頼が「特定の担当者に、具体的な単一の作業を割り当てる」という形に明確に該当する場合のみ呼ぶこと。",
        parameters: {
          type: "OBJECT",
          properties: {
            title: {
              type: "STRING",
              description: "タスクのタイトル（簡潔に、日本語で）",
            },
            assignee: {
              type: "STRING",
              enum: ["A", "B", "C", "D", "E", "F"],
              description: "担当するAI社員のコード（A〜Fのいずれか1文字）",
            },
            priority: {
              type: "STRING",
              enum: ["P0", "P1", "P2"],
              description: "優先度。指定がなければP2（通常）を使う",
            },
          },
          required: ["title", "assignee"],
        },
      },
    ],
  },
];

export async function callJarvis(
  history: ChatTurn[],
  mode: JarvisMode = "instruction",
): Promise<JarvisReply> {
  const geminiKey = process.env["GEMINI_API_KEY"];
  if (geminiKey) return callGemini(geminiKey, history, mode);

  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AIキーが設定されていません。");

  // Lovable Gatewayフォールバック経路はv1ではfunction callingに未対応
  // （常にproposedTaskなしの通常テキスト応答）。
  const res = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          { role: "system", content: buildJarvisSystemPrompt(mode) },
          { role: "system", content: await buildCompanyContext() },
          ...history.slice(-16),
        ],
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429)
      throw new Error(
        "アクセスが集中しています。少し待って再度お試しください。",
      );
    if (res.status === 402)
      throw new Error(
        "AIクレジットが不足しています。Lovableでクレジットを追加してください。",
      );
    throw new Error(
      `JARVISに接続できませんでした（${res.status}）: ${text.slice(0, 200)}`,
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return {
    text:
      data.choices?.[0]?.message?.content?.trim() ||
      "（応答を生成できませんでした）",
  };
}

async function callGemini(
  apiKey: string,
  history: ChatTurn[],
  mode: JarvisMode,
): Promise<JarvisReply> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
  const companyContext = await buildCompanyContext();
  const contents = [
    {
      role: "user",
      parts: [
        {
          text: `【システム指示】\n${buildJarvisSystemPrompt(mode)}\n\n${companyContext}`,
        },
      ],
    },
    { role: "model", parts: [{ text: "了解しました、CEO。指示に従います。" }] },
    ...history.slice(-16).map((h) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }],
    })),
  ];

  // 相談モードではタスク委任を行わない設計のため、toolsは指示モードのみ渡す。
  const body: Record<string, unknown> = { contents };
  if (mode === "instruction") body["tools"] = JARVIS_TOOLS;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    if (res.status === 429)
      throw new Error(
        "Gemini APIのレート上限に達しました。少し待って再度お試しください。",
      );
    throw new Error(
      `Gemini APIエラー（${res.status}）: ${detail.slice(0, 200)}`,
    );
  }
  const data = (await res.json()) as {
    candidates?: {
      content?: {
        parts?: {
          text?: string;
          functionCall?: { name?: string; args?: unknown };
        }[];
      };
    }[];
  };
  const parts = data.candidates?.[0]?.content?.parts ?? [];

  // 1応答につき最大1件の関数呼び出しのみ扱う（複数返ってきても最初の1件のみ）。
  const call = parts.find((p) => p.functionCall?.name === "create_task");
  const proposedTask = call
    ? parseProposedTask(call.functionCall?.args)
    : undefined;

  const text =
    parts
      .map((p) => p.text)
      .filter((t): t is string => !!t)
      .join("")
      .trim() ||
    (proposedTask
      ? `以下の内容でタスクを作成することを提案します。内容を確認のうえ、実行ボタンを押してください。`
      : "（応答を生成できませんでした）");

  return { text, proposedTask };
}
