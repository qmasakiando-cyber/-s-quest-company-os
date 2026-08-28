import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { AppShell } from "@/components/os/AppShell";
import { Meter, PageHeader, Panel, SectionTitle, SimulationBadge, Tag } from "@/components/os/primitives";
import { useWorkflows } from "@/lib/use-workflows";
import { empColor } from "@/lib/company-data";

export const Route = createFileRoute("/workflows")({
  head: () => ({
    meta: [
      { title: "Workflows — S-QUEST COMPANY" },
      {
        name: "description",
        content:
          "WF-01〜WF-06。Trigger / Processing / Output / Approval Gate / Failure Branch / OS Update を持つAI社員連携Workflow。",
      },
      { property: "og:title", content: "Workflows — S-QUEST COMPANY" },
      {
        property: "og:description",
        content: "AI社員同士は直接通信せず、必ずJARVISを経由して連携します。",
      },
    ],
  }),
  component: WorkflowsPage,
});

const nodeTone = (node: string) => {
  if (node.startsWith("TRIGGER")) return "var(--info)";
  if (node.startsWith("JARVIS")) return "var(--primary)";
  if (node.includes("APPROVAL")) return "var(--warning)";
  if (node.includes("COMPANY OS")) return "var(--emp-b)";
  const code = node.charAt(0);
  return empColor(code);
};

function WorkflowsPage() {
  const { workflows: WORKFLOWS, loading, error } = useWorkflows();
  const [open, setOpen] = useState<string | null>(null);
  const autoOpened = useRef(false);
  useEffect(() => {
    if (!autoOpened.current && WORKFLOWS.length) {
      autoOpened.current = true;
      setOpen(WORKFLOWS[0]!.code);
    }
  }, [WORKFLOWS]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="オーケストレーション"
        title="ワークフロー"
        description="Workflowは常に JARVIS を中心に流れます。重要操作の前には必ず承認ゲートが入ります。"
        actions={<SimulationBadge />}
      />

      {error ? <p className="mb-3 text-xs text-destructive">⚠️ {error}</p> : null}
      {loading && !WORKFLOWS.length ? (
        <p className="mb-3 text-xs text-muted-foreground">ワークフローを読み込んでいます…</p>
      ) : null}

      <div className="space-y-4">
        {WORKFLOWS.map((w) => {
          const expanded = open === w.code;
          return (
            <Panel key={w.code} className="p-0">
              <button
                onClick={() => setOpen(expanded ? null : w.code)}
                aria-expanded={expanded}
                className="flex w-full flex-wrap items-center gap-4 p-5 text-left"
              >
                <span className="num-display text-sm font-semibold text-primary">{w.code}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{w.name}</span>
                  <span className="block text-xs text-muted-foreground">{w.description}</span>
                </span>
                <Tag
                  tone={
                    w.status === "ACTIVE"
                      ? "var(--success)"
                      : w.status === "FAILED"
                        ? "var(--destructive)"
                        : "var(--muted-foreground)"
                  }
                >
                  {w.status}
                </Tag>
                <span className="text-[11px] text-muted-foreground">
                  {w.runs} runs · {w.successRate}%
                </span>
                <Tag tone="var(--muted-foreground)">{w.version}</Tag>
                <ChevronDown
                  className={"size-4 transition-transform " + (expanded ? "rotate-180" : "")}
                  aria-hidden
                />
              </button>

              {expanded ? (
                <div className="space-y-6 border-t border-border p-5">
                  {/* Diagram */}
                  <div>
                    <p className="label-caps mb-3">ワークフロー図</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {w.diagram.map((node, i) => (
                        <div key={node + i} className="flex items-center gap-2">
                          <span
                            className="rounded-xl border px-3 py-2 text-[11px] font-semibold"
                            style={{
                              borderColor: `color-mix(in oklab, ${nodeTone(node)} 40%, transparent)`,
                              background: `color-mix(in oklab, ${nodeTone(node)} 10%, transparent)`,
                              color: nodeTone(node),
                            }}
                          >
                            {node}
                          </span>
                          {i < w.diagram.length - 1 ? (
                            <span className="text-muted-foreground">→</span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Meter value={w.successRate} label="Success rate" />

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {[
                      ["Trigger", w.trigger],
                      ["Input", w.input],
                      ["Output", w.output],
                      ["Approval Gate", w.approvalGate],
                      ["Failure Branch", w.failureBranch],
                      ["OS Update", w.osUpdate],
                      ["Retry Rule", w.retry],
                      ["Timeout", w.timeout],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-xl border border-border bg-secondary/25 p-3">
                        <p className="label-caps">{k}</p>
                        <p className="mt-1 text-sm text-foreground/90">{v}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <SectionTitle title="処理内容" />
                    <ol className="space-y-2 border-l border-border pl-4 text-sm">
                      {w.processing.map((p, i) => (
                        <li key={p} className="text-foreground/90">
                          <span className="num-display mr-2 text-xs text-muted-foreground">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {p}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="flex gap-2">
                    <button className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90">
                      Run workflow
                    </button>
                    <button className="rounded-lg border border-border px-4 py-2 text-xs font-semibold hover:bg-accent">
                      View audit log
                    </button>
                  </div>
                </div>
              ) : null}
            </Panel>
          );
        })}
      </div>
    </AppShell>
  );
}
