/**
 * DEMO MODE — client-only company simulation.
 * Keeps the HQ floor "alive" (statuses, progress, handoffs, activity, revenue)
 * without any backend. Everything here is isolated from real data on purpose:
 * when the backend lands, replace `useCompanySimulation` with live queries.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ACTIVITY,
  EMPLOYEES,
  REVENUE,
  type EmployeeCode,
  type EmployeeStatus,
} from "./company-data";

export const DEMO_MODE = true;

export type LiveStatus =
  | "IDLE"
  | "THINKING"
  | "WORKING"
  | "WAITING"
  | "REPORTING"
  | "REVIEW"
  | "ERROR";

export const LIVE_STATUS_LABEL: Record<LiveStatus, string> = {
  IDLE: "待機中",
  THINKING: "思考中",
  WORKING: "作業中",
  WAITING: "JARVISから指示待ち",
  REPORTING: "JARVISへ報告中",
  REVIEW: "レビュー中",
  ERROR: "確認が必要です",
};

export const LIVE_STATUS_TONE: Record<LiveStatus, string> = {
  IDLE: "var(--muted-foreground)",
  THINKING: "var(--info)",
  WORKING: "var(--success)",
  WAITING: "var(--warning)",
  REPORTING: "var(--emp-c)",
  REVIEW: "var(--emp-f)",
  ERROR: "var(--destructive)",
};

export type QuestState = "IDLE" | "THINKING" | "ORCHESTRATING" | "COMMUNICATING" | "ERROR";

export interface LiveEmployee {
  code: EmployeeCode;
  name: string;
  role: string;
  accent: string;
  status: LiveStatus;
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

const START_STATUS: Record<EmployeeCode, LiveStatus> = {
  A: "WORKING",
  B: "THINKING",
  C: "WORKING",
  D: "WORKING",
  E: "WAITING",
  F: "REVIEW",
};

const TASK_POOL: Record<EmployeeCode, string[]> = {
  A: ["S-QUEST競合診断サービス調査", "Instagram競合アカウント分析", "16タイプ検索需要リサーチ"],
  B: ["Instagram集客戦略の立案", "KPIツリーの再設計", "Q4事業戦略の仮説設計"],
  C: ["診断結果カードのUI改善", "16タイプキャラクター設計", "LPクリエイティブ設計"],
  D: ["法人向け提案資料の更新", "商談パイプラインの整理", "新規リード30件の選別"],
  E: ["Instagram投稿企画の作成", "SEO記事の構成設計", "広告クリエイティブのCV改善"],
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
  ACTIVITY.slice(0, 8).map((a, i) => ({ id: `seed-${i}`, at: a.at, actor: a.actor, text: a.text }));

const clock = () =>
  new Date().toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]!;

const NEXT_STATUS: Record<LiveStatus, LiveStatus> = {
  IDLE: "WAITING",
  WAITING: "THINKING",
  THINKING: "WORKING",
  WORKING: "REPORTING",
  REPORTING: "REVIEW",
  REVIEW: "IDLE",
  ERROR: "WAITING",
};

export function useCompanySimulation(enabled = true) {
  const [employees, setEmployees] = useState<LiveEmployee[]>(initialEmployees);
  const [activity, setActivity] = useState<LiveActivity[]>(initialActivity);
  const [handoff, setHandoff] = useState<Handoff | null>(null);
  const [questState, setQuestState] = useState<QuestState>("ORCHESTRATING");
  const [questMessage, setQuestMessage] = useState(
    "WF-06 を実行中。A / B / D に作業を配分しています。",
  );
  const [revenueToday, setRevenueToday] = useState<number>(Math.round(REVENUE.monthly / 26));
  const seq = useRef(0);

  // Progress + status machine
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      setEmployees((prev) =>
        prev.map((e) => {
          if (e.status === "ERROR" || e.status === "IDLE" || e.status === "WAITING") {
            return Math.random() < 0.12
              ? { ...e, status: NEXT_STATUS[e.status], lastActivity: "たった今" }
              : e;
          }
          const step = e.status === "WORKING" ? 4 + Math.random() * 7 : 2 + Math.random() * 3;
          const next = Math.min(100, Math.round(e.progress + step));
          if (next >= 100) {
            return {
              ...e,
              progress: 0,
              status: "REPORTING",
              completedToday: e.completedToday + 1,
              xp: Math.min(e.xpNext, e.xp + 60 + Math.floor(Math.random() * 90)),
              currentTask: pick(TASK_POOL[e.code]),
              lastActivity: "たった今",
            };
          }
          return { ...e, progress: next, lastActivity: "たった今" };
        }),
      );
    }, 3200);
    return () => window.clearInterval(id);
  }, [enabled]);

  // JARVIS ↔ employee handoffs + activity log
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      const code = pick(CODES);
      const toQuest = Math.random() < 0.5;
      seq.current += 1;
      const n = seq.current;
      setHandoff(
        toQuest ? { id: `h${n}`, from: code, to: "JARVIS" } : { id: `h${n}`, from: "JARVIS", to: code },
      );
      setQuestState("COMMUNICATING");
      setEmployees((prev) =>
        prev.map((e) =>
          e.code === code
            ? {
                ...e,
                status: toQuest ? "REPORTING" : "THINKING",
                lastActivity: "たった今",
              }
            : e,
        ),
      );
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

  const health = useMemo(() => {
    const activeScore =
      employees.filter((e) => e.status !== "IDLE" && e.status !== "ERROR").length / employees.length;
    const errorPenalty = employees.filter((e) => e.status === "ERROR").length * 6;
    const progressAvg = employees.reduce((s, e) => s + e.progress, 0) / employees.length;
    return Math.max(
      60,
      Math.min(99, Math.round(74 + activeScore * 16 + progressAvg * 0.09 - errorPenalty)),
    );
  }, [employees]);

  const workingCount = employees.filter((e) => e.status === "WORKING" || e.status === "THINKING")
    .length;

  return {
    employees,
    activity,
    handoff,
    questState,
    questMessage,
    revenueToday,
    health,
    workingCount,
  };
}

export const statusFromLegacy = (s: EmployeeStatus): LiveStatus =>
  s === "APPROVAL_REQUIRED" ? "WAITING" : s === "COMPLETED" ? "IDLE" : (s as LiveStatus);
