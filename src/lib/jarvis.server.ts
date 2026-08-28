import { buildCompanyContext, buildJarvisSystemPrompt, type JarvisMode } from "./jarvis-prompt";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export async function callJarvis(
  history: ChatTurn[],
  mode: JarvisMode = "instruction",
): Promise<string> {
  const geminiKey = process.env["GEMINI_API_KEY"];
  if (geminiKey) return callGemini(geminiKey, history, mode);

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
        { role: "system", content: buildJarvisSystemPrompt(mode) },
        { role: "system", content: buildCompanyContext() },
        ...history.slice(-16),
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("アクセスが集中しています。少し待って再度お試しください。");
    if (res.status === 402)
      throw new Error("AIクレジットが不足しています。Lovableでクレジットを追加してください。");
    throw new Error(`JARVISに接続できませんでした（${res.status}）: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() || "（応答を生成できませんでした）";
}

async function callGemini(apiKey: string, history: ChatTurn[], mode: JarvisMode): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
  const contents = [
    {
      role: "user",
      parts: [
        { text: `【システム指示】\n${buildJarvisSystemPrompt(mode)}\n\n${buildCompanyContext()}` },
      ],
    },
    { role: "model", parts: [{ text: "了解しました、CEO。指示に従います。" }] },
    ...history.slice(-16).map((h) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }],
    })),
  ];

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents }),
  });
  if (!res.ok) {
    const detail = await res.text();
    if (res.status === 429)
      throw new Error("Gemini APIのレート上限に達しました。少し待って再度お試しください。");
    throw new Error(`Gemini APIエラー（${res.status}）: ${detail.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "（応答を生成できませんでした）"
  );
}
