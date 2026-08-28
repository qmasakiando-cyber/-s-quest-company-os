import { Link } from "@tanstack/react-router";
import { Meter } from "./primitives";
import { PixelDesk } from "./PixelDesk";
import { AI_EMPLOYEES, getWorkingCaption } from "@/lib/company-data";
import { LIVE_STATUS_LABEL, LIVE_STATUS_TONE, type LiveEmployee } from "@/lib/demo-mode";

export function DeskCard({
  employee,
  linked,
}: {
  employee: LiveEmployee;
  linked?: "in" | "out" | null;
}) {
  const tone = employee.status === "ERROR" ? "var(--destructive)" : employee.accent;
  const statusTone = LIVE_STATUS_TONE[employee.status];
  const profile = AI_EMPLOYEES[employee.code];

  return (
    <article
      className="panel relative overflow-hidden p-4 transition-transform duration-300 hover:-translate-y-0.5"
      style={{
        borderColor: linked
          ? `color-mix(in oklab, ${tone} 60%, var(--border))`
          : `color-mix(in oklab, ${tone} 20%, var(--border))`,
        boxShadow: linked ? `0 0 0 1px color-mix(in oklab, ${tone} 40%, transparent)` : undefined,
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${tone}, transparent)` }}
      />

      <header className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="grid size-7 place-items-center rounded-md text-[11px] font-bold"
            style={{
              background: `color-mix(in oklab, ${tone} 16%, transparent)`,
              color: tone,
              border: `1px solid color-mix(in oklab, ${tone} 36%, transparent)`,
            }}
          >
            {employee.code}
          </span>
          <div>
            <h3 className="text-[13px] font-semibold tracking-wide">
              {employee.code}・{profile.name}
            </h3>
            <p className="text-[10px] text-muted-foreground">
              {employee.name}／Lv.{employee.level}
            </p>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
          style={{
            color: statusTone,
            borderColor: `color-mix(in oklab, ${statusTone} 40%, transparent)`,
            background: `color-mix(in oklab, ${statusTone} 10%, transparent)`,
          }}
        >
          <span className="size-1.5 rounded-full bg-current" />
          {LIVE_STATUS_LABEL[employee.status]}
        </span>
      </header>

      {/* pixel office scene */}
      <div
        className="mt-3 overflow-hidden rounded-lg border"
        style={{
          borderColor: `color-mix(in oklab, ${tone} 18%, var(--border))`,
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--secondary) 60%, transparent), transparent)",
        }}
      >
        <PixelDesk
          code={employee.code}
          status={employee.status}
          personaName={profile.name}
        />
      </div>

      <p className="mt-3 text-[11px]" style={{ color: statusTone }}>
        {LIVE_STATUS_LABEL[employee.status]}
      </p>
      <p className="mt-0.5 text-[10px] italic text-muted-foreground">
        {getWorkingCaption(employee.code, employee.status)}
      </p>
      <p className="mt-1 line-clamp-2 text-[13px] text-foreground/90">{employee.currentTask}</p>
      <p className="mt-1 text-[10px] text-muted-foreground">{profile.department}</p>

      <Meter className="mt-3" value={employee.progress} tone={tone} label="進捗" />

      <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] text-muted-foreground">
        <div>
          <dt>本日</dt>
          <dd className="num-display text-xs text-foreground">{employee.todayTasks}</dd>
        </div>
        <div>
          <dt>完了</dt>
          <dd className="num-display text-xs text-foreground">{employee.completedToday}</dd>
        </div>
        <div>
          <dt>経験値</dt>
          <dd className="num-display text-xs text-foreground">
            {Math.round((employee.xp / employee.xpNext) * 100)}%
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{employee.lastActivity}</span>
        <Link
          to="/employees/$code"
          params={{ code: employee.code }}
          className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-accent"
        >
          社員を開く
        </Link>
      </div>
    </article>
  );
}
