/**
 * 音声入出力（クライアント専用）
 * 録音は Web Audio で PCM を取得し、完全な WAV としてアップロードする。
 */
import { useCallback, useEffect, useRef, useState } from "react";

function encodeWav(chunks: Float32Array[], sampleRate: number, target = 16000): Blob {
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const merged = new Float32Array(total);
  let o = 0;
  for (const c of chunks) {
    merged.set(c, o);
    o += c.length;
  }
  const ratio = sampleRate / target;
  const outLength = Math.floor(total / ratio);
  const buffer = new ArrayBuffer(44 + outLength * 2);
  const view = new DataView(buffer);
  const str = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i += 1) view.setUint8(offset + i, s.charCodeAt(i));
  };
  str(0, "RIFF");
  view.setUint32(4, 36 + outLength * 2, true);
  str(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, target, true);
  view.setUint32(28, target * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  str(36, "data");
  view.setUint32(40, outLength * 2, true);
  for (let i = 0; i < outLength; i += 1) {
    const s = Math.max(-1, Math.min(1, merged[Math.floor(i * ratio)] ?? 0));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

export function useVoiceInput(onTranscript: (text: string) => void) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const refs = useRef<{
    stream?: MediaStream;
    ctx?: AudioContext;
    node?: ScriptProcessorNode;
    source?: MediaStreamAudioSourceNode;
    pcm: Float32Array[];
  }>({ pcm: [] });

  const cleanup = useCallback(() => {
    const r = refs.current;
    r.stream?.getTracks().forEach((t) => t.stop());
    r.node?.disconnect();
    r.source?.disconnect();
    void r.ctx?.close().catch(() => {});
    refs.current = { pcm: [] };
    setLevel(0);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const node = ctx.createScriptProcessor(4096, 1, 1);
      const pcm: Float32Array[] = [];
      node.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        pcm.push(new Float32Array(input));
        let peak = 0;
        for (let i = 0; i < input.length; i += 64) peak = Math.max(peak, Math.abs(input[i] ?? 0));
        setLevel(peak);
      };
      source.connect(node);
      node.connect(ctx.destination);
      refs.current = { stream, ctx, node, source, pcm };
      setRecording(true);
    } catch {
      setError("マイクへのアクセスが許可されていません。");
    }
  }, []);

  const stop = useCallback(async () => {
    const r = refs.current;
    const rate = r.ctx?.sampleRate ?? 48000;
    const pcm = r.pcm;
    setRecording(false);
    cleanup();
    const blob = encodeWav(pcm, rate);
    if (blob.size < 2048) {
      setError("録音が短すぎます。もう一度お試しください。");
      return;
    }
    setTranscribing(true);
    try {
      const form = new FormData();
      form.append("file", blob, "recording.wav");
      const res = await fetch("/api/voice/transcribe", { method: "POST", body: form });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      const { text } = (await res.json()) as { text: string };
      if (!text) {
        setError("音声を認識できませんでした。もう一度お試しください。");
        return;
      }
      onTranscript(text);
    } catch {
      setError("音声認識に接続できませんでした。");
    } finally {
      setTranscribing(false);
    }
  }, [cleanup, onTranscript]);

  return { recording, transcribing, error, level, start, stop, clearError: () => setError(null) };
}

export function useVoiceOutput() {
  const [enabled, setEnabled] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!enabled || !text.trim()) return;
      stop();
      try {
        const res = await fetch("/api/voice/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) return;
        const url = URL.createObjectURL(await res.blob());
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          URL.revokeObjectURL(url);
          setSpeaking(false);
        };
        setSpeaking(true);
        await audio.play();
      } catch {
        setSpeaking(false);
      }
    },
    [enabled, stop],
  );

  useEffect(() => stop, [stop]);

  return { enabled, setEnabled, speaking, speak, stop };
}
