import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/voice/speak")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("AIキーが設定されていません。", { status: 500 });

        const body = (await request.json().catch(() => null)) as { text?: string } | null;
        const text = (body?.text ?? "").trim().slice(0, 1200);
        if (!text) return new Response("読み上げるテキストがありません。", { status: 400 });

        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            input: text,
            voice: "onyx",
            response_format: "mp3",
            instructions: "落ち着いた低めの声で、簡潔かつ知的な執事のように話す。",
          }),
        });

        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          return new Response(`音声合成に失敗しました（${res.status}）: ${detail.slice(0, 200)}`, {
            status: res.status,
          });
        }

        return new Response(res.body, {
          headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
        });
      },
    },
  },
});
