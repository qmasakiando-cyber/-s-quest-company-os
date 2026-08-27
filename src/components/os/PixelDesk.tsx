import { cn } from "@/lib/utils";
import { AI_EMPLOYEES, type EmployeeCode } from "@/lib/company-data";
import type { LiveStatus } from "@/lib/demo-mode";

/**
 * AI社員のデスクシーン。public/characters/{code}.png（実写風イラスト、透過背景）を
 * 表示し、稼働状況オーラ（作業中=炎のパーティクル、待機中=zの休憩エフェクト）を重ねる。
 */

export function PixelDesk({
  code,
  status,
  className,
  personaName,
}: {
  code: EmployeeCode;
  status: LiveStatus;
  className?: string;
  personaName?: string;
}) {
  const profile = AI_EMPLOYEES[code];
  const persona = personaName ?? profile.name;
  const working = status === "WORKING";

  return (
    <div
      className={cn("relative aspect-[5/4] w-full overflow-hidden", className)}
    >
      {/* ============ 稼働状況オーラ（作業中=炎 / 待機中=休憩） ============ */}
      <div
        className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
        aria-hidden
      >
        <div
          className={working ? "animate-aura-work" : "animate-aura-idle"}
          style={{
            position: "absolute",
            inset: 0,
            background: working
              ? "radial-gradient(circle at 32% 78%, color-mix(in oklab, var(--emp-d) 55%, transparent), transparent 62%)"
              : "radial-gradient(circle at 32% 74%, color-mix(in oklab, var(--info) 32%, transparent), transparent 62%)",
          }}
        />
        {working
          ? [22, 40, 31].map((left, i) => (
              <span
                key={i}
                className="animate-ember absolute bottom-[34%] text-[11px]"
                style={{ left: `${left}%`, animationDelay: `${i * 0.5}s` }}
              >
                🔥
              </span>
            ))
          : [24, 36, 30].map((left, i) => (
              <span
                key={i}
                className="animate-zzz absolute bottom-[36%] font-mono text-[11px] font-bold"
                style={{
                  left: `${left}%`,
                  animationDelay: `${i * 1.2}s`,
                  color: "var(--info)",
                }}
              >
                z
              </span>
            ))}
      </div>

      <img
        src={`/characters/${code}.png`}
        alt={`AI社員${code}・${persona}のデスク（${status}）`}
        className="absolute inset-0 z-10 size-full object-contain"
      />
    </div>
  );
}
