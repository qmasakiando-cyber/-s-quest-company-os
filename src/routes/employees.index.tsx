import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/os/AppShell";
import { EmployeeCard } from "@/components/os/EmployeeCard";
import { PageHeader, Panel, SimulationBadge, Tag } from "@/components/os/primitives";
import { EMPLOYEES, type EmployeeCode, type EmployeeStatus } from "@/lib/company-data";
import { listEmployeeLiveStatesFn } from "@/lib/employees.functions";

export const Route = createFileRoute("/employees/")({
  head: () => ({
    meta: [
      { title: "AI Employees A–F — S-QUEST COMPANY" },
      {
        name: "description",
        content:
          "RESEARCH / STRATEGY / CREATIVE / SALES / MARKETING / QA の6人のAI社員。状態・担当タスク・権限・実績を一覧で確認。",
      },
      { property: "og:title", content: "AI Employees A–F — S-QUEST COMPANY" },
      {
        property: "og:description",
        content: "6人のAI社員がそれぞれの専門領域を担当し、JARVIS経由で連携します。",
      },
    ],
  }),
  component: EmployeesPage,
});

function EmployeesPage() {
  // 稼働状況（status・progress）は Supabase の ai_employees から読み込む（表示のみ、書き込みなし）
  const [liveStates, setLiveStates] = useState<
    Record<EmployeeCode, { status: EmployeeStatus; progress: number }>
  >({} as Record<EmployeeCode, { status: EmployeeStatus; progress: number }>);
  const listLiveStates = useServerFn(listEmployeeLiveStatesFn);
  useEffect(() => {
    let cancelled = false;
    listLiveStates()
      .then((states) => {
        if (cancelled) return;
        const map = Object.fromEntries(
          states.map((s) => [s.code, { status: s.status, progress: s.progress }]),
        ) as Record<EmployeeCode, { status: EmployeeStatus; progress: number }>;
        setLiveStates(map);
      })
      .catch(() => {
        // Supabase未到達時は company-data.ts の静的値にフォールバックする
      });
    return () => {
      cancelled = true;
    };
  }, [listLiveStates]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="組織"
        title="AI社員"
        description="AI社員はCEO権限を持ちません。外部公開・送信・支払い・削除はすべてCEO承認が必要です。"
        actions={<SimulationBadge />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {EMPLOYEES.map((e) => {
          const live = liveStates[e.code];
          const employee = live ? { ...e, status: live.status, progress: live.progress } : e;
          return <EmployeeCard key={e.code} employee={employee} />;
        })}
      </div>

      <Panel className="mt-8 overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              {["Employee", "Role", "タスク", "Success", "QA Pass", "WRITE Scope"].map((h) => (
                <th key={h} className="label-caps px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EMPLOYEES.map((e) => (
              <tr key={e.code} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3">
                  <Tag tone={e.accent}>
                    {e.code}｜{e.name}
                  </Tag>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{e.role}</td>
                <td className="num-display px-4 py-3">{e.performance.tasksCompleted}</td>
                <td className="num-display px-4 py-3">{e.performance.successRate}%</td>
                <td className="num-display px-4 py-3">{e.performance.qaPassRate}%</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {e.permissions.write.join(" / ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </AppShell>
  );
}
