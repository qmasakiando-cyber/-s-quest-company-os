import { createFileRoute } from "@tanstack/react-router";

interface ChatBody {
  employeeCode?: string;
  userMessage?: string;
  conversationHistory?: { role: "user" | "assistant"; content: string }[];
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let employeeCode: string | null = null;
        try {
          const body = (await request.json()) as ChatBody;
          const userMessage = (body.userMessage ?? "").trim();
          if (!userMessage) {
            return Response.json({ error: "メッセージが空です。" }, { status: 400 });
          }
          const history = (body.conversationHistory ?? []).slice(-16);

          const { AI_EMPLOYEES } = await import("@/lib/company-data");
          const { JARVIS_SYSTEM_PROMPT, buildCompanyContext } = await import(
            "@/lib/jarvis-prompt"
          );

          const code = (body.employeeCode ?? "").toUpperCase();
          const employee = AI_EMPLOYEES[code as keyof typeof AI_EMPLOYEES];
          if (employee) employeeCode = code;
          const systemPrompt = employee ? employee.systemPrompt : JARVIS_SYSTEM_PROMPT;
          const system = `${systemPrompt}\n\n${buildCompanyContext()}`;

          const geminiKey = process.env["GEMINI_API_KEY"];
          const text = geminiKey
            ? await callGemini(geminiKey, system, history, userMessage)
            : await callLovableGateway(system, history, userMessage);

          return Response.json({ text, employeeCode: employee ? code : "JARVIS" });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "サーバー内部エラーが発生しました。";
          if (employeeCode) {
            // 個別AI社員へのチャットが失敗 → ERROR状態にしてerror_countを+1する。
            // このイベント駆動更新自体の失敗で、本来のエラー応答を握りつぶさないようにする。
            try {
              const { onEmployeeChatError } = await import("@/lib/employees.server");
              await onEmployeeChatError(employeeCode as "A" | "B" | "C" | "D" | "E" | "F");
            } catch (syncError) {
              console.error("employee status sync (chat error) failed:", syncError);
            }
          }
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});

async function callGemini(
  apiKey: string,
  system: string,
  history: { role: "user" | "assistant"; content: string }[],
  userMessage: string,
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
  const contents = [
    { role: "user", parts: [{ text: `【システム指示】\n${system}` }] },
    { role: "model", parts: [{ text: "了解しました。指示に従って行動します。" }] },
    ...history.map((h) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }],
    })),
    { role: "user", parts: [{ text: userMessage }] },
  ];

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents }),
  });
  if (!res.ok) {
    const detail = await res.text();
    if (res.status === 429) throw new Error("Gemini APIのレート上限に達しました。少し待って再送してください。");
    throw new Error(`Gemini APIエラー（${res.status}）: ${detail.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "応答の取得に失敗しました。";
}

async function callLovableGateway(
  system: string,
  history: { role: "user" | "assistant"; content: string }[],
  userMessage: string,
): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AIキーが設定されていません。");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "google/gemini-3.6-flash",
      messages: [
        { role: "system", content: system },
        ...history,
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    if (res.status === 429)
      throw new Error("アクセスが集中しています。少し待って再度お試しください。");
    if (res.status === 402)
      throw new Error("AIクレジットが不足しています。Lovableでクレジットを追加してください。");
    throw new Error(`AIに接続できませんでした（${res.status}）: ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content?.trim() || "応答の取得に失敗しました。";
}
