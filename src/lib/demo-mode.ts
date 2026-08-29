/**
 * DEMO MODE — client-only orchestration theater.
 * Keeps the HQ floor "alive" (JARVIS↔employee handoffs, activity log,
 * revenue ticker) without any backend. Per-employee status/progress/
 * currentTask/completedToday/lastActivity are NOT simulated here anymore —
 * those come from real ai_employees data (see use-employee-live-states.ts)
 * and are merged in by the caller (src/routes/index.tsx). This file only
 * owns the parts that have no real-data equivalent: the handoff animation,
 * the activity feed, JARVIS's own questState/questMessage, and the revenue
 * ticker.
 */
import { useEffect, useRef, useState } from "react";
import {
  ACTIVITY,
  EMPLOYEES,
  REVENUE,
  type EmployeeCode,
  type EmployeeStatus,
} from "./company-data";

export const DEMO_MODE = true;

export type QuestState =
  "IDLE" | "THINKING" | "ORCHESTRATING" | "COMMUNICATING" | "ERROR";

export interface LiveEmployee {
  code: EmployeeCode;
  name: string;
  role: string;
  accent: string;
  status: EmployeeStatus;
  currentTask: string;
  progress: number;
  completedToday: number;
  todayTasks: number;
  level: number;
  xp: number;
  xpNext: number;
  lastActivity: string;
  workflow: string;
}

export interface LiveActivity {
  id: string;
  at: string;
  actor: string;
  text: string;
}

export interface Handoff {
  id: string;
  from: "JARVIS" | EmployeeCode;
  to: "JARVIS" | EmployeeCode | "CEO";
}

/**
 * 初回描画〜実データ取得が終わるまでの一時的なプレースホルダ。実データが
 * 届き次第、呼び出し側（index.tsx）がstatus/progress/currentTask/
 * completedToday/lastActivityを上書きする。
 */
const START_STATUS: Record<EmployeeCode, EmployeeStatus> = {
  A: "WORKING",
  B: "THINKING",
  C: "WORKING",
  D: "WORKING",
  E: "WAITING",
  F: "REVIEW",
};

const TASK_POOL: Record<EmployeeCode, string[]> = {
  A: [
    "S-QUEST競合診断サービス調査",
    "Instagram競合アカウント分析",
    "16タイプ検索需要リサーチ",
  ],
  B: ["Instagram集客戦略の立案", "KPIツリーの再設計", "Q4事業戦略の仮説設計"],
  C: [
    "診断結果カードのUI改善",
    "16タイプキャラクター設計",
    "LPクリエイティブ設計",
  ],
  D: [
    "法人向け提案資料の更新",
    "商談パイプラインの整理",
    "新規リード30件の選別",
  ],
  E: [
    "Instagram投稿企画の作成",
    "SEO記事の構成設計",
    "広告クリエイティブのCV改善",
  ],
  F: ["診断ロジックの整合性チェック", "KPIデータの検算", "リリース前UI検証"],
};

const XP_BASE: Record<EmployeeCode, { level: number; xp: number }> = {
  A: { level: 12, xp: 8420 },
  B: { level: 14, xp: 9210 },
  C: { level: 11, xp: 6480 },
  D: { level: 10, xp: 5240 },
  E: { level: 12, xp: 7810 },
  F: { level: 13, xp: 8990 },
};

const CODES: EmployeeCode[] = ["A", "B", "C", "D", "E", "F"];

const initialEmployees = (): LiveEmployee[] =>
  EMPLOYEES.map((e, i) => ({
    code: e.code,
    name: e.name,
    role: e.role,
    accent: e.accent,
    status: START_STATUS[e.code],
    currentTask: TASK_POOL[e.code][0]!,
    progress: [72, 41, 58, 34, 0, 86][i] ?? 0,
    completedToday: e.completedToday,
    todayTasks: e.completedToday + 2,
    level: XP_BASE[e.code].level,
    xp: XP_BASE[e.code].xp,
    xpNext: 10000,
    lastActivity: e.lastActivity,
    workflow: e.workflow,
  }));

const initialActivity = (): LiveActivity[] =>
  ACTIVITY.slice(0, 8).map((a, i) => ({
    id: `seed-${i}`,
    at: a.at,
    actor: a.actor,
    text: a.text,
  }));

const clock = () =>
  new Date().toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });

const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]!;

export function useCompanySimulation(enabled = true) {
  const [employees, setEmployees] = useState<LiveEmployee[]>(initialEmployees);
  const [activity, setActivity] = useState<LiveActivity[]>(initialActivity);
  const [handoff, setHandoff] = useState<Handoff | null>(null);
  const [questState, setQuestState] = useState<QuestState>("ORCHESTRATING");
  const [questMessage, setQuestMessage] = useState(
    "WF-06 を実行中。A / B / D に作業を配分しています。",
  );
  const [revenueToday, setRevenueToday] = useState<number>(
    Math.round(REVENUE.monthly / 26),
  );
  const seq = useRef(0);

  // JARVIS ↔ employee handoffs + activity log（演出のみ。社員の実status/
  // lastActivityには触れない — それらは実データ由来のため）
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      const code = pick(CODES);
      const toQuest = Math.random() < 0.5;
      seq.current += 1;
      const n = seq.current;
      setHandoff(
        toQuest
          ? { id: `h${n}`, from: code, to: "JARVIS" }
          : { id: `h${n}`, from: "JARVIS", to: code },
      );
      setQuestState("COMMUNICATING");
      const emp = EMPLOYEES.find((e) => e.code === code)!;
      setActivity((prev) =>
        [
          {
            id: `a${n}`,
            at: clock(),
            actor: toQuest ? code : "JARVIS",
            text: toQuest
              ? `${code}｜${emp.name} が成果を JARVIS へ報告しました`
              : `JARVIS が ${code}｜${emp.name} へ「${pick(TASK_POOL[code])}」を依頼しました`,
          },
          ...prev,
        ].slice(0, 14),
      );
      setQuestMessage(
        toQuest
          ? `${code}｜${emp.name} の成果を統合しています。`
          : `${code}｜${emp.name} へタスクを割り当てました。`,
      );
      window.setTimeout(() => {
        setHandoff(null);
        setQuestState("ORCHESTRATING");
      }, 2600);
    }, 7000);
    return () => window.clearInterval(id);
  }, [enabled]);

  // Revenue ticker
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      setRevenueToday((v) => v + 1000 * Math.floor(1 + Math.random() * 8));
    }, 9000);
    return () => window.clearInterval(id);
  }, [enabled]);

  const workingCount = employees.filter(
    (e) => e.status === "WORKING" || e.status === "THINKING",
  ).length;

  return {
    employees,
    setEmployees,
    activity,
    handoff,
    questState,
    questMessage,
    revenueToday,
    workingCount,
  };
}
