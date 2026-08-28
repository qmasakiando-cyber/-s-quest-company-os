import { Link } from "@tanstack/react-router";
import { AI_EMPLOYEES, getWorkingCaption, type AIEmployee } from "@/lib/company-data";
import { Meter, StatusPill } from "./primitives";

export function EmployeeCard({ employee }: { employee: AIEmployee }) {
  const tone = employee.accent;
  const profile = AI_EMPLOYEES[employee.code];

  return (
    <article
      className="panel group relative overflow-hidden p-5 transition-transform duration-300 hover:-translate-y-0.5"
      style={{ borderColor: `color-mix(in oklab, ${tone} 22%, var(--border))` }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${tone}, transparent)` }}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="grid size-11 place-items-center rounded-xl border text-base font-semibold"
            style={{
              borderColor: `color-mix(in oklab, ${tone} 40%, transparent)`,
              background: `color-mix(in oklab, ${tone} 14%, transparent)`,
              color: tone,
            }}
          >
            {employee.code}
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide">
              {employee.code}・{profile.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {employee.name}／{profile.department}
            </p>
          </div>
        </div>
        <StatusPill status={employee.status} />
      </div>

      <p className="mt-4 line-clamp-2 text-[11px] text-muted-foreground">{profile.persona}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {profile.skills.slice(0, 3).map((s) => (
          <span
            key={s}
            className="rounded-full border px-2 py-0.5 text-[10px]"
            style={{
              borderColor: `color-mix(in oklab, ${tone} 32%, transparent)`,
              color: tone,
            }}
          >
            {s}
          </span>
        ))}
      </div>

      <dl className="mt-4 space-y-1">
        <dt className="label-caps">現在のタスク</dt>
        <dd className="text-sm text-foreground/90">{employee.currentTask}</dd>
      </dl>

      <Meter
        className="mt-4"
        value={employee.progress}
        tone={tone}
        label={getWorkingCaption(employee.code, employee.status)}
      />

      <div className="mt-4 rounded-xl border border-border bg-secondary/30 px-3 py-2 text-[11px]">
        <p className="text-muted-foreground">{profile.kpi.label}</p>
        <p className="num-display mt-0.5">
          {profile.kpi.value}
          <span className="ml-1 text-muted-foreground">/ 目標 {profile.kpi.target}</span>
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="label-caps">ワークフロー</p>
          <p className="mt-1 truncate text-foreground/80">{employee.workflow}</p>
        </div>
        <div>
          <p className="label-caps">本日完了</p>
          <p className="num-display mt-1 text-foreground/80">{employee.completedToday}</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          最終活動 · {employee.lastActivity}
        </span>
        <Link
          to="/employees/$code"
          params={{ code: employee.code }}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-accent"
        >
          詳細を開く
        </Link>
      </div>
    </article>
  );
}
