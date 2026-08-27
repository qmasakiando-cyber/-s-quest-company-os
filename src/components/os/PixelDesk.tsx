import { AI_EMPLOYEES, type EmployeeCode, type PixelSpriteConfig } from "@/lib/company-data";
import type { LiveStatus } from "@/lib/demo-mode";

/**
 * ピクセルアートのAI社員ルーム（ゲーム発展国風・高解像度版）。
 * viewBox は 192x128（従来の2倍密度）。純粋なSVGで見た目のみを担当する。
 */

/** 役割ごとのモニター内パターン（1マス=4px） */
const SCREEN: Record<EmployeeCode, [number, number][]> = {
  A: [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 2], [2, 2], [3, 3]],
  B: [[0, 0], [1, 1], [2, 2], [3, 3], [3, 0], [0, 3]],
  C: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2], [3, 3]],
  D: [[0, 3], [1, 2], [2, 1], [3, 0], [3, 1], [3, 2]],
  E: [[0, 1], [1, 0], [2, 1], [1, 2], [0, 0], [3, 2]],
  F: [[0, 1], [1, 2], [2, 0], [1, 0], [3, 1]],
};

type Extra = "coffee" | "docs" | "tablet" | "phone" | "megaphone" | "clipboard";
const EXTRA: Record<EmployeeCode, Extra> = {
  A: "coffee",
  B: "docs",
  C: "tablet",
  D: "phone",
  E: "megaphone",
  F: "clipboard",
};

/** 社員ごとの肌・髪の色（人間らしさを出すため個体差をつける） */
const HUMAN: Record<EmployeeCode, { skin: string; shade: string; hair: string; long: boolean }> = {
  A: { skin: "#f0c9a4", shade: "#d3a37c", hair: "#3a2b22", long: false },
  B: { skin: "#e8bd97", shade: "#c9946e", hair: "#22242e", long: false },
  C: { skin: "#f4d3b3", shade: "#d9ab86", hair: "#5a3526", long: true },
  D: { skin: "#e2b189", shade: "#c08a61", hair: "#2b2b2b", long: false },
  E: { skin: "#f6d6bb", shade: "#dcae8c", hair: "#7a4a2c", long: true },
  F: { skin: "#ecc39c", shade: "#cb9a72", hair: "#1f2733", long: false },
};

/** 髪型テキスト（マスターデータ）からドット絵の髪色を決める */
function hairColorFor(hairStyle: string, fallback: string): string {
  if (/白髪|白/.test(hairStyle)) return "#e6e8f0";
  if (/黒|ボサボサ|オールバック/.test(hairStyle)) return "#1f2027";
  if (/髭|ウエーブ/.test(hairStyle)) return "#7a5236";
  if (/なし|ロボット|無し/.test(hairStyle)) return "#cfd6e4";
  return fallback;
}

export function PixelDesk({
  code,
  accent,
  status,
  className,
  config,
  personaName,
}: {
  code: EmployeeCode;
  accent: string;
  status: LiveStatus;
  className?: string;
  config?: PixelSpriteConfig;
  personaName?: string;
}) {
  const profile = AI_EMPLOYEES[code];
  const cfg = config ?? profile.pixelConfig;
  const persona = personaName ?? profile.name;
  const outfitTone = cfg.baseColor;
  const active = status === "WORKING" || status === "THINKING" || status === "REVIEW";
  const working = status === "WORKING";
  const armClass = active ? "animate-pixel-type" : "animate-pixel-idle";
  const glow = status === "ERROR" ? "var(--destructive)" : accent;
  const screen = SCREEN[code];
  const extra = EXTRA[code];
  const base = HUMAN[code];
  const h = { ...base, hair: hairColorFor(cfg.hairStyle, base.hair) };
  const celebrating = cfg.animationState === "celebrating";

  return (
    <div className="relative">
      {/* ============ 稼働状況オーラ（作業中=炎 / 待機中=休憩） ============ */}
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
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
                style={{ left: `${left}%`, animationDelay: `${i * 1.2}s`, color: "var(--info)" }}
              >
                z
              </span>
            ))}
      </div>

      <svg
        viewBox="0 0 192 128"
        className={className}
        shapeRendering="crispEdges"
        role="img"
        aria-label={`AI社員${code}のデスク（${status}）`}
        style={{ width: "100%", height: "auto", position: "relative", zIndex: 1 }}
      >
      {/* ================= 部屋 ================= */}
      <rect x="0" y="110" width="192" height="18" fill="var(--secondary)" opacity="0.45" />
      <line x1="0" y1="110" x2="192" y2="110" stroke="var(--border)" strokeWidth="1" />
      {/* 床タイル */}
      {[0, 24, 48, 72, 96, 120, 144, 168].map((x) => (
        <rect key={x} x={x} y="110" width="1" height="18" fill="var(--border)" opacity="0.5" />
      ))}
      {/* ラグ */}
      <rect
        x="44"
        y="114"
        width="104"
        height="10"
        fill={`color-mix(in oklab, ${glow} 10%, transparent)`}
        stroke={`color-mix(in oklab, ${glow} 25%, transparent)`}
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      {/* 環境光 */}
      <ellipse
        cx="100"
        cy="68"
        rx="84"
        ry="52"
        fill={`color-mix(in oklab, ${glow} 12%, transparent)`}
        opacity={active ? 0.9 : 0.35}
      />

      {/* 夜景の窓 */}
      <g>
        <rect x="36" y="8" width="52" height="36" fill="var(--background)" stroke="var(--border)" strokeWidth="1.4" />
        <rect x="61" y="8" width="1.5" height="36" fill="var(--border)" opacity="0.8" />
        {[[42, 14], [52, 12], [60, 16], [72, 12], [82, 16], [47, 19]].map(([x, y], i) => (
          <rect key={i} x={x} y={y} width="2" height="2" fill="var(--foreground)" opacity="0.8" />
        ))}
        {/* スカイライン */}
        <rect x="40" y="28" width="8" height="16" fill="var(--muted)" opacity="0.55" />
        <rect x="50" y="22" width="10" height="22" fill="var(--muted)" opacity="0.4" />
        <rect x="62" y="30" width="8" height="14" fill="var(--muted)" opacity="0.55" />
        <rect x="72" y="24" width="10" height="20" fill="var(--muted)" opacity="0.4" />
        {[[42, 32], [44, 38], [52, 26], [56, 34], [64, 34], [74, 28], [78, 36]].map(([x, y], i) => (
          <rect
            key={i}
            x={x}
            y={y}
            width="2"
            height="2"
            fill={glow}
            opacity="0.85"
            className={i % 3 === 0 ? "animate-pixel-screen" : undefined}
          />
        ))}
      </g>

      {/* ネオンの役割サイン */}
      <g className={active ? "animate-pixel-screen" : undefined}>
        <rect x="8" y="10" width="22" height="24" rx="2" fill="var(--background)" stroke={glow} strokeWidth="1.4" opacity="0.95" />
        <text x="19" y="29" textAnchor="middle" fontFamily="ui-monospace, monospace" fontWeight="700" fontSize="16" fill={glow}>
          {code}
        </text>
      </g>

      {/* キャラクター名プレート（ゲーム発展国風） */}
      <g>
        <rect
          x="6"
          y="115"
          width="82"
          height="10"
          rx="1"
          fill="var(--background)"
          stroke={`color-mix(in oklab, ${glow} 45%, var(--border))`}
          strokeWidth="1"
          opacity="0.95"
        />
        <text x="10" y="122.5" fontFamily="ui-monospace, monospace" fontWeight="700" fontSize="7" fill={glow}>
          {`${code}・${persona}`}
        </text>
      </g>

      {/* 棚：本・トロフィー・カセット */}
      <g>
        <rect x="124" y="23" width="58" height="2.5" fill="var(--muted)" />
        <rect x="128" y="13" width="5" height="10" fill={glow} opacity="0.85" />
        <rect x="135" y="11" width="4" height="12" fill="var(--warning)" opacity="0.9" />
        <rect x="141" y="15" width="5" height="8" fill="var(--info)" opacity="0.9" />
        <rect x="148" y="12" width="4" height="11" fill="var(--foreground)" opacity="0.6" />
        <rect x="158" y="12" width="9" height="6" fill="var(--warning)" />
        <rect x="161" y="18" width="3" height="3" fill="var(--warning)" opacity="0.85" />
        <rect x="157" y="21" width="11" height="2" fill="var(--warning)" opacity="0.7" />
        <rect x="172" y="14" width="8" height="9" fill="var(--chart-2)" opacity="0.8" />
        <rect x="174" y="16" width="4" height="3" fill="var(--background)" opacity="0.8" />
      </g>

      {/* 天井LED */}
      <rect x="0" y="0" width="192" height="2" fill={`color-mix(in oklab, ${glow} 45%, transparent)`} className={active ? "animate-pixel-screen" : undefined} />

      {/* パキラ */}
      <g>
        <rect x="12" y="96" width="14" height="12" fill="color-mix(in oklab, var(--warning) 45%, var(--secondary))" />
        <rect x="11" y="94" width="16" height="3" fill="var(--muted)" opacity="0.8" />
        <rect x="18" y="84" width="3" height="12" fill="var(--muted)" opacity="0.9" />
        <rect x="12" y="76" width="8" height="6" fill="var(--success)" opacity="0.9" />
        <rect x="18" y="72" width="8" height="6" fill="var(--success)" opacity="0.75" />
        <rect x="22" y="79" width="6" height="5" fill="var(--success)" opacity="0.6" />
        <rect x="15" y="82" width="6" height="4" fill="var(--success)" opacity="0.55" />
      </g>

      {/* PCタワー */}
      <g>
        <rect x="168" y="86" width="14" height="22" fill="var(--secondary)" stroke="var(--border)" strokeWidth="1" />
        <rect x="168" y="86" width="2" height="22" fill={glow} opacity="0.9" />
        <rect x="172" y="90" width="6" height="6" fill={`color-mix(in oklab, ${glow} 60%, transparent)`} className={active ? "animate-pixel-screen" : undefined} />
        <rect x="172" y="99" width="6" height="6" fill="color-mix(in oklab, var(--chart-2) 60%, transparent)" className={active ? "animate-pixel-screen" : undefined} />
      </g>

      {/* デスク */}
      <rect x="80" y="80" width="104" height="5" fill="var(--muted)" />
      <rect x="80" y="80" width="104" height="1.6" fill="var(--foreground)" opacity="0.25" />
      <rect x="86" y="85" width="4" height="24" fill="var(--muted)" opacity="0.7" />
      <rect x="174" y="85" width="4" height="24" fill="var(--muted)" opacity="0.7" />

      {/* メインモニター */}
      <g>
        <rect x="128" y="76" width="10" height="4" fill="var(--muted)" />
        <rect x="112" y="52" width="40" height="26" fill="var(--secondary)" stroke={glow} strokeWidth="1.6" />
        <rect
          x="115"
          y="55"
          width="34"
          height="20"
          fill={`color-mix(in oklab, ${glow} 26%, var(--background))`}
          className={active ? "animate-pixel-screen" : undefined}
        />
        {screen.map(([px, py], i) => (
          <rect key={i} x={117 + px * 8} y={57 + py * 4.5} width="6" height="3" fill={glow} opacity="0.9" />
        ))}
      </g>

      {/* 縦置きサブモニター */}
      <g>
        <rect x="156" y="56" width="16" height="22" fill="var(--secondary)" stroke={glow} strokeWidth="1" opacity="0.95" />
        <rect x="158" y="58" width="12" height="18" fill={`color-mix(in oklab, ${glow} 18%, var(--background))`} className={active ? "animate-pixel-screen" : undefined} />
      </g>

      {/* RGBキーボード + マウス */}
      <g>
        <rect x="98" y="84" width="40" height="4" fill="var(--secondary)" stroke="var(--border)" strokeWidth="0.8" />
        {["var(--emp-a)", glow, "var(--chart-2)", "var(--emp-e)", glow, "var(--info)"].map((c, i) => (
          <rect
            key={i}
            x={100 + i * 6}
            y={85}
            width="4"
            height="2"
            fill={c}
            className={active ? "animate-pixel-screen" : undefined}
            opacity="0.9"
          />
        ))}
        <rect x="142" y="84" width="6" height="4" fill="var(--secondary)" stroke="var(--border)" strokeWidth="0.6" />
        <rect x="144" y="85" width="2" height="2" fill={glow} />
      </g>

      {/* 役割別の小物 */}
      {extra === "coffee" && (
        <g>
          <rect x="84" y="73" width="7" height="7" fill={glow} opacity="0.8" />
          <rect x="91" y="74.5" width="2.5" height="4" fill={glow} opacity="0.5" />
          <rect x="85.5" y="69" width="1.6" height="3" fill="var(--foreground)" opacity="0.4" className={active ? "animate-pixel-screen" : undefined} />
          <rect x="88" y="67.5" width="1.6" height="3" fill="var(--foreground)" opacity="0.3" className={active ? "animate-pixel-screen" : undefined} />
        </g>
      )}
      {extra === "docs" && (
        <g>
          <rect x="83" y="73" width="13" height="7" fill="var(--foreground)" opacity="0.2" stroke="var(--border)" strokeWidth="0.8" />
          <rect x="85" y="75" width="9" height="1.4" fill={glow} opacity="0.8" />
          <rect x="85" y="77.6" width="6" height="1.4" fill={glow} opacity="0.5" />
        </g>
      )}
      {extra === "tablet" && (
        <g>
          <rect x="83" y="71" width="11" height="9" fill="var(--secondary)" stroke={glow} strokeWidth="1" />
          <rect x="85.5" y="74" width="6" height="3" fill={glow} opacity="0.8" className={active ? "animate-pixel-screen" : undefined} />
        </g>
      )}
      {extra === "phone" && (
        <g>
          <rect x="86" y="69" width="6" height="11" fill="var(--secondary)" stroke={glow} strokeWidth="1" />
          <rect x="88" y="72" width="2.5" height="2.5" fill={glow} className={active ? "animate-pixel-screen" : undefined} />
        </g>
      )}
      {extra === "megaphone" && (
        <g>
          <rect x="83" y="72" width="5" height="8" fill={glow} opacity="0.9" />
          <rect x="88" y="73.5" width="4" height="5" fill={glow} opacity="0.7" />
          <rect x="92" y="75" width="3" height="2.5" fill={glow} opacity="0.5" />
        </g>
      )}
      {extra === "clipboard" && (
        <g>
          <rect x="83" y="69" width="10" height="11" fill="var(--secondary)" stroke="var(--border)" strokeWidth="1" />
          <rect x="86" y="67.5" width="4" height="2.5" fill="var(--muted)" />
          <path d="M85 74 l2.4 2.4 l4.4 -5.2" stroke={glow} strokeWidth="1.6" fill="none" />
        </g>
      )}

      {/* ================= ゲーミングチェア ================= */}
      <g>
        <rect x="47" y="44" width="9" height="6" fill="var(--secondary)" stroke="var(--border)" strokeWidth="0.8" />
        <rect x="48" y="50" width="7" height="30" fill="var(--muted)" />
        <rect x="48" y="54" width="7" height="4" fill={glow} opacity="0.8" />
        <rect x="50" y="78" width="20" height="5" fill="var(--muted)" />
        <rect x="57" y="83" width="5" height="14" fill="var(--muted)" opacity="0.85" />
        <rect x="46" y="97" width="9" height="4" fill="var(--muted)" opacity="0.7" />
        <rect x="66" y="97" width="9" height="4" fill="var(--muted)" opacity="0.7" />
      </g>

      {/* ================= 社員（高解像度スプライト） ================= */}
      <g className={celebrating ? "animate-pixel-type" : "animate-pixel-idle"}>
        {/* 首 */}
        <rect x="60" y="66" width="8" height="4" fill={h.shade} />
        {/* 顔 */}
        <rect x="55" y="52" width="18" height="16" fill={h.skin} />
        <rect x="55" y="52" width="18" height="2" fill={h.shade} opacity="0.5" />
        <rect x="55" y="64" width="18" height="4" fill={h.shade} opacity="0.35" />
        {/* 耳 */}
        <rect x="53" y="58" width="2" height="4" fill={h.shade} />
        <rect x="73" y="58" width="2" height="4" fill={h.shade} />
        {/* 髪 */}
        <rect x="53" y="46" width="22" height="7" fill={h.hair} />
        <rect x="53" y="53" width="3" height="7" fill={h.hair} />
        <rect x="72" y="53" width="3" height="6" fill={h.hair} />
        <rect x="62" y="44" width="10" height="3" fill={h.hair} opacity="0.9" />
        {h.long ? (
          <>
            <rect x="51" y="53" width="3" height="18" fill={h.hair} opacity="0.95" />
            <rect x="74" y="53" width="3" height="18" fill={h.hair} opacity="0.95" />
          </>
        ) : null}
        {/* 前髪の分け目 */}
        <rect x="63" y="51" width="8" height="2" fill={h.hair} opacity="0.75" />
        {/* 眉 */}
        <rect x="58" y="56" width="5" height="1.5" fill={h.hair} opacity="0.85" />
        <rect x="66" y="56" width="5" height="1.5" fill={h.hair} opacity="0.85" />
        {/* 目（白目 + 瞳） */}
        <g className="animate-pixel-blink">
          <rect x="58" y="59" width="5" height="3" fill="#f7f7fb" />
          <rect x="66" y="59" width="5" height="3" fill="#f7f7fb" />
          <rect x="60" y="59.5" width="2.5" height="2.5" fill="#2b2f3a" />
          <rect x="68" y="59.5" width="2.5" height="2.5" fill="#2b2f3a" />
          <rect x="60" y="59.5" width="1" height="1" fill="#ffffff" opacity="0.9" />
          <rect x="68" y="59.5" width="1" height="1" fill="#ffffff" opacity="0.9" />
        </g>
        {/* 鼻・口 */}
        <rect x="63.5" y="62" width="2" height="2" fill={h.shade} opacity="0.8" />
        <rect x="61" y="65.5" width="6" height="1.5" fill="#8d4f4a" opacity="0.75" />
        {/* 頬 */}
        <rect x="56" y="63" width="2.5" height="1.5" fill="#e08b7d" opacity="0.4" />
        <rect x="70" y="63" width="2.5" height="1.5" fill="#e08b7d" opacity="0.4" />
        {/* ヘッドセット */}
        <rect x="52" y="47" width="24" height="2" fill={glow} opacity="0.9" />
        <rect x="50" y="55" width="4" height="7" fill={glow} />
        <rect x="74" y="55" width="4" height="7" fill={glow} />
        <rect x="52" y="62" width="8" height="1.6" fill={glow} opacity="0.8" />
        {/* 上半身（シャツ + フーディ） */}
        <rect x="49" y="70" width="30" height="20" fill={`color-mix(in oklab, ${outfitTone} 60%, var(--secondary))`} />
        <rect x="49" y="70" width="30" height="3" fill={outfitTone} opacity="0.55" />
        <rect x="58" y="70" width="12" height="6" fill="#f2f3f7" opacity="0.85" />
        <rect x="62" y="70" width="4" height="10" fill={h.skin} opacity="0.9" />
        <rect x="63" y="76" width="2" height="10" fill="var(--background)" opacity="0.6" />
        {/* ポケット */}
        <rect x="52" y="82" width="6" height="5" fill="var(--background)" opacity="0.45" />
      </g>

      {/* 腕：キーボードを打つ */}
      <g className={armClass} style={{ transformOrigin: "78px 80px" }}>
        <rect x="76" y="76" width="18" height="5" fill={`color-mix(in oklab, ${outfitTone} 60%, var(--secondary))`} />
        <rect x="92" y="78" width="7" height="5" fill={h.skin} />
        <rect x="92" y="81" width="7" height="2" fill={h.shade} opacity="0.6" />
      </g>
      <g className="animate-pixel-idle" style={{ transformOrigin: "78px 86px" }}>
        <rect x="76" y="84" width="16" height="5" fill={`color-mix(in oklab, ${outfitTone} 45%, var(--secondary))`} opacity="0.9" />
        <rect x="90" y="85" width="7" height="4" fill={h.skin} />
      </g>

      {/* 状態インジケーター */}
      <rect
        x="61"
        y="36"
        width="6"
        height="6"
        fill={glow}
        className={active ? "animate-pixel-screen" : undefined}
        opacity={active ? 1 : 0.4}
      />
    </svg>
    </div>
  );
}
