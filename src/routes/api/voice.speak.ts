import { createFileRoute } from "@tanstack/react-router";

// Geminiのネイティブ音声生成が使えるモデル。TTS対応モデルは通常のテキスト
// モデルとは別名なので、通常のチャットで使っている "gemini-3.6-flash" とは
// 別に定義する（Googleのカタログ更新時はここだけ直せばよい）。
const TTS_MODEL = "gemini-2.5-flash-preview-tts";

function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function parseSampleRate(mimeType: string | undefined): number {
  const rate = mimeType?.match(/rate=(\d+)/)?.[1];
  return rate ? parseInt(rate, 10) : 24000;
}

/**
 * Gemini音声生成は生のPCM16（モノラル）を返す。ブラウザの<audio>で再生できる
 * よう、44バイトのWAVヘッダーを付与してコンテナ化する。
 */
function pcmToWav(
  pcm: Uint8Array,
  sampleRate: number,
): Uint8Array<ArrayBuffer> {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44 + pcm.length);
  const view = new DataView(buffer);
  const writeString = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++)
      view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeString(0, "RIFF");
  view.setUint32(4, 36 + pcm.length, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, "data");
  view.setUint32(40, pcm.length, true);
  const bytes = new Uint8Array(buffer);
  bytes.set(pcm, 44);
  return bytes;
}

export const Route = createFileRoute("/api/voice/speak")({
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

        const body = (await request.json().catch(() => null)) as {
          text?: string;
        } | null;
        const text = (body?.text ?? "").trim().slice(0, 1200);
        if (!text)
          return new Response("読み上げるテキストがありません。", {
            status: 400,
          });

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `落ち着いた低めの声で、簡潔かつ知的な執事のように次のテキストを話してください：${text}`,
                    },
                  ],
                },
              ],
              generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: "Charon" } },
                },
              },
            }),
          },
        );

        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          return new Response(
            `音声合成に失敗しました（${res.status}）: ${detail.slice(0, 200)}`,
            {
              status: res.status,
            },
          );
        }

        const data = (await res.json()) as {
          candidates?: {
            content?: {
              parts?: { inlineData?: { data?: string; mimeType?: string } }[];
            };
          }[];
        };
        const inline = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        if (!inline?.data) {
          return new Response(
            "音声合成に失敗しました：音声データが返されませんでした。",
            { status: 502 },
          );
        }

        const pcm = base64ToBytes(inline.data);
        const wav = pcmToWav(pcm, parseSampleRate(inline.mimeType));

        return new Response(new Blob([wav], { type: "audio/wav" }), {
          headers: { "Content-Type": "audio/wav", "Cache-Control": "no-store" },
        });
      },
    },
  },
});
