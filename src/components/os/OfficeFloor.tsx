import { DeskCard } from "./DeskCard";
import { QuestCore } from "./QuestCore";
import type { EmployeeCode } from "@/lib/company-data";
import type { Handoff, LiveEmployee, QuestState } from "@/lib/demo-mode";

const ORDER: EmployeeCode[] = ["A", "B", "C", "D", "E", "F"];
/** viewBox width used by the connector strip (6 columns of 100 units). */
const W = 600;
const BUS_Y = 24;
const centerX = (i: number) => (i + 0.5) * (W / ORDER.length);

function CommandLines({
  employees,
  handoff,
}: {
  employees: LiveEmployee[];
  handoff: Handoff | null;
}) {
  const activeCode =
    handoff?.from !== "JARVIS"
      ? (handoff?.from as EmployeeCode | undefined)
      : (handoff?.to as EmployeeCode | undefined);

  return (
    <svg
      className="pointer-events-none absolute inset-0 size-full"
      viewBox={`0 0 ${W} 64`}
      preserveAspectRatio="none"
      aria-hidden
    >
      {/* trunk from JARVIS */}
      <line
        x1={W / 2}
        y1={0}
        x2={W / 2}
        y2={BUS_Y}
        stroke="var(--primary)"
        strokeWidth={1.5}
        strokeDasharray="4 4"
        vectorEffect="non-scaling-stroke"
        className={handoff ? "animate-line-flow" : undefined}
        opacity={0.9}
      />
      {/* horizontal command bus */}
      <line
        x1={centerX(0)}
        y1={BUS_Y}
        x2={centerX(ORDER.length - 1)}
        y2={BUS_Y}
        stroke="var(--primary)"
        strokeWidth={1.2}
        vectorEffect="non-scaling-stroke"
        opacity={0.55}
      />
      {/* drops to each desk */}
      {employees.map((e, i) => {
        const cx = centerX(i);
        const on = activeCode === e.code;
        const tone = e.status === "ERROR" ? "var(--destructive)" : e.accent;
        return (
          <g key={e.code}>
            <line
              x1={cx}
              y1={BUS_Y}
              x2={cx}
              y2={64}
              stroke={tone}
              strokeWidth={on ? 1.8 : 1}
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
              opacity={on ? 1 : 0.35}
              className={on ? "animate-line-flow" : undefined}
            />
            <circle cx={cx} cy={BUS_Y} r={2.2} fill={tone} opacity={on ? 1 : 0.5} />
            {on ? (
              <circle cx={cx} cy={BUS_Y} r={2.2} fill={tone}>
                <animate attributeName="r" values="2.2;5;2.2" dur="1.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.15;1" dur="1.2s" repeatCount="indefinite" />
              </circle>
            ) : null}
          </g>
        );
      })}
      {/* trunk junction node */}
      <circle cx={W / 2} cy={BUS_Y} r={3} fill="var(--primary)" />
    </svg>
  );
}

export function OfficeFloor({
  employees,
  handoff,
  questState,
  questMessage,
  health,
  currentTask,
}: {
  employees: LiveEmployee[];
  handoff: Handoff | null;
  questState: QuestState;
  questMessage: string;
  health: number;
  currentTask: string;
}) {
  const ordered = [...employees].sort(
    (a, b) => ORDER.indexOf(a.code) - ORDER.indexOf(b.code),
  );
  const linkedCode =
    handoff?.from !== "JARVIS"
      ? (handoff?.from as EmployeeCode | undefined)
      : (handoff?.to as EmployeeCode | undefined);

  return (
    <div className="relative">
      {/* JARVIS 司令塔 */}
      <div className="relative z-10 w-full">
        <QuestCore
          state={questState}
          message={questMessage}
          health={health}
          currentTask={currentTask}
          handoff={handoff}
        />
      </div>

      {/* command trunk + fan-out (single desk row) */}
      <div className="relative mx-auto hidden h-16 xl:block">
        <CommandLines employees={ordered} handoff={handoff} />
      </div>
      {/* simple stub for stacked layouts */}
      <div className="mx-auto h-8 w-px bg-border xl:hidden" aria-hidden />

      {/* six desks in a row: A調査 B戦略 C企画 D営業 E集客 F品質 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {ordered.map((e) => (
          <DeskCard key={e.code} employee={e} linked={linkedCode === e.code ? "out" : null} />
        ))}
      </div>
    </div>
  );
}
