import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/os/AppShell";
import { DemoDataBadge, PageHeader, Panel, SectionTitle, Tag } from "@/components/os/primitives";
import {
  COMPANY_OS,
  OS_CATEGORIES,
  OS_VERSIONS,
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
        content: "Single Source of Truth。すべての更新に版・更新者・出典・確信度が残ります。",
      },
    ],
  }),
  component: CompanyOsPage,
});

function CompanyOsPage() {
  const [cat, setCat] = useState<OsCategory>("COMPANY");
  const entries = COMPANY_OS[cat];

  return (
    <AppShell>
      <PageHeader
        eyebrow="唯一の正データ"
        title="COMPANY OS"
        description="AI社員は担当領域のみ WRITE 可能。重要な更新は CEO 承認を経て版が上がります。"
        actions={
          <>
            <DemoDataBadge />
            <Tag tone="var(--primary)">COMPANY OS v1.0</Tag>
          </>
        }
      />

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
                  {COMPANY_OS[c].length}
                </span>
              </button>
            ))}
          </nav>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <SectionTitle title={`${cat} Editor`} hint="Notion / Linear のような編集体験（読み取り専用デモ）" />
            <div className="space-y-3">
              {entries.map((e) => (
                <article key={e.key} className="rounded-xl border border-border bg-secondary/25 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">{e.key}</h3>
                    <div className="flex items-center gap-2">
                      <Tag
                        tone={
                          e.status === "ACTIVE"
                            ? "var(--success)"
                            : e.status === "REVIEW"
                              ? "var(--emp-b)"
                              : "var(--warning)"
                        }
                      >
                        {e.status}
                      </Tag>
                      <Tag tone="var(--muted-foreground)">{e.version}</Tag>
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/90">{e.value}</p>
                  <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
                    <div>Updated by {e.updatedBy}</div>
                    <div>{e.updatedAt}</div>
                    <div>Source {e.source}</div>
                    <div>Confidence {e.confidence}%</div>
                  </dl>
                </article>
              ))}
            </div>
          </Panel>

          {cat === "DIAGNOSIS" || cat === "KNOWLEDGE" ? (
            <Panel>
              <SectionTitle title="マスターデータ" hint="16 TYPES / PLANT / WEAPON（正式名称は変更しない）" />
              <div className="grid gap-3 sm:grid-cols-2">
                {PLANTS.map((p) => (
                  <div key={p.name} className="rounded-xl border border-border p-4">
                    <p className="text-sm font-semibold tracking-[0.14em]">{p.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{p.traits}</p>
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
                    style={{ borderColor: `color-mix(in oklab, ${w.color} 35%, transparent)` }}
                  >
                    <p className="text-sm font-semibold" style={{ color: w.color }}>
                      {w.code}｜{w.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{w.theme}</p>
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}
        </div>

        <aside className="space-y-4">
          <Panel>
            <SectionTitle title="バージョン履歴" />
            <ol className="space-y-3 border-l border-border pl-4 text-xs">
              {OS_VERSIONS.map((v) => (
                <li key={v.version}>
                  <div className="flex items-center gap-2">
                    <Tag tone="var(--primary)">{v.version}</Tag>
                    <span className="text-muted-foreground">{v.date}</span>
                  </div>
                  <p className="mt-1 text-foreground/85">{v.change}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {v.by} · {v.category}
                  </p>
                </li>
              ))}
            </ol>
            <button className="mt-4 w-full rounded-lg border border-border py-2 text-xs font-semibold hover:bg-accent">
              View changes
            </button>
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
