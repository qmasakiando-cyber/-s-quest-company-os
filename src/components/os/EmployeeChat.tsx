import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Panel, SectionTitle, Tag } from "@/components/os/primitives";

interface Turn {
  id: number;
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}

interface Props {
  code: string;
  personaName: string;
  tone: string;
  /** 稼働状態の連動（'working' / 'idle'） */
  onStatusChange?: (status: "working" | "idle") => void;
}

export function EmployeeChat({ code, personaName, tone, onStatusChange }: Props) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const nextId = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, pending]);

  const send = async (raw: string) => {
    const value = raw.trim();
    if (!value || pending) return;
    const history = turns
      .filter((t) => !t.error)
      .map((t) => ({ role: t.role, content: t.content }));
    setTurns((t) => [...t, { id: nextId.current++, role: "user", content: value }]);
    setInput("");
    setPending(true);
    onStatusChange?.("working");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeCode: code,
          userMessage: value,
          conversationHistory: history,
        }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? `通信エラー（${res.status}）`);
      setTurns((t) => [
        ...t,
        { id: nextId.current++, role: "assistant", content: data.text ?? "" },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "応答の取得に失敗しました。";
      setTurns((t) => [
        ...t,
        { id: nextId.current++, role: "assistant", content: `⚠️ ${msg}`, error: true },
      ]);
    } finally {
      setPending(false);
      onStatusChange?.("idle");
    }
  };

  return (
    <Panel
      className="p-0"
      style={{ borderColor: `color-mix(in oklab, ${tone} 24%, var(--border))` }}
    >
      <div className="p-5 pb-0">
        <SectionTitle
          title={`${code}・${personaName} と会話する`}
          hint={pending ? "稼働中（WORKING）" : "待機中（IDLE）"}
        />
      </div>

      <div ref={scrollRef} className="max-h-[360px] space-y-4 overflow-y-auto px-5 py-4">
        {turns.length === 0 && !pending ? (
          <p className="text-sm text-muted-foreground">
            この社員に直接指示・相談できます。回答は担当領域のシステムプロンプトに基づきます。
          </p>
        ) : null}
        {turns.map((t) =>
          t.role === "user" ? (
            <div key={t.id} className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                {t.content}
              </div>
            </div>
          ) : (
            <div key={t.id} className="flex gap-3">
              <span
                className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg text-[11px] font-bold"
                style={{
                  background: `color-mix(in oklab, ${tone} 16%, transparent)`,
                  color: tone,
                }}
              >
                {code}
              </span>
              <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm leading-relaxed">
                {t.content}
              </p>
            </div>
          ),
        )}
        {pending ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            {code}・{personaName} が作業中です…
          </p>
        ) : null}
      </div>

      <div className="border-t border-border p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 p-2 focus-within:border-primary/60"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={pending}
            aria-label={`${code}への指示`}
            placeholder={`${personaName} に指示・相談する…`}
            className="h-9 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Send className="size-3.5" aria-hidden />
            )}
            送信
          </button>
        </form>
        <div className="mt-2">
          <Tag tone={tone}>{pending ? "WORKING" : "IDLE"}</Tag>
        </div>
      </div>
    </Panel>
  );
}
