import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/os/AppShell";
import {
  EmptyState,
  PageHeader,
  Panel,
  SectionTitle,
  SimulationBadge,
  Tag,
} from "@/components/os/primitives";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAiOutputs } from "@/lib/use-ai-outputs";
import { useTasks } from "@/lib/use-tasks";
import {
  OUTPUT_TYPES,
  empColor,
  employeeDisplayName,
  type AiOutput,
  type EmployeeCode,
} from "@/lib/company-data";

export const Route = createFileRoute("/outputs")({
  head: () => ({
    meta: [
      { title: "成果物管理 — S-QUEST COMPANY" },
      {
        name: "description",
        content:
          "AI社員（A〜F）が作成したレポート・企画書・施策案などの成果物を横断的に一覧・管理する。",
      },
      { property: "og:title", content: "成果物管理 — S-QUEST COMPANY" },
      {
        property: "og:description",
        content:
          "誰が・いつ・何を作ったかを横断的に確認できる、成果物そのものを読む場所。",
      },
    ],
  }),
  component: OutputsPage,
});

const EMPLOYEE_CODES: EmployeeCode[] = ["A", "B", "C", "D", "E", "F"];
const CUSTOM_OUTPUT_TYPE = "その他";

function OutputsPage() {
  const { outputs, loading, error, addOutput } = useAiOutputs();
  const { tasks } = useTasks();

  const [employeeFilter, setEmployeeFilter] = useState<EmployeeCode | "ALL">(
    "ALL",
  );
  const [keyword, setKeyword] = useState("");
  const [active, setActive] = useState<AiOutput | null>(null);

  const [formEmployee, setFormEmployee] = useState<EmployeeCode>("A");
  const [formTaskId, setFormTaskId] = useState<string>("");
  const [outputType, setOutputType] = useState<string>(OUTPUT_TYPES[0]);
  const [customOutputType, setCustomOutputType] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return outputs.filter((o) => {
      if (employeeFilter !== "ALL" && o.employeeCode !== employeeFilter)
        return false;
      if (kw && !o.title.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [outputs, employeeFilter, keyword]);

  const taskTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tasks) map.set(t.id, t.title);
    return map;
  }, [tasks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const effectiveType =
      outputType === CUSTOM_OUTPUT_TYPE ? customOutputType.trim() : outputType;
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const trimmedUrl = externalUrl.trim();

    if (!effectiveType) {
      setFormError("種別を入力してください。");
      return;
    }
    if (!trimmedTitle) {
      setFormError("タイトルを入力してください。");
      return;
    }
    if (!trimmedContent && !trimmedUrl) {
      setFormError("本文か外部URLのどちらかは入力してください。");
      return;
    }

    setSubmitting(true);
    try {
      await addOutput({
        employeeCode: formEmployee,
        taskId: formTaskId || null,
        outputType: effectiveType,
        title: trimmedTitle,
        content: trimmedContent || null,
        externalUrl: trimmedUrl || null,
      });
      toast.success("成果物を登録しました", {
        description: `${employeeDisplayName(formEmployee)} ・ ${trimmedTitle}`,
      });
      setFormTaskId("");
      setTitle("");
      setContent("");
      setExternalUrl("");
      if (outputType === CUSTOM_OUTPUT_TYPE) setCustomOutputType("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "成果物の登録に失敗しました。";
      setFormError(message);
      toast.error("成果物の登録に失敗しました", { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="AI社員"
        title="成果物管理"
        description="A〜Fが作成したレポート・企画書・施策案などの成果物を横断的に一覧・管理する。進行状態は「タスク」、社員個人の稼働状況は「AI社員」ページを参照。ここは成果物そのものを読む場所。"
        actions={<SimulationBadge />}
      />

      {error ? (
        <p className="mb-4 text-xs text-destructive">⚠️ {error}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Panel>
            <SectionTitle title="担当社員で絞り込み" />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setEmployeeFilter("ALL")}
                className={
                  "rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors " +
                  (employeeFilter === "ALL"
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground")
                }
              >
                ALL
              </button>
              {EMPLOYEE_CODES.map((code) => (
                <button
                  key={code}
                  onClick={() => setEmployeeFilter(code)}
                  className="rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors"
                  style={
                    employeeFilter === code
                      ? {
                          borderColor: `color-mix(in oklab, ${empColor(code)} 60%, transparent)`,
                          background: `color-mix(in oklab, ${empColor(code)} 15%, transparent)`,
                          color: empColor(code),
                        }
                      : {
                          borderColor: "var(--border)",
                          color: "var(--muted-foreground)",
                        }
                  }
                >
                  {code}
                </button>
              ))}
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="タイトルで検索…"
                className="ml-auto h-7 w-48 rounded-md border border-border bg-secondary/40 px-2.5 text-xs outline-none placeholder:text-muted-foreground focus:border-primary/60"
              />
            </div>
          </Panel>

          <Panel className="p-0">
            <div className="p-5 pb-0">
              <SectionTitle title="成果物一覧" hint={`${filtered.length}件`} />
            </div>
            {loading && !outputs.length ? (
              <p className="px-5 pb-5 text-sm text-muted-foreground">
                読み込んでいます…
              </p>
            ) : filtered.length ? (
              <ul className="divide-y divide-border">
                {filtered.map((o) => (
                  <li key={o.id}>
                    <button
                      onClick={() => setActive(o)}
                      className="flex w-full flex-wrap items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-accent/40"
                    >
                      <span
                        className="grid size-6 shrink-0 place-items-center rounded-md text-[10px] font-bold"
                        style={{
                          background: `color-mix(in oklab, ${empColor(o.employeeCode)} 16%, transparent)`,
                          color: empColor(o.employeeCode),
                        }}
                      >
                        {o.employeeCode}
                      </span>
                      <Tag tone="var(--primary)">{o.outputType}</Tag>
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground/90">
                        {o.title}
                      </span>
                      {o.taskId ? (
                        <span className="num-display shrink-0 text-[11px] text-muted-foreground">
                          {o.taskId}
                        </span>
                      ) : null}
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {o.createdAt.slice(0, 10)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-5">
                <EmptyState
                  title="成果物がありません"
                  body="右のフォームから最初の成果物を登録してください。"
                />
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel>
            <SectionTitle title="成果物を登録" />
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
              <div>
                <label className="label-caps mb-1.5 block">担当社員</label>
                <select
                  value={formEmployee}
                  onChange={(e) =>
                    setFormEmployee(e.target.value as EmployeeCode)
                  }
                  className="h-9 w-full rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none focus:border-primary/60"
                >
                  {EMPLOYEE_CODES.map((code) => (
                    <option key={code} value={code}>
                      {employeeDisplayName(code)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-caps mb-1.5 block">
                  関連タスク（任意）
                </label>
                <select
                  value={formTaskId}
                  onChange={(e) => setFormTaskId(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none focus:border-primary/60"
                >
                  <option value="">紐付けなし</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.id} ・ {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-caps mb-1.5 block">種別</label>
                <select
                  value={outputType}
                  onChange={(e) => setOutputType(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none focus:border-primary/60"
                >
                  {OUTPUT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {outputType === CUSTOM_OUTPUT_TYPE ? (
                  <input
                    value={customOutputType}
                    onChange={(e) => setCustomOutputType(e.target.value)}
                    placeholder="種別名を入力"
                    className="mt-2 h-9 w-full rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60"
                  />
                ) : null}
              </div>

              <div>
                <label className="label-caps mb-1.5 block">タイトル</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例：Revenue Gap 要因分析レポート"
                  className="h-9 w-full rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60"
                />
              </div>

              <div>
                <label className="label-caps mb-1.5 block">本文（任意）</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  placeholder="成果物の本文をそのまま貼り付ける"
                  className="w-full resize-none rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60"
                />
              </div>

              <div>
                <label className="label-caps mb-1.5 block">
                  外部URL（任意）
                </label>
                <input
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="例：https://..."
                  className="h-9 w-full rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60"
                />
              </div>

              {formError ? (
                <p className="text-xs text-destructive">⚠️ {formError}</p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "登録中…" : "登録する"}
              </button>
            </form>
          </Panel>
        </div>
      </div>

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {active ? (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <Tag tone={empColor(active.employeeCode)}>
                    {employeeDisplayName(active.employeeCode)}
                  </Tag>
                  <Tag tone="var(--primary)">{active.outputType}</Tag>
                </div>
                <SheetTitle className="text-lg">{active.title}</SheetTitle>
              </SheetHeader>
              <div className="space-y-5 p-4 pt-0">
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-border bg-secondary/30 p-3">
                    <dt className="label-caps">登録日</dt>
                    <dd className="mt-1 text-foreground/90">
                      {active.createdAt.slice(0, 10)}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-border bg-secondary/30 p-3">
                    <dt className="label-caps">関連タスク</dt>
                    <dd className="mt-1 text-foreground/90">
                      {active.taskId
                        ? `${active.taskId} ・ ${taskTitleById.get(active.taskId) ?? "—"}`
                        : "紐付けなし"}
                    </dd>
                  </div>
                </dl>

                {active.externalUrl ? (
                  <div>
                    <p className="label-caps mb-2">外部URL</p>
                    <a
                      href={active.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-sm text-primary underline underline-offset-2"
                    >
                      {active.externalUrl}
                    </a>
                  </div>
                ) : null}

                <div>
                  <p className="label-caps mb-2">本文</p>
                  {active.content ? (
                    <p className="whitespace-pre-wrap rounded-xl border border-border bg-secondary/30 p-3 text-sm text-foreground/90">
                      {active.content}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      本文は登録されていません。
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
