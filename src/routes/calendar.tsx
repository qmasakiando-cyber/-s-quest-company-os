import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/os/AppShell";
import {
  PageHeader,
  Panel,
  SimulationBadge,
  Tag,
} from "@/components/os/primitives";
import { useCalendar } from "@/lib/use-calendar";
import { empColor } from "@/lib/company-data";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — S-QUEST COMPANY" },
      {
        name: "description",
        content:
          "会議・タスク・Workflow・Deadline・承認予定を統合したAI COMPANYのカレンダー。",
      },
      { property: "og:title", content: "Calendar — S-QUEST COMPANY" },
      {
        property: "og:description",
        content: "AI社員の予定とWorkflow実行予定を1つのタイムラインで管理。",
      },
    ],
  }),
  component: CalendarPage,
});

const kindTone = (kind: string) =>
  kind === "Workflow"
    ? "var(--primary)"
    : kind === "Approval"
      ? "var(--warning)"
      : kind === "期限"
        ? "var(--destructive)"
        : kind === "Report"
          ? "var(--emp-b)"
          : "var(--info)";

function CalendarPage() {
  const [mode, setMode] = useState<"Month" | "Week" | "Day">("Week");
  const { days: allDays, loading, error } = useCalendar();
  const days = mode === "Day" ? allDays.slice(0, 1) : allDays;

  return (
    <AppShell>
      <PageHeader
        eyebrow="スケジュール"
        title="カレンダー"
        description="タスク・会議・Workflow・Deadline を統合表示します。"
        actions={
          <>
            <SimulationBadge />
            <div className="flex rounded-lg border border-border p-1">
              {(["Month", "Week", "Day"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={
                    "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors " +
                    (mode === m
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground")
                  }
                >
                  {m}
                </button>
              ))}
            </div>
          </>
        }
      />

      {error ? (
        <p className="mb-3 text-xs text-destructive">⚠️ {error}</p>
      ) : null}
      {loading && !days.length ? (
        <p className="mb-3 text-xs text-muted-foreground">
          カレンダーを読み込んでいます…
        </p>
      ) : null}

      <div
        className={
          mode === "Month"
            ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        }
      >
        {days.map((d) => (
          <Panel key={d.date} className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="label-caps">{d.day}</p>
              <span className="num-display text-xs text-muted-foreground">
                {d.date}
              </span>
            </div>
            <ul className="space-y-2">
              {d.items.map((i) => (
                <li
                  key={i.time + i.title}
                  className="rounded-xl border px-3 py-2"
                  style={
                    i.source === "google"
                      ? {
                          borderColor:
                            "color-mix(in oklab, #4285F4 35%, var(--border))",
                          background:
                            "color-mix(in oklab, #4285F4 6%, var(--secondary))",
                        }
                      : {
                          borderColor: "var(--border)",
                          background:
                            "color-mix(in oklab, var(--secondary) 25%, transparent)",
                        }
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="num-display text-xs text-muted-foreground">
                      {i.time}
                    </span>
                    {i.source === "google" ? (
                      <Tag tone="#4285F4">Google</Tag>
                    ) : (
                      <Tag tone={kindTone(i.kind)}>{i.kind}</Tag>
                    )}
                  </div>
                  <p className="mt-1 text-sm">{i.title}</p>
                  {i.source === "google" ? null : (
                    <div className="mt-1.5">
                      <Tag tone={empColor(i.who)}>{i.who}</Tag>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </AppShell>
  );
}
