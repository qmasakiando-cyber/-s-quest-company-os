import { createFileRoute } from "@tanstack/react-router";

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

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("AIキーが設定されていません。", { status: 500 });

        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File) || file.size < 2048) {
          return new Response("音声が短すぎます。もう一度お試しください。", { status: 400 });
        }
        if (file.size > 20 * 1024 * 1024) {
          return new Response("音声ファイルが大きすぎます。", { status: 413 });
        }

        const upstream = new FormData();
        upstream.append("model", "openai/gpt-4o-mini-transcribe");
        upstream.append("file", file, "recording.wav");
        upstream.append("language", "ja");

        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: upstream,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          return new Response(`音声認識に失敗しました（${res.status}）: ${text.slice(0, 200)}`, {
            status: res.status,
          });
        }

        const data = (await res.json()) as { text?: string };
        return Response.json({ text: (data.text ?? "").trim() });
      },
    },
  },
});
