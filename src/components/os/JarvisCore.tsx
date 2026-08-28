import { cn } from "@/lib/utils";

export type CoreState = "IDLE" | "THINKING" | "WORKING" | "WAITING" | "ERROR";

const TONE: Record<CoreState, string> = {
  IDLE: "var(--primary)",
  THINKING: "var(--emp-a)",
  WORKING: "var(--primary)",
  WAITING: "var(--muted-foreground)",
  ERROR: "var(--destructive)",
};

const CAPTION: Record<CoreState, string> = {
  IDLE: "STANDING BY",
  THINKING: "REASONING",
  WORKING: "ORCHESTRATING",
  WAITING: "AWAITING CEO",
  ERROR: "ATTENTION REQUIRED",
};

/**
 * Math.cos / Math.sin はECMAScript仕様上「実装依存の近似値」でよいとされており、
 * SSR（Node）とクライアント（ブラウザ）のV8で末尾ビットが異なることがある。
 * SVG属性にそのまま埋め込むとReactのhydration mismatchを起こすため、
 * 座標は必ず小数点2桁に丸めてから使う。
 */
const round = (n: number) => Math.round(n * 100) / 100;

/** ゲージの目盛り（60本、5本ごとに主目盛り）を生成する */
function ticks(cx: number, cy: number, r1: number, r2: number) {
  const out: { x1: number; y1: number; x2: number; y2: number; major: boolean }[] = [];
  for (let i = 0; i < 60; i++) {
    const deg = i * 6;
    const rad = ((deg - 90) * Math.PI) / 180;
    const major = i % 5 === 0;
    const ra = major ? r1 - 4 : r1;
    out.push({
      x1: round(cx + ra * Math.cos(rad)),
      y1: round(cy + ra * Math.sin(rad)),
      x2: round(cx + r2 * Math.cos(rad)),
      y2: round(cy + r2 * Math.sin(rad)),
      major,
    });
  }
  return out;
}

export function JarvisCore({
  state = "WORKING",
  size = 180,
  className,
  label = "JARVIS",
  health = 95,
}: {
  state?: CoreState;
  size?: number | string;
  className?: string;
  label?: string;
  /** ゲージの進捗アーク（会社の健全性など、0-100） */
  health?: number;
}) {
  const tone = TONE[state];
  const cx = 115;
  const cy = 115;
  const trackR = 86;
  const circumference = 2 * Math.PI * trackR;
  const pct = Math.max(0, Math.min(100, health)) / 100;

  return (
    <div
      className={cn("relative grid place-items-center", className)}
      style={{ width: size, height: size }}
      aria-label={`${label} core ${state}`}
      role="img"
    >
      {/* ブループリント格子背景 */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(color-mix(in oklab, var(--primary) 10%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--primary) 10%, transparent) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage: "radial-gradient(circle at 50% 50%, black 0%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 50%, black 0%, transparent 72%)",
        }}
      />

      <svg viewBox="0 0 230 230" className="absolute inset-0 size-full" aria-hidden>
        {/* 目盛りリング（回転） */}
        <g
          className="animate-core-orbit"
          style={{ transformOrigin: "115px 115px", animationDuration: "22s" }}
        >
          {ticks(cx, cy, 96, 106).map((t, i) => (
            <line
              key={i}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={
                t.major
                  ? `color-mix(in oklab, ${tone} 75%, transparent)`
                  : `color-mix(in oklab, ${tone} 28%, transparent)`
              }
              strokeWidth={t.major ? 1.6 : 0.8}
            />
          ))}
        </g>
        {/* 破線の外周リング（逆回転） */}
        <circle
          cx={cx}
          cy={cy}
          r={112}
          fill="none"
          stroke={`color-mix(in oklab, ${tone} 18%, transparent)`}
          strokeWidth={1}
          strokeDasharray="2 5"
          className="animate-core-orbit"
          style={{
            transformOrigin: "115px 115px",
            animationDuration: "34s",
            animationDirection: "reverse",
          }}
        />
        {/* トラック */}
        <circle
          cx={cx}
          cy={cy}
          r={trackR}
          fill="none"
          stroke="var(--border)"
          strokeWidth={4}
          opacity={0.5}
        />
        {/* 進捗アーク（会社の健全性） */}
        <circle
          cx={cx}
          cy={cy}
          r={trackR}
          fill="none"
          stroke={tone}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={`${circumference * pct} ${circumference}`}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{
            filter: `drop-shadow(0 0 6px color-mix(in oklab, ${tone} 70%, transparent))`,
          }}
        />
        {/* 方位ラベル A〜F */}
        {(["A", "B", "C", "D", "E", "F"] as const).map((code, i) => {
          const deg = i * 60;
          const rad = ((deg - 90) * Math.PI) / 180;
          const x = round(cx + 72 * Math.cos(rad));
          const y = round(cy + 72 * Math.sin(rad));
          return (
            <text
              key={code}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="7"
              fontFamily="ui-monospace, monospace"
              fill="var(--muted-foreground)"
              opacity={0.65}
            >
              {code}
            </text>
          );
        })}
      </svg>

      {/* コア（発光） */}
      <div
        className="animate-core-pulse absolute inset-[24%] rounded-full"
        style={{
          background: `radial-gradient(circle at 35% 30%, color-mix(in oklab, ${tone} 92%, white) 0%, ${tone} 40%, color-mix(in oklab, ${tone} 15%, transparent) 78%)`,
          boxShadow: `0 0 0 5px var(--background), 0 0 46px color-mix(in oklab, ${tone} 55%, transparent)`,
          filter: state === "ERROR" ? "saturate(1.3)" : undefined,
        }}
      />

      <div className="relative z-10 -translate-y-2 text-center">
        <p className="text-sm font-semibold tracking-[0.3em] text-foreground">{label}</p>
        <p className="mt-1 text-[10px] font-semibold tracking-[0.18em]" style={{ color: tone }}>
          {CAPTION[state]}
        </p>
      </div>
    </div>
  );
}
