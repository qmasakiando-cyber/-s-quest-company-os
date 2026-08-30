import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/os/AppShell";
import {
  PageHeader,
  Panel,
  SectionTitle,
  Tag,
} from "@/components/os/primitives";
import { useCompanyOsEntries } from "@/lib/use-company-os";
import type { CompanyOsEntry, CompanyOsStatus } from "@/lib/company-os.server";
import {
  OS_CATEGORIES,
  PLANTS,
  WEAPONS,
  type OsCategory,
} from "@/lib/company-data";

export const Route = createFileRoute("/company-os")({
  head: () => ({
    meta: [
      { title: "COMPANY OS — S-QUEST COMPANY" },
      {
        name: "description",
        content:
          "会社の記憶。COMPANY / BRAND / SERVICE / DIAGNOSIS / KPI / RULES / KNOWLEDGE をバージョン管理付きで一元管理。",
      },
      { property: "og:title", content: "COMPANY OS — S-QUEST COMPANY" },
      {
        property: "og:description",
        content:
          "Single Source of Truth。すべての更新に版・更新者・出典・確信度が残ります。",
      },
    ],
  }),
  component: CompanyOsPage,
});

const statusTone = (status: CompanyOsStatus) =>
  status === "ACTIVE"
    ? "var(--success)"
    : status === "REVIEW"
      ? "var(--emp-b)"
      : "var(--warning)";

function EntryCard({
  entry,
  onSave,
}: {
  entry: CompanyOsEntry;
  onSave: (value: string, status: CompanyOsStatus) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(entry.value);
  const [status, setStatus] = useState<CompanyOsStatus>(entry.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = () => {
    setValue(entry.value);
    setStatus(entry.status);
    setError(null);
    setEditing(true);
  };
  const cancel = () => {
    setEditing(false);
    setError(null);
  };
  const save = async () => {
    if (!value.trim()) {
      setError("値を入力してください。");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(value.trim(), status);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="rounded-xl border border-border bg-secondary/25 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{entry.key}</h3>
        <div className="flex items-center gap-2">
          {editing ? (
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CompanyOsStatus)}
              className="h-7 rounded-md border border-border bg-secondary/40 px-2 text-[11px] outline-none focus:border-primary/60"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="DRAFT">DRAFT</option>
              <option value="REVIEW">REVIEW</option>
            </select>
          ) : (
            <Tag tone={statusTone(entry.status)}>{entry.status}</Tag>
          )}
          <Tag tone="var(--muted-foreground)">v{entry.version}</Tag>
        </div>
      </div>

      {editing ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={3}
          className="mt-2 w-full rounded-lg border border-border bg-secondary/40 p-2 text-sm outline-none focus:border-primary/60"
        />
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-foreground/90">
          {entry.value}
        </p>
      )}

      {error ? (
        <p className="mt-2 text-xs text-destructive">⚠️ {error}</p>
      ) : null}

      <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
        <div>Updated by {entry.updatedBy}</div>
        <div>{entry.updatedAt.slice(0, 10)}</div>
        <div>Source {entry.source}</div>
        <div>Confidence {entry.confidence}%</div>
      </dl>

      <div className="mt-3 flex items-center gap-2">
        {editing ? (
          <>
            <button
              onClick={() => void save()}
              disabled={saving}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "保存しています…" : "保存"}
            </button>
            <button
              onClick={cancel}
              disabled={saving}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent disabled:opacity-50"
            >
              キャンセル
            </button>
          </>
        ) : (
          <button
            onClick={startEdit}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent"
          >
            編集
          </button>
        )}
      </div>
    </article>
  );
}

function AddEntryForm({
  onAdd,
}: {
  onAdd: (key: string, value: string) => Promise<void>;
}) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !value.trim()) {
      setError("項目名と値を入力してください。");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onAdd(key.trim(), value.trim());
      setKey("");
      setValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "追加に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="space-y-2 rounded-xl border border-dashed border-border p-4"
    >
      <p className="label-caps">新しい項目を追加</p>
      <input
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="項目名（例：Tagline）"
        className="h-9 w-full rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60"
      />
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={2}
        placeholder="値"
        className="w-full rounded-lg border border-border bg-secondary/40 p-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60"
      />
      {error ? <p className="text-xs text-destructive">⚠️ {error}</p> : null}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "追加しています…" : "追加"}
      </button>
    </form>
  );
}

function CompanyOsPage() {
  const [cat, setCat] = useState<OsCategory>("COMPANY");
  const { entries, loading, error, update } = useCompanyOsEntries();

  const categoryEntries = entries.filter((e) => e.category === cat);
  const countByCategory = (c: OsCategory) =>
    entries.filter((e) => e.category === c).length;
  const recentEntries = [...entries]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 8);

  const handleSave =
    (key: string) => async (value: string, status: CompanyOsStatus) => {
      await update({ category: cat, key, value, status });
    };
  const handleAdd = async (key: string, value: string) => {
    await update({ category: cat, key, value, status: "ACTIVE" });
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="唯一の正データ"
        title="COMPANY OS"
        description="AI社員は担当領域のみ WRITE 可能。重要な更新は CEO 承認を経て版が上がります。"
        actions={<Tag tone="var(--primary)">COMPANY OS</Tag>}
      />

      {error ? (
        <p className="mb-4 text-xs text-destructive">⚠️ {error}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[210px_minmax(0,1fr)_300px]">
        <Panel className="h-fit p-2">
          <nav className="space-y-0.5" aria-label="Company OS categories">
            {OS_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold tracking-wide transition-colors " +
                  (cat === c
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground")
                }
              >
                {c}
                <span className="num-display text-[10px] text-muted-foreground">
                  {countByCategory(c)}
                </span>
              </button>
            ))}
          </nav>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <SectionTitle
              title={`${cat} Editor`}
              hint="クリックして編集できます"
            />
            {loading && !entries.length ? (
              <p className="text-sm text-muted-foreground">読み込んでいます…</p>
            ) : (
              <div className="space-y-3">
                {categoryEntries.map((e) => (
                  <EntryCard key={e.key} entry={e} onSave={handleSave(e.key)} />
                ))}
                <AddEntryForm onAdd={handleAdd} />
              </div>
            )}
          </Panel>

          {cat === "DIAGNOSIS" || cat === "KNOWLEDGE" ? (
            <Panel>
              <SectionTitle
                title="マスターデータ"
                hint="16 TYPES / PLANT / WEAPON（正式名称は変更しない）"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {PLANTS.map((p) => (
                  <div
                    key={p.name}
                    className="rounded-xl border border-border p-4"
                  >
                    <p className="text-sm font-semibold tracking-[0.14em]">
                      {p.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.traits}
                    </p>
                    <ul className="mt-3 space-y-1 text-xs text-foreground/85">
                      {p.types.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                {WEAPONS.map((w) => (
                  <div
                    key={w.code}
                    className="rounded-xl border p-3"
                    style={{
                      borderColor: `color-mix(in oklab, ${w.color} 35%, transparent)`,
                    }}
                  >
                    <p
                      className="text-sm font-semibold"
                      style={{ color: w.color }}
                    >
                      {w.code}｜{w.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {w.theme}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}
        </div>

        <aside className="space-y-4">
          <Panel>
            <SectionTitle title="バージョン履歴" hint="直近の更新" />
            {recentEntries.length ? (
              <ol className="space-y-3 border-l border-border pl-4 text-xs">
                {recentEntries.map((e) => (
                  <li key={`${e.category}::${e.key}`}>
                    <div className="flex items-center gap-2">
                      <Tag tone="var(--primary)">v{e.version}</Tag>
                      <span className="text-muted-foreground">
                        {e.updatedAt.slice(0, 10)}
                      </span>
                    </div>
                    <p className="mt-1 text-foreground/85">
                      {e.category} / {e.key}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {e.updatedBy}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs text-muted-foreground">読み込んでいます…</p>
            )}
            <Link
              to="/audit"
              className="mt-4 block text-center text-xs text-muted-foreground hover:text-foreground"
            >
              すべての変更履歴を見る（監査ログ）→
            </Link>
          </Panel>

          <Panel>
            <SectionTitle title="アクセス権" />
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>CEO — FULL ACCESS</li>
              <li>JARVIS — ORCHESTRATOR ACCESS</li>
              <li>A〜F — 担当領域のみ WRITE</li>
            </ul>
          </Panel>
        </aside>
      </div>
    </AppShell>
  );
}
