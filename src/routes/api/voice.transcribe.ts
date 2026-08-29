import { createFileRoute } from "@tanstack/react-router";

// 通常のチャットで使っているのと同じテキストモデル。Gemini flash系はテキスト
// と同じモデルで音声入力（マルチモーダル）にも対応している。
const TRANSCRIBE_MODEL = "gemini-3.6-flash";

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export const Route = createFileRoute("/api/voice/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { requireCeoAuth } = await import("@/lib/auth.server");
          await requireCeoAuth();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "認証に失敗しました。";
          return new Response(message, { status: 401 });
        }

        const apiKey = process.env["GEMINI_API_KEY"];
        if (!apiKey)
          return new Response("AIキーが設定されていません。", { status: 500 });

        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File) || file.size < 2048) {
          return new Response("音声が短すぎます。もう一度お試しください。", {
            status: 400,
          });
        }
        if (file.size > 20 * 1024 * 1024) {
          return new Response("音声ファイルが大きすぎます。", { status: 413 });
        }

        const bytes = new Uint8Array(await file.arrayBuffer());
        const base64Audio = bytesToBase64(bytes);

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${TRANSCRIBE_MODEL}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: "次の音声を日本語でそのまま文字起こししてください。話されている内容の文字起こし結果だけを出力し、前置き・説明・要約は付けないでください。",
                    },
                    {
                      inlineData: { mimeType: "audio/wav", data: base64Audio },
                    },
                  ],
                },
              ],
            }),
          },
        );

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          return new Response(
            `音声認識に失敗しました（${res.status}）: ${text.slice(0, 200)}`,
            {
              status: res.status,
            },
          );
        }

        const data = (await res.json()) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        const text = (data.candidates?.[0]?.content?.parts ?? [])
          .map((p) => p.text ?? "")
          .join("")
          .trim();
        return Response.json({ text });
      },
    },
  },
});
