/**
 * S-QUEST COMPANY — COMPANY OS mock dataset (SIMULATION MODE).
 * Single source of truth for the frontend until the backend is connected.
 */

export type EmployeeStatus =
  | "IDLE"
  | "THINKING"
  | "WORKING"
  | "WAITING"
  | "REVIEW"
  | "APPROVAL_REQUIRED"
  | "COMPLETED"
  | "ERROR";

export const STATUS_LABEL: Record<EmployeeStatus, string> = {
  IDLE: "待機中",
  THINKING: "思考中",
  WORKING: "作業中",
  WAITING: "待機・依存待ち",
  REVIEW: "レビュー中",
  APPROVAL_REQUIRED: "CEO承認待ち",
  COMPLETED: "完了",
  ERROR: "エラー",
};

export type EmployeeCode = "A" | "B" | "C" | "D" | "E" | "F";

/** ゲーム発展国風ドット絵スタイル定義 */
export interface PixelSpriteConfig {
  style: "kairosoft-pixel-art";
  baseColor: string;
  accessory: string;
  hairStyle: string;
  outfit: string;
  animationState: "sitting" | "typing" | "thinking" | "celebrating";
  avatarSvgPlaceholder: string;
}

export interface AIEmployee {
  code: EmployeeCode;
  name: string;
  department: string;
  role: string;
  status: EmployeeStatus;
  currentTask: string;
  progress: number;
  lastActivity: string;
  workflow: string;
  completedToday: number;
  accent: string;
  responsibilities: string[];
  capabilities: string[];
  steps: string[];
  /** キャラクター名・人格（AI_EMPLOYEES プロファイル由来） */
  personaName?: string;
  persona?: string;
  pixelConfig?: PixelSpriteConfig;
  performance: {
    tasksCompleted: number;
    successRate: number;
    avgCompletion: string;
    qaPassRate: number;
  };
  permissions: { read: string[]; write: string[] };
  systemPrompt: string;
  activity: { at: string; text: string }[];
}

export const EMPLOYEES: AIEmployee[] = [
  {
    code: "A",
    name: "調査",
    department: "Research / Intelligence",
    role: "調査・情報統括",
    status: "IDLE",
    currentTask: "競合SNSリサーチ（次サイクル待機）",
    progress: 0,
    lastActivity: "12分前",
    workflow: "WF-01 Research → Strategy",
    completedToday: 6,
    accent: "var(--emp-a)",
    responsibilities: [
      "市場・競合・顧客調査",
      "トレンド / SNSリサーチ",
      "データ収集と情報整理",
      "Fact Check とレポート作成",
    ],
    capabilities: ["Market Scan", "Competitor Teardown", "Fact Check", "Report Synthesis"],
    steps: ["Researching", "Collecting sources", "Analyzing", "Structuring", "Reporting"],
    performance: { tasksCompleted: 214, successRate: 96.4, avgCompletion: "18m", qaPassRate: 94.1 },
    permissions: {
      read: ["Company", "Brand", "Product", "Marketing", "Sales"],
      write: ["Research", "Knowledge"],
    },
    systemPrompt:
      "You are Employee A of S-QUEST COMPANY. You own research and intelligence. Always cite sources, separate fact from inference, and hand structured findings back to JARVIS.",
    activity: [
      { at: "20:41", text: "Market research レポートを COMPANY OS / KNOWLEDGE に登録" },
      { at: "19:12", text: "競合3社のSNS投稿頻度を収集" },
      { at: "17:58", text: "診断離脱率の一次データを B に引き渡し" },
    ],
  },
  {
    code: "B",
    name: "戦略",
    department: "Strategy / Planning",
    role: "戦略責任者",
    status: "WORKING",
    currentTask: "Revenue Gap 改善戦略の設計",
    progress: 62,
    lastActivity: "たった今",
    workflow: "WF-06 KPI → Strategy",
    completedToday: 4,
    accent: "var(--emp-b)",
    responsibilities: [
      "戦略立案・仮説構築",
      "KPI設計 / 事業計画",
      "ターゲット設計・優先順位設計",
      "Roadmap 作成",
    ],
    capabilities: ["Hypothesis Tree", "KPI Design", "Roadmap", "Prioritization"],
    steps: ["Framing", "Hypothesis", "Modeling", "Prioritizing", "Proposing"],
    performance: { tasksCompleted: 168, successRate: 94.8, avgCompletion: "26m", qaPassRate: 96.2 },
    permissions: {
      read: ["Company", "Research", "KPI", "Sales"],
      write: ["Strategy", "Planning"],
    },
    systemPrompt:
      "You are Employee B of S-QUEST COMPANY. Convert research into strategy: hypotheses, KPI targets, sequencing. Never invent data — request it from A via JARVIS.",
    activity: [
      { at: "21:02", text: "Lead volume -18% に対する3案を作成中" },
      { at: "20:20", text: "COMPANY OS / STRATEGY v1.4 を更新" },
    ],
  },
  {
    code: "C",
    name: "企画",
    department: "Creative / Product",
    role: "企画・クリエイティブ責任者",
    status: "REVIEW",
    currentTask: "S-QUEST 診断結果画面のUI改訂",
    progress: 88,
    lastActivity: "4分前",
    workflow: "WF-02 Strategy → Product",
    completedToday: 5,
    accent: "var(--emp-c)",
    responsibilities: [
      "UI/UX・デザイン",
      "プロダクト仕様・新機能企画",
      "ブランド / キャラクター設計",
      "LP・SNSクリエイティブ",
    ],
    capabilities: ["UX Flow", "Spec Writing", "Visual Direction", "Copy"],
    steps: ["Briefing", "Concepting", "Designing", "Speccing", "Handoff"],
    performance: { tasksCompleted: 141, successRate: 92.1, avgCompletion: "34m", qaPassRate: 90.7 },
    permissions: { read: ["Brand", "Product", "Strategy"], write: ["Creative", "Product"] },
    systemPrompt:
      "You are Employee C of S-QUEST COMPANY. You design product and creative output within the brand rules stored in COMPANY OS / BRAND. External publication always requires CEO approval.",
    activity: [
      { at: "20:58", text: "新LP公開申請を CEO 承認へ送信" },
      { at: "20:11", text: "結果画面の16タイプ表示を再構成" },
    ],
  },
  {
    code: "D",
    name: "営業",
    department: "Sales / Business Development",
    role: "営業・売上開発",
    status: "WORKING",
    currentTask: "Sales pipeline の停滞商談分析",
    progress: 45,
    lastActivity: "1分前",
    workflow: "WF-04 Marketing → Sales",
    completedToday: 3,
    accent: "var(--emp-d)",
    responsibilities: [
      "営業戦略・リード管理",
      "商談・提案・CRM",
      "パートナー開拓",
      "売上予測",
    ],
    capabilities: ["Pipeline Analysis", "Lead Scoring", "Proposal", "Forecast"],
    steps: ["Pipeline pull", "Scoring", "Diagnosing", "Proposing", "Forecasting"],
    performance: { tasksCompleted: 122, successRate: 91.5, avgCompletion: "22m", qaPassRate: 93.4 },
    permissions: {
      read: ["Company", "Product", "Marketing", "Strategy"],
      write: ["Sales", "CRM"],
    },
    systemPrompt:
      "You are Employee D of S-QUEST COMPANY. Own pipeline and revenue development. Outbound sending and contracts require CEO approval.",
    activity: [
      { at: "21:01", text: "B2B 3件を Proposal ステージへ移動" },
      { at: "19:44", text: "新規リード 3件を CRM に登録" },
    ],
  },
  {
    code: "E",
    name: "集客",
    department: "Marketing / Growth",
    role: "集客・マーケティング",
    status: "IDLE",
    currentTask: "次キャンペーン設計待ち（B の戦略待機）",
    progress: 0,
    lastActivity: "26分前",
    workflow: "WF-04 Marketing → Sales",
    completedToday: 7,
    accent: "var(--emp-e)",
    responsibilities: [
      "SNS / SEO / コンテンツ",
      "広告・キャンペーン運用",
      "CV改善・ファネル分析",
      "Growth 施策設計",
    ],
    capabilities: ["Funnel Analysis", "SEO", "Content Plan", "Ad Ops"],
    steps: ["Funnel read", "Ideation", "Producing", "Scheduling", "Measuring"],
    performance: { tasksCompleted: 197, successRate: 93.7, avgCompletion: "20m", qaPassRate: 92.8 },
    permissions: { read: ["Brand", "Product", "Sales", "KPI"], write: ["Marketing"] },
    systemPrompt:
      "You are Employee E of S-QUEST COMPANY. Own growth. Any external publication (SNS, ads, email) requires CEO approval before send.",
    activity: [
      { at: "20:35", text: "Instagram 投稿案 5件を下書き保存" },
      { at: "18:20", text: "診断→キャリアのファネルCVを更新" },
    ],
  },
  {
    code: "F",
    name: "品質",
    department: "Quality Assurance / Audit",
    role: "品質・監査",
    status: "REVIEW",
    currentTask: "B の戦略ロジック整合性チェック",
    progress: 71,
    lastActivity: "2分前",
    workflow: "WF-03 Product → QA",
    completedToday: 9,
    accent: "var(--emp-f)",
    responsibilities: [
      "品質・事実・ロジック確認",
      "UIチェック / データ整合性",
      "リスク検知",
      "AI社員の成果物監査",
    ],
    capabilities: ["Logic Check", "Data Integrity", "Risk Detection", "Final Review"],
    steps: ["Intake", "Fact check", "Logic check", "Risk scan", "Verdict"],
    performance: { tasksCompleted: 286, successRate: 98.2, avgCompletion: "11m", qaPassRate: 99.1 },
    permissions: { read: ["Everything required for QA"], write: ["QA", "Audit", "Issue"] },
    systemPrompt:
      "You are Employee F of S-QUEST COMPANY. You are the last gate before CEO. Block anything unverifiable and report the exact reason.",
    activity: [
      { at: "21:00", text: "KPI データ不整合 1件を検知（Warning）" },
      { at: "20:15", text: "C の UI 改訂を条件付き合格" },
    ],
  },
];

export const employeeByCode = (code: string) =>
  EMPLOYEES.find((e) => e.code === code.toUpperCase());

export type TaskStatus = "BACKLOG" | "TODO" | "IN PROGRESS" | "REVIEW" | "DONE" | "BLOCKED";
export type Priority = "P0" | "P1" | "P2";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assignee: EmployeeCode | "JARVIS" | "CEO";
  createdBy: string;
  due: string;
  project: string;
  workflow: string;
  dependencies: string[];
  comments: { by: string; text: string; at: string }[];
  log: { at: string; text: string }[];
}

export const TASK_COLUMNS: TaskStatus[] = [
  "BACKLOG",
  "TODO",
  "IN PROGRESS",
  "REVIEW",
  "DONE",
  "BLOCKED",
];

export const TASKS: Task[] = [
  {
    id: "TSK-1041",
    title: "Revenue Gap 要因分析レポート",
    description: "月次売上が目標に対し ¥172,000 不足。要因を Sales / Marketing 両面から分解する。",
    status: "IN PROGRESS",
    priority: "P0",
    assignee: "B",
    createdBy: "JARVIS",
    due: "Today 23:00",
    project: "S-QUEST Company",
    workflow: "WF-06 KPI → Strategy",
    dependencies: ["TSK-1039", "TSK-1040"],
    comments: [
      { by: "JARVIS", text: "A と D の一次データが揃いました。統合してください。", at: "20:22" },
    ],
    log: [
      { at: "20:20", text: "JARVIS が B に割り当て" },
      { at: "20:44", text: "B が作業を開始" },
    ],
  },
  {
    id: "TSK-1040",
    title: "Sales pipeline 停滞商談の抽出",
    description: "14日以上動きのない商談を抽出し、停滞理由を分類する。",
    status: "IN PROGRESS",
    priority: "P0",
    assignee: "D",
    createdBy: "JARVIS",
    due: "Today 22:00",
    project: "S-QUEST Company",
    workflow: "WF-05 Sales → KPI",
    dependencies: [],
    comments: [],
    log: [{ at: "20:21", text: "JARVIS が D に割り当て" }],
  },
  {
    id: "TSK-1039",
    title: "競合SNS施策の市場調査",
    description: "競合4社の直近30日のSNS施策と反応率を収集。",
    status: "DONE",
    priority: "P1",
    assignee: "A",
    createdBy: "JARVIS",
    due: "Today 20:00",
    project: "Marketing",
    workflow: "WF-01 Research → Strategy",
    dependencies: [],
    comments: [{ by: "F", text: "出典3件のうち1件が二次情報。注記済み。", at: "20:38" }],
    log: [{ at: "20:41", text: "A が完了、KNOWLEDGE に登録" }],
  },
  {
    id: "TSK-1038",
    title: "新LP公開申請のレビュー",
    description: "C が作成したLPの公開可否。外部公開のためCEO承認が必要。",
    status: "REVIEW",
    priority: "P0",
    assignee: "F",
    createdBy: "C",
    due: "Today 21:30",
    project: "S-QUEST Diagnosis",
    workflow: "WF-03 Product → QA",
    dependencies: [],
    comments: [],
    log: [{ at: "20:58", text: "C が申請、F がレビュー開始" }],
  },
  {
    id: "TSK-1037",
    title: "診断離脱率の改善仮説",
    description: "Q18〜Q24 の離脱集中区間に対する改善案を3つ作る。",
    status: "TODO",
    priority: "P1",
    assignee: "C",
    createdBy: "CEO",
    due: "Tomorrow 12:00",
    project: "S-QUEST Diagnosis",
    workflow: "WF-02 Strategy → Product",
    dependencies: ["TSK-1041"],
    comments: [],
    log: [{ at: "19:02", text: "CEO が作成" }],
  },
  {
    id: "TSK-1036",
    title: "Instagram 週次投稿カレンダー",
    description: "16タイプ紹介シリーズを軸に7日分の投稿を設計。",
    status: "TODO",
    priority: "P1",
    assignee: "E",
    createdBy: "JARVIS",
    due: "Tomorrow 10:00",
    project: "SNS",
    workflow: "WF-04 Marketing → Sales",
    dependencies: [],
    comments: [],
    log: [{ at: "18:20", text: "JARVIS が E に割り当て" }],
  },
  {
    id: "TSK-1035",
    title: "KPI データ不整合の修正",
    description: "Diagnosis Completion Rate の集計期間が二重計上されている。",
    status: "BLOCKED",
    priority: "P0",
    assignee: "F",
    createdBy: "F",
    due: "Today 23:59",
    project: "AI Company",
    workflow: "WF-05 Sales → KPI",
    dependencies: ["TSK-1040"],
    comments: [{ by: "F", text: "データソース確定までブロック。", at: "21:00" }],
    log: [{ at: "21:00", text: "F が Blocked に変更" }],
  },
  {
    id: "TSK-1034",
    title: "16タイプ Master Data 監査",
    description: "正式名称・PLANT・WEAPON の整合性を全件確認。",
    status: "BACKLOG",
    priority: "P2",
    assignee: "F",
    createdBy: "JARVIS",
    due: "This week",
    project: "S-QUEST Diagnosis",
    workflow: "WF-03 Product → QA",
    dependencies: [],
    comments: [],
    log: [],
  },
  {
    id: "TSK-1033",
    title: "B2B 提案テンプレート更新",
    description: "採用・研修向けの提案骨子を最新の16タイプ表現に合わせる。",
    status: "BACKLOG",
    priority: "P2",
    assignee: "D",
    createdBy: "JARVIS",
    due: "This week",
    project: "S-QUEST Company",
    workflow: "WF-04 Marketing → Sales",
    dependencies: [],
    comments: [],
    log: [],
  },
  {
    id: "TSK-1032",
    title: "Career 導線のCTR改善",
    description: "結果画面からキャリア導線への遷移文言を3案テスト。",
    status: "DONE",
    priority: "P1",
    assignee: "E",
    createdBy: "JARVIS",
    due: "Yesterday",
    project: "Marketing",
    workflow: "WF-04 Marketing → Sales",
    dependencies: [],
    comments: [],
    log: [{ at: "Yesterday 18:40", text: "E が完了" }],
  },
];

export interface Kpi {
  name: string;
  category: "BUSINESS" | "PRODUCT" | "MARKETING" | "SALES" | "DIAGNOSIS" | "AI COMPANY";
  value: string;
  target: string;
  previous: string;
  change: number;
  owner: string;
  trend: number[];
}

export const KPIS: Kpi[] = [
  { name: "Monthly Revenue", category: "BUSINESS", value: "¥328,000", target: "¥500,000", previous: "¥277,000", change: 18.4, owner: "D", trend: [180, 205, 232, 251, 268, 297, 328] },
  { name: "MRR", category: "BUSINESS", value: "¥84,000", target: "¥150,000", previous: "¥79,500", change: 5.7, owner: "D", trend: [62, 66, 70, 73, 76, 79, 84] },
  { name: "Profit", category: "BUSINESS", value: "¥196,400", target: "¥300,000", previous: "¥162,000", change: 21.2, owner: "CEO", trend: [98, 112, 130, 141, 158, 162, 196] },
  { name: "Leads", category: "SALES", value: "142", target: "220", previous: "173", change: -17.9, owner: "D", trend: [190, 186, 181, 178, 173, 158, 142] },
  { name: "Conversion Rate", category: "SALES", value: "4.8%", target: "6.5%", previous: "4.4%", change: 9.1, owner: "D", trend: [3.8, 4.0, 4.1, 4.3, 4.4, 4.6, 4.8] },
  { name: "Pipeline Value", category: "SALES", value: "¥1,240,000", target: "¥2,000,000", previous: "¥1,180,000", change: 5.1, owner: "D", trend: [890, 940, 1010, 1080, 1120, 1180, 1240] },
  { name: "Active Users", category: "PRODUCT", value: "3,412", target: "5,000", previous: "3,190", change: 7.0, owner: "C", trend: [2400, 2610, 2820, 2960, 3080, 3190, 3412] },
  { name: "Diagnosis Starts", category: "DIAGNOSIS", value: "1,284", target: "2,000", previous: "1,150", change: 11.7, owner: "E", trend: [780, 860, 940, 1020, 1080, 1150, 1284] },
  { name: "Diagnosis Completion Rate", category: "DIAGNOSIS", value: "72.4%", target: "80%", previous: "70.1%", change: 3.3, owner: "C", trend: [64, 66, 67, 68, 69, 70, 72] },
  { name: "Average Answer Time", category: "DIAGNOSIS", value: "6m 12s", target: "5m 00s", previous: "6m 41s", change: -7.2, owner: "C", trend: [7.8, 7.4, 7.1, 6.9, 6.8, 6.7, 6.2] },
  { name: "Result View Rate", category: "DIAGNOSIS", value: "94.1%", target: "96%", previous: "93.4%", change: 0.7, owner: "C", trend: [90, 91, 92, 92, 93, 93, 94] },
  { name: "Result Satisfaction", category: "DIAGNOSIS", value: "4.42 / 5", target: "4.6", previous: "4.38", change: 0.9, owner: "C", trend: [4.1, 4.2, 4.25, 4.3, 4.34, 4.38, 4.42] },
  { name: "Share Rate", category: "DIAGNOSIS", value: "18.7%", target: "25%", previous: "17.2%", change: 8.7, owner: "E", trend: [12, 13, 14, 15, 16, 17, 18.7] },
  { name: "Compatibility Transition", category: "DIAGNOSIS", value: "41.2%", target: "50%", previous: "39.8%", change: 3.5, owner: "C", trend: [31, 33, 35, 37, 38, 39.8, 41.2] },
  { name: "Career Click Rate", category: "DIAGNOSIS", value: "12.8%", target: "18%", previous: "11.9%", change: 7.6, owner: "E", trend: [8, 9, 10, 10.8, 11.4, 11.9, 12.8] },
  { name: "SNS Growth", category: "MARKETING", value: "+2,140", target: "+3,000", previous: "+1,880", change: 13.8, owner: "E", trend: [820, 1010, 1240, 1480, 1660, 1880, 2140] },
  { name: "SEO Impressions", category: "MARKETING", value: "84,200", target: "120,000", previous: "78,400", change: 7.4, owner: "E", trend: [48, 55, 62, 68, 73, 78, 84] },
  { name: "Tasks Completed", category: "AI COMPANY", value: "37", target: "45", previous: "31", change: 19.4, owner: "JARVIS", trend: [22, 25, 27, 29, 30, 31, 37] },
  { name: "QA Pass Rate", category: "AI COMPANY", value: "94.6%", target: "97%", previous: "93.1%", change: 1.6, owner: "F", trend: [88, 89, 90, 91, 92, 93, 94.6] },
  { name: "Workflow Success Rate", category: "AI COMPANY", value: "91.2%", target: "96%", previous: "92.8%", change: -1.7, owner: "JARVIS", trend: [95, 94, 94, 93, 93, 92.8, 91.2] },
];

export const DASHBOARD_KPI_NAMES = [
  "Monthly Revenue",
  "MRR",
  "Leads",
  "Conversion Rate",
  "Active Users",
  "Diagnosis Completion Rate",
  "SNS Growth",
  "Tasks Completed",
];

export const REVENUE = {
  total: 2148000,
  monthly: 328000,
  goal: 500000,
  mrr: 84000,
  arr: 1008000,
  affiliate: 62000,
  career: 118000,
  b2b: 132000,
  other: 16000,
  expenses: 131600,
  profit: 196400,
};

export const REVENUE_SERIES: Record<string, { label: string; revenue: number; expenses: number; profit: number }[]> = {
  "7D": [
    { label: "Aug 20", revenue: 38000, expenses: 15200, profit: 22800 },
    { label: "Aug 21", revenue: 42000, expenses: 16100, profit: 25900 },
    { label: "Aug 22", revenue: 36000, expenses: 14800, profit: 21200 },
    { label: "Aug 23", revenue: 51000, expenses: 18300, profit: 32700 },
    { label: "Aug 24", revenue: 47000, expenses: 17400, profit: 29600 },
    { label: "Aug 25", revenue: 56000, expenses: 19800, profit: 36200 },
    { label: "Aug 26", revenue: 58000, expenses: 20000, profit: 38000 },
  ],
  "30D": [
    { label: "W1", revenue: 62000, expenses: 28000, profit: 34000 },
    { label: "W2", revenue: 78000, expenses: 31000, profit: 47000 },
    { label: "W3", revenue: 92000, expenses: 34600, profit: 57400 },
    { label: "W4", revenue: 96000, expenses: 38000, profit: 58000 },
  ],
  "90D": [
    { label: "Jun", revenue: 184000, expenses: 92000, profit: 92000 },
    { label: "Jul", revenue: 277000, expenses: 115000, profit: 162000 },
    { label: "Aug", revenue: 328000, expenses: 131600, profit: 196400 },
  ],
  "1Y": [
    { label: "Q3 25", revenue: 210000, expenses: 140000, profit: 70000 },
    { label: "Q4 25", revenue: 388000, expenses: 201000, profit: 187000 },
    { label: "Q1 26", revenue: 512000, expenses: 244000, profit: 268000 },
    { label: "Q2 26", revenue: 649000, expenses: 281000, profit: 368000 },
    { label: "Q3 26", revenue: 789000, expenses: 338600, profit: 450400 },
  ],
  All: [
    { label: "2025", revenue: 598000, expenses: 341000, profit: 257000 },
    { label: "2026", revenue: 1550000, expenses: 863600, profit: 686400 },
  ],
};

export const CALENDAR_EVENTS = [
  { day: "TODAY", date: "Aug 26", items: [{ time: "10:00", title: "CEO Review", kind: "Meeting", who: "CEO" }, { time: "13:00", title: "Marketing Meeting", kind: "Meeting", who: "E" }, { time: "16:00", title: "Product Review", kind: "Review", who: "C" }, { time: "22:00", title: "WF-06 KPI → Strategy", kind: "Workflow", who: "JARVIS" }] },
  { day: "THU", date: "Aug 27", items: [{ time: "09:30", title: "Daily Company Report", kind: "Report", who: "JARVIS" }, { time: "11:00", title: "LP 公開判断", kind: "Approval", who: "CEO" }, { time: "15:00", title: "SNS 投稿バッチ", kind: "Deadline", who: "E" }] },
  { day: "FRI", date: "Aug 28", items: [{ time: "10:00", title: "Sales Pipeline Review", kind: "Meeting", who: "D" }, { time: "14:00", title: "WF-01 Research → Strategy", kind: "Workflow", who: "JARVIS" }] },
  { day: "SAT", date: "Aug 29", items: [{ time: "12:00", title: "Weekly Report", kind: "Report", who: "JARVIS" }] },
  { day: "SUN", date: "Aug 30", items: [{ time: "20:00", title: "診断 Q18 改善リリース", kind: "Deadline", who: "C" }] },
  { day: "MON", date: "Aug 31", items: [{ time: "09:00", title: "Monthly Close", kind: "Deadline", who: "CEO" }, { time: "11:00", title: "Monthly Report", kind: "Report", who: "JARVIS" }] },
  { day: "TUE", date: "Sep 1", items: [{ time: "10:00", title: "September Strategy Kickoff", kind: "Meeting", who: "B" }] },
];

export const ACTIVITY = [
  { at: "21:02", actor: "B", text: "Revenue Gap 改善戦略の作成を開始しました", kind: "work" },
  { at: "21:01", actor: "D", text: "B2B 商談3件を Proposal に移動しました", kind: "work" },
  { at: "21:00", actor: "F", text: "KPI データ不整合を1件検知しました", kind: "issue" },
  { at: "20:58", actor: "C", text: "新LP公開の承認をCEOに申請しました", kind: "approval" },
  { at: "20:41", actor: "A", text: "市場調査を完了し KNOWLEDGE に登録しました", kind: "done" },
  { at: "20:35", actor: "E", text: "Instagram 投稿案5件を作成しました", kind: "work" },
  { at: "20:22", actor: "JARVIS", text: "WF-06 を起動し A / D / B に配分しました", kind: "workflow" },
  { at: "19:44", actor: "D", text: "新規リード3件を CRM に登録しました", kind: "work" },
  { at: "19:02", actor: "CEO", text: "診断離脱率の改善タスクを作成しました", kind: "ceo" },
  { at: "18:20", actor: "E", text: "ファネル分析を更新しました", kind: "work" },
];

export type AlertLevel = "INFO" | "WARNING" | "CRITICAL" | "APPROVAL";

export const ALERTS: {
  level: AlertLevel;
  title: string;
  body: string;
  action: string;
  reason: string;
  risk: string;
  expected: string;
}[] = [
  {
    level: "APPROVAL",
    title: "承認が必要です",
    body: "C が新しいLP公開を申請しています",
    action: "外部公開 / s-quest.jp/lp/diagnosis-v2",
    reason: "診断開始率の改善のため、新導線LPを公開したい",
    risk: "MEDIUM — 公開後の表現修正はブランド影響あり",
    expected: "Diagnosis Starts +12〜18% / CV +0.6pt",
  },
  {
    level: "WARNING",
    title: "KPIデータの整合性",
    body: "Diagnosis Completion Rate の集計が二重計上されています（F 検知）",
    action: "KPI 集計ロジックの修正",
    reason: "集計期間の境界処理が重複",
    risk: "LOW — 表示値のみ影響",
    expected: "正確な完了率の再計算",
  },
  {
    level: "CRITICAL",
    title: "売上ギャップ",
    body: "月次目標に対し ¥172,000 不足。Lead volume が18%減少しています",
    action: "WF-06 KPI → Strategy の実行",
    reason: "リード減少が売上に直結",
    risk: "HIGH — 月次目標未達の可能性",
    expected: "改善戦略と実行タスクの生成",
  },
];

export interface Workflow {
  code: string;
  name: string;
  description: string;
  trigger: string;
  status: "ACTIVE" | "IDLE" | "FAILED";
  version: string;
  runs: number;
  successRate: number;
  diagram: string[];
  input: string;
  processing: string[];
  output: string;
  approvalGate: string;
  failureBranch: string;
  osUpdate: string;
  retry: string;
  timeout: string;
}

export const WORKFLOWS: Workflow[] = [
  {
    code: "WF-01",
    name: "Research → Strategy",
    description: "市場・競合の一次情報を戦略仮説に変換する基幹Workflow。",
    trigger: "CEO 指示 / 週次スケジュール",
    status: "ACTIVE",
    version: "v1.3",
    runs: 128,
    successRate: 96.1,
    diagram: ["トリガー", "A 調査", "JARVIS", "B 戦略", "F 品質", "CEO承認", "会社データ更新"],
    input: "調査テーマ / 対象市場 / 期間",
    processing: ["A が情報収集・Fact Check", "JARVIS が要約統合", "B が戦略仮説を構築", "F が整合性監査"],
    output: "Research Report + Strategy Hypothesis",
    approvalGate: "OS の STRATEGY 更新時のみ CEO 承認",
    failureBranch: "出典不足 → A に再収集を差し戻し（最大2回）",
    osUpdate: "KNOWLEDGE / STRATEGY",
    retry: "2回 / 指数バックオフ",
    timeout: "15分",
  },
  {
    code: "WF-02",
    name: "Strategy → Product",
    description: "戦略をプロダクト仕様とクリエイティブに落とす。",
    trigger: "STRATEGY 更新",
    status: "ACTIVE",
    version: "v1.1",
    runs: 74,
    successRate: 93.2,
    diagram: ["トリガー", "B 戦略", "JARVIS", "C 企画", "F 品質", "CEO承認", "会社データ更新"],
    input: "戦略仮説 / 優先KPI",
    processing: ["C が仕様とUXを設計", "JARVIS が影響範囲を確認", "F が品質確認"],
    output: "Product Spec / UI Draft",
    approvalGate: "本番Deploy・外部公開",
    failureBranch: "ブランド規約違反 → C に差し戻し",
    osUpdate: "PRODUCT / BRAND",
    retry: "1回",
    timeout: "25分",
  },
  {
    code: "WF-03",
    name: "Product → QA",
    description: "成果物を公開前に監査する最終ゲート。",
    trigger: "成果物提出",
    status: "ACTIVE",
    version: "v1.4",
    runs: 211,
    successRate: 98.4,
    diagram: ["トリガー", "C 企画", "F 品質", "JARVIS", "CEO承認"],
    input: "成果物 / チェック観点",
    processing: ["F が事実・ロジック・UI・データ整合性を確認", "リスク検知", "JARVIS が要約"],
    output: "QA Verdict + Issue List",
    approvalGate: "公開・送信を伴う全操作",
    failureBranch: "不合格 → 担当社員に Issue 付きで差し戻し",
    osUpdate: "QA / ISSUE",
    retry: "0回（人間判断）",
    timeout: "10分",
  },
  {
    code: "WF-04",
    name: "Marketing → Sales",
    description: "獲得したリードを商談へ受け渡す。",
    trigger: "キャンペーン公開 / リード発生",
    status: "ACTIVE",
    version: "v1.0",
    runs: 96,
    successRate: 90.6,
    diagram: ["トリガー", "E 集客", "JARVIS", "D 営業", "F 品質", "会社データ更新"],
    input: "キャンペーン結果 / リードリスト",
    processing: ["E がファネルを分析", "JARVIS がリードを配分", "D がスコアリングし商談化"],
    output: "Qualified Leads / Pipeline Update",
    approvalGate: "外部送信（メール・DM）",
    failureBranch: "リード品質不足 → E に再設計を依頼",
    osUpdate: "MARKETING / SALES",
    retry: "1回",
    timeout: "20分",
  },
  {
    code: "WF-05",
    name: "Sales → KPI",
    description: "商談・売上の実績をKPIへ反映する。",
    trigger: "商談ステージ変更 / 日次バッチ",
    status: "IDLE",
    version: "v1.2",
    runs: 302,
    successRate: 97.7,
    diagram: ["トリガー", "D 営業", "JARVIS", "F 品質", "会社データ更新"],
    input: "Deal / Revenue データ",
    processing: ["D が実績を集計", "F がデータ整合性を確認", "JARVIS が KPI を更新"],
    output: "KPI Values / Revenue Snapshot",
    approvalGate: "なし（読取と集計のみ）",
    failureBranch: "不整合 → 集計を停止し F が Issue 発行",
    osUpdate: "KPI / REVENUE",
    retry: "3回",
    timeout: "8分",
  },
  {
    code: "WF-06",
    name: "KPI → Strategy",
    description: "KPI 逸脱を検知し改善戦略を生成する自律ループ。",
    trigger: "KPI 閾値逸脱",
    status: "ACTIVE",
    version: "v1.1",
    runs: 41,
    successRate: 88.9,
    diagram: ["トリガー", "A 調査", "D 営業", "E 集客", "JARVIS", "B 戦略", "F 品質", "CEO承認"],
    input: "逸脱KPI / 期間 / 許容範囲",
    processing: ["A / D / E が要因データを収集", "JARVIS が統合", "B が改善戦略を設計", "F が検証"],
    output: "Gap Analysis + Improvement Plan",
    approvalGate: "施策実行前に CEO 承認",
    failureBranch: "要因特定不能 → CEO へエスカレーション",
    osUpdate: "STRATEGY / KPI",
    retry: "1回",
    timeout: "30分",
  },
];

export interface OsEntry {
  key: string;
  value: string;
  version: string;
  updatedBy: string;
  updatedAt: string;
  status: "ACTIVE" | "DRAFT" | "REVIEW";
  source: string;
  confidence: number;
}

export const OS_CATEGORIES = [
  "COMPANY",
  "BRAND",
  "SERVICE",
  "DIAGNOSIS",
  "PRODUCT",
  "MARKETING",
  "SALES",
  "KPI",
  "REVENUE",
  "AI",
  "WORKFLOW",
  "RULES",
  "KNOWLEDGE",
] as const;

export type OsCategory = (typeof OS_CATEGORIES)[number];

export const COMPANY_OS: Record<OsCategory, OsEntry[]> = {
  COMPANY: [
    { key: "Mission", value: "自分の強みを、迷わず選べる社会をつくる。", version: "v1.2", updatedBy: "CEO", updatedAt: "2026-08-20", status: "ACTIVE", source: "CEO", confidence: 100 },
    { key: "Vision", value: "AI社員と人間CEOが共に経営する、次世代の会社モデルを実証する。", version: "v1.1", updatedBy: "CEO", updatedAt: "2026-08-18", status: "ACTIVE", source: "CEO", confidence: 100 },
    { key: "Values", value: "Clarity / Speed / Evidence / Ownership", version: "v1.0", updatedBy: "CEO", updatedAt: "2026-07-30", status: "ACTIVE", source: "CEO", confidence: 100 },
    { key: "Business Model", value: "診断（無償）→ 相性・キャリア導線（アフィリエイト / 送客）→ B2B 提供（採用・研修）", version: "v1.4", updatedBy: "B｜Strategy", updatedAt: "2026-08-24", status: "ACTIVE", source: "WF-01", confidence: 88 },
    { key: "Goal 2026 Q3", value: "月次売上 ¥500,000 / 診断開始 2,000件", version: "v1.3", updatedBy: "B｜Strategy", updatedAt: "2026-08-26", status: "ACTIVE", source: "WF-06", confidence: 84 },
  ],
  BRAND: [
    { key: "Brand Identity", value: "静かな知性。ゲーム性はプロダクト内に、経営面にはExecutiveな落ち着き。", version: "v1.1", updatedBy: "C｜Creative", updatedAt: "2026-08-22", status: "ACTIVE", source: "CEO", confidence: 92 },
    { key: "Colors", value: "Base: Deep Navy / Accent: Cyan / Employee accents: A Blue, B Purple, C Red, D Orange, E Green, F Cyan", version: "v1.0", updatedBy: "C｜Creative", updatedAt: "2026-08-22", status: "ACTIVE", source: "Design System", confidence: 96 },
    { key: "Typography", value: "Inter / Noto Sans JP。数値は大きく tabular。", version: "v1.0", updatedBy: "C｜Creative", updatedAt: "2026-08-22", status: "ACTIVE", source: "Design System", confidence: 96 },
    { key: "Tone", value: "断定しすぎない。根拠を添える。誇張しない。", version: "v1.0", updatedBy: "C｜Creative", updatedAt: "2026-08-10", status: "ACTIVE", source: "CEO", confidence: 90 },
  ],
  SERVICE: [
    { key: "S-QUEST", value: "ゲーム性のあるキャリア診断。PLANT × WEAPON による16タイプ。", version: "v2.0", updatedBy: "C｜Creative", updatedAt: "2026-08-19", status: "ACTIVE", source: "Product", confidence: 98 },
    { key: "S-QUEST COMPANY", value: "AI社員が働く社内経営OS。本システム。", version: "v1.0", updatedBy: "CEO", updatedAt: "2026-08-26", status: "ACTIVE", source: "CEO", confidence: 100 },
    { key: "Future Products", value: "Team診断 / 採用マッチング / 研修プログラム", version: "v0.4", updatedBy: "B｜Strategy", updatedAt: "2026-08-16", status: "DRAFT", source: "WF-01", confidence: 62 },
  ],
  DIAGNOSIS: [
    { key: "Questions", value: "50問（Light）/ 100問（Full）。PLANT軸4 × WEAPON軸4。", version: "v1.6", updatedBy: "C｜Creative", updatedAt: "2026-08-21", status: "ACTIVE", source: "Product", confidence: 95 },
    { key: "Scoring", value: "PLANT: AUGUSTA / MONSTERA / PACHIRA / EVERFRESH、WEAPON: B / S / X / K の合算スコアで判定。", version: "v1.5", updatedBy: "C｜Creative", updatedAt: "2026-08-21", status: "ACTIVE", source: "Product", confidence: 94 },
    { key: "Result Logic", value: "16タイプ → 強み / 適職 / 相性 / キャリア導線", version: "v1.4", updatedBy: "C｜Creative", updatedAt: "2026-08-21", status: "REVIEW", source: "WF-02", confidence: 86 },
    { key: "Drop-off", value: "Q18〜Q24 に離脱集中（Light版）", version: "v1.0", updatedBy: "A｜Research", updatedAt: "2026-08-25", status: "ACTIVE", source: "WF-01", confidence: 79 },
  ],
  PRODUCT: [
    { key: "Features", value: "診断 / 結果 / 相性 / キャリア / シェア", version: "v1.8", updatedBy: "C｜Creative", updatedAt: "2026-08-23", status: "ACTIVE", source: "Product", confidence: 93 },
    { key: "Bugs", value: "結果シェア画像が一部端末で欠ける（Open 2件）", version: "v1.0", updatedBy: "F｜QA", updatedAt: "2026-08-26", status: "ACTIVE", source: "WF-03", confidence: 88 },
    { key: "Roadmap", value: "Q3: 離脱改善 / Q4: Team診断β", version: "v1.2", updatedBy: "B｜Strategy", updatedAt: "2026-08-24", status: "ACTIVE", source: "WF-02", confidence: 81 },
  ],
  MARKETING: [
    { key: "SNS", value: "Instagram 主軸 / X 補助。16タイプ紹介シリーズが最高反応。", version: "v1.3", updatedBy: "E｜Marketing", updatedAt: "2026-08-25", status: "ACTIVE", source: "WF-04", confidence: 87 },
    { key: "SEO", value: "「キャリア診断」「強み 診断」中心。月間84,200 imp。", version: "v1.1", updatedBy: "E｜Marketing", updatedAt: "2026-08-24", status: "ACTIVE", source: "WF-04", confidence: 84 },
    { key: "Funnel", value: "SNS → LP → 診断開始 → 完了 → 結果 → キャリア", version: "v1.2", updatedBy: "E｜Marketing", updatedAt: "2026-08-22", status: "ACTIVE", source: "WF-04", confidence: 90 },
  ],
  SALES: [
    { key: "Pipeline", value: "Lead 142 / Qualified 38 / Proposal 12 / Won 4", version: "v1.0", updatedBy: "D｜Sales", updatedAt: "2026-08-26", status: "ACTIVE", source: "WF-05", confidence: 91 },
    { key: "B2B Offer", value: "採用適性・チーム編成向けの16タイプ活用パッケージ", version: "v1.1", updatedBy: "D｜Sales", updatedAt: "2026-08-20", status: "ACTIVE", source: "WF-04", confidence: 78 },
  ],
  KPI: [
    { key: "Primary KPI", value: "Monthly Revenue / Diagnosis Completion Rate / Career Click Rate", version: "v1.2", updatedBy: "B｜Strategy", updatedAt: "2026-08-26", status: "ACTIVE", source: "WF-06", confidence: 92 },
    { key: "Alert Threshold", value: "主要KPIが目標比 -10% を超えた場合 WF-06 を自動起動", version: "v1.0", updatedBy: "JARVIS", updatedAt: "2026-08-15", status: "ACTIVE", source: "Rules", confidence: 100 },
  ],
  REVENUE: [
    { key: "Streams", value: "Affiliate / Career 送客 / B2B / Other", version: "v1.0", updatedBy: "D｜Sales", updatedAt: "2026-08-12", status: "ACTIVE", source: "WF-05", confidence: 95 },
    { key: "Monthly Goal", value: "¥500,000", version: "v1.1", updatedBy: "CEO", updatedAt: "2026-08-01", status: "ACTIVE", source: "CEO", confidence: 100 },
  ],
  AI: [
    { key: "AI Employees", value: "A RESEARCH / B STRATEGY / C CREATIVE / D SALES / E MARKETING / F QA", version: "v1.0", updatedBy: "CEO", updatedAt: "2026-08-26", status: "ACTIVE", source: "CEO", confidence: 100 },
    { key: "Permissions", value: "各社員は担当領域のみ WRITE。CEO は FULL ACCESS、JARVIS は ORCHESTRATOR ACCESS。", version: "v1.0", updatedBy: "CEO", updatedAt: "2026-08-26", status: "ACTIVE", source: "Rules", confidence: 100 },
    { key: "Logs", value: "全操作を audit_logs に記録。保持365日。", version: "v1.0", updatedBy: "F｜QA", updatedAt: "2026-08-26", status: "ACTIVE", source: "Rules", confidence: 100 },
  ],
  WORKFLOW: [
    { key: "Active Workflows", value: "WF-01 〜 WF-06", version: "v1.0", updatedBy: "JARVIS", updatedAt: "2026-08-26", status: "ACTIVE", source: "Rules", confidence: 100 },
    { key: "Orchestration Rule", value: "AI社員同士は直接通信しない。必ず JARVIS を経由する。", version: "v1.0", updatedBy: "CEO", updatedAt: "2026-08-14", status: "ACTIVE", source: "Rules", confidence: 100 },
  ],
  RULES: [
    { key: "Approval Gate", value: "外部公開 / SNS投稿 / メール送信 / 契約 / 支払い / データ削除 / 本番Deploy / 重要OS更新", version: "v1.0", updatedBy: "CEO", updatedAt: "2026-08-14", status: "ACTIVE", source: "CEO", confidence: 100 },
    { key: "No Fake Completion", value: "実処理が存在しない場合、完了を偽装しない。SIMULATION と明示する。", version: "v1.0", updatedBy: "CEO", updatedAt: "2026-08-26", status: "ACTIVE", source: "CEO", confidence: 100 },
  ],
  KNOWLEDGE: [
    { key: "16 TYPES MASTER", value: "AUGUSTA: AB覇王 / AS軍師 / AX将軍 / AK賢王、MONSTERA: CB英雄 / CS外交官 / CX遊撃士 / CK賢者、PACHIRA: SB守護者 / SS参謀 / SX騎士 / SK学士、EVERFRESH: EB冒険王 / ES探究者 / EX疾風 / EK錬金術師", version: "v1.0", updatedBy: "CEO", updatedAt: "2026-08-05", status: "ACTIVE", source: "Master Data", confidence: 100 },
    { key: "Competitor Scan 2026-08", value: "競合4社はいずれも結果のシェア設計が弱い。差別化余地あり。", version: "v1.0", updatedBy: "A｜Research", updatedAt: "2026-08-26", status: "ACTIVE", source: "WF-01", confidence: 82 },
  ],
};

export const OS_VERSIONS = [
  { version: "v1.0", date: "2026-08-26", by: "B｜Strategy", change: "Updated target audience", category: "COMPANY" },
  { version: "v0.9", date: "2026-08-25", by: "A｜Research", change: "Added competitor scan to KNOWLEDGE", category: "KNOWLEDGE" },
  { version: "v0.8", date: "2026-08-24", by: "E｜Marketing", change: "Updated funnel CV definitions", category: "MARKETING" },
  { version: "v0.7", date: "2026-08-22", by: "C｜Creative", change: "Brand color tokens finalized", category: "BRAND" },
  { version: "v0.6", date: "2026-08-21", by: "C｜Creative", change: "Diagnosis result logic to REVIEW", category: "DIAGNOSIS" },
];

export const PLANTS = [
  { name: "AUGUSTA", traits: "主体性・リーダーシップ・推進力", types: ["AB｜覇王", "AS｜軍師", "AX｜将軍", "AK｜賢王"] },
  { name: "MONSTERA", traits: "共感・傾聴・信頼・協調性", types: ["CB｜英雄", "CS｜外交官", "CX｜遊撃士", "CK｜賢者"] },
  { name: "PACHIRA", traits: "論理性・計画性・安定感・再現性", types: ["SB｜守護者", "SS｜参謀", "SX｜騎士", "SK｜学士"] },
  { name: "EVERFRESH", traits: "柔軟性・好奇心・適応力・発想力", types: ["EB｜冒険王", "ES｜探究者", "EX｜疾風", "EK｜錬金術師"] },
];

export const WEAPONS = [
  { code: "B", name: "大剣", theme: "突破", color: "oklch(0.65 0.19 22)" },
  { code: "S", name: "弓", theme: "戦略", color: "oklch(0.66 0.15 250)" },
  { code: "X", name: "双剣", theme: "適応", color: "oklch(0.64 0.17 300)" },
  { code: "K", name: "魔導書", theme: "知略", color: "oklch(0.7 0.16 152)" },
];

export const PROJECTS = [
  { name: "S-QUEST Diagnosis", status: "ON TRACK", owner: "C", progress: 74, deadline: "2026-09-15", tasks: 12, milestones: 4, kpi: "Completion Rate 72.4%", revenue: "¥118,000", risks: 1, employees: ["A", "C", "F"] },
  { name: "S-QUEST Company", status: "ON TRACK", owner: "CEO", progress: 41, deadline: "2026-10-01", tasks: 18, milestones: 6, kpi: "Workflow Success 91.2%", revenue: "—", risks: 2, employees: ["A", "B", "C", "D", "E", "F"] },
  { name: "Marketing", status: "AT RISK", owner: "E", progress: 58, deadline: "2026-09-01", tasks: 9, milestones: 3, kpi: "Leads -17.9%", revenue: "¥62,000", risks: 3, employees: ["A", "E"] },
  { name: "SNS", status: "ON TRACK", owner: "E", progress: 66, deadline: "Ongoing", tasks: 7, milestones: 2, kpi: "SNS Growth +2,140", revenue: "—", risks: 0, employees: ["C", "E"] },
  { name: "AI Company", status: "ON TRACK", owner: "JARVIS", progress: 52, deadline: "2026-11-01", tasks: 11, milestones: 5, kpi: "QA Pass 94.6%", revenue: "—", risks: 1, employees: ["B", "F"] },
  { name: "Product Development", status: "PLANNING", owner: "C", progress: 18, deadline: "2026-12-01", tasks: 6, milestones: 3, kpi: "—", revenue: "—", risks: 0, employees: ["B", "C"] },
];

export const REPORTS = [
  { id: "RPT-201", type: "DAILY", title: "Daily Company Report — Aug 26", by: "JARVIS", at: "21:00", summary: "売上 +18.4%、リード -17.9%。Lead volume が最大のボトルネック。" },
  { id: "RPT-200", type: "QA", title: "QA Audit — KPI 集計整合性", by: "F｜QA", at: "21:00", summary: "Completion Rate の二重計上を検知。修正まで参考値扱い。" },
  { id: "RPT-199", type: "MARKETING", title: "Funnel Report — Week 34", by: "E｜Marketing", at: "18:20", summary: "LP → 診断開始の遷移が 34.1%。Q18 離脱が完了率に直結。" },
  { id: "RPT-198", type: "SALES", title: "Pipeline Report", by: "D｜Sales", at: "17:40", summary: "Proposal 12件。停滞商談5件は意思決定者不在が主因。" },
  { id: "RPT-197", type: "STRATEGY", title: "Weekly Strategy Memo", by: "B｜Strategy", at: "Yesterday", summary: "Q3 は完了率と Career CTR の2点集中が最短経路。" },
  { id: "RPT-196", type: "WEEKLY", title: "Weekly Company Report — Week 34", by: "JARVIS", at: "Yesterday", summary: "タスク完了37件、Workflow成功率91.2%（-1.7pt）。" },
  { id: "RPT-195", type: "PRODUCT", title: "Product Review — 結果画面改訂", by: "C｜Creative", at: "2 days ago", summary: "16タイプ表示の情報密度を削減し、共有動線を上部へ。" },
  { id: "RPT-194", type: "MONTHLY", title: "Monthly Report — July", by: "JARVIS", at: "Aug 1", summary: "売上 ¥277,000。目標比 55.4%。" },
];

export const DAILY_REPORT = {
  revenue: "¥58,000（本日） / ¥328,000（月次）",
  tasksCompleted: "37件（前日比 +6）",
  problems: ["Lead volume が18%減少", "KPI 集計に二重計上", "停滞商談5件"],
  achievements: ["市場調査完了", "Career CTR +7.6%", "SNS +2,140"],
  employeeActivity: "A 6 / B 4 / C 5 / D 3 / E 7 / F 9 完了",
  kpiMovement: "Revenue +18.4% / Leads -17.9% / Completion +3.3pt",
  risks: ["月次目標未達の可能性（Gap ¥172,000）"],
  tomorrow: ["WF-06 の改善施策を実行", "LP 公開判断", "KPI 集計修正"],
  recommendation:
    "Marketing のリード獲得を最優先に戻すことを推奨します。LP公開の承認が最短のレバーです。",
};

export const AUDIT_LOGS = [
  { at: "2026-08-26 21:02", actor: "B｜Strategy", action: "Updated Strategy", target: "S-QUEST Marketing Plan", status: "SUCCESS", approval: "—" },
  { at: "2026-08-26 21:00", actor: "F｜QA", action: "Raised Issue", target: "KPI / Diagnosis Completion Rate", status: "SUCCESS", approval: "—" },
  { at: "2026-08-26 20:58", actor: "C｜Creative", action: "Requested Approval", target: "LP Publish / diagnosis-v2", status: "PENDING", approval: "CEO 待ち" },
  { at: "2026-08-26 20:41", actor: "A｜Research", action: "Created Knowledge", target: "Competitor Scan 2026-08", status: "SUCCESS", approval: "—" },
  { at: "2026-08-26 20:22", actor: "JARVIS", action: "Started Workflow", target: "WF-06 KPI → Strategy", status: "RUNNING", approval: "—" },
  { at: "2026-08-26 19:44", actor: "D｜Sales", action: "Created Leads (3)", target: "CRM", status: "SUCCESS", approval: "—" },
  { at: "2026-08-26 19:02", actor: "CEO", action: "Created Task", target: "TSK-1037", status: "SUCCESS", approval: "—" },
  { at: "2026-08-26 18:20", actor: "E｜Marketing", action: "Updated Funnel", target: "MARKETING / Funnel", status: "SUCCESS", approval: "—" },
];

export const NOTIFICATIONS = [
  { kind: "APPROVAL", title: "承認が必要です", body: "C — LP 公開申請", at: "4分前", unread: true },
  { kind: "QA", title: "QA Issue", body: "F — KPI データ不整合", at: "6分前", unread: true },
  { kind: "TASK", title: "タスク割当", body: "JARVIS → B: Revenue Gap 分析", at: "40分前", unread: true },
  { kind: "WORKFLOW", title: "Workflow 実行中", body: "WF-06 KPI → Strategy", at: "42分前", unread: false },
  { kind: "KPI", title: "KPI アラート", body: "Leads -17.9%（閾値超過）", at: "1時間前", unread: false },
  { kind: "REVENUE", title: "売上更新", body: "本日 ¥58,000 計上", at: "2時間前", unread: false },
];

export const QUICK_ACTIONS = [
  "KPIを分析",
  "タスクを作成",
  "市場を調査",
  "戦略を立案",
  "コンテンツを作成",
  "全社をレビュー",
];

export const JARVIS_EXAMPLES = [
  "今週の売上を確認して",
  "S-QUESTのInstagram戦略を作って",
  "診断の離脱率を分析して",
  "明日のタスクを整理して",
  "AとBに競合調査をさせて",
];

export const jpy = (n: number) => "¥" + n.toLocaleString("en-US");

export const empColor = (code: string) => {
  const e = employeeByCode(code);
  return e ? e.accent : "var(--primary)";
};

// ==========================================
// [FIXED] AI Employee Master Data & Workflow Engine
// ゲーム発展国風ドット絵プロファイル + ワンタップ承認自動ワークフロー
// ==========================================

/** AI社員プロファイル（キャラクター人格・ドット絵設定） */
export interface EmployeeProfile {
  code: EmployeeCode;
  name: string;
  englishName: string;
  role: string;
  persona: string;
  department: string;
  deskPosition: { x: number; y: number; floor: number };
  pixelConfig: PixelSpriteConfig;
  skills: string[];
  systemPrompt: string;
  kpi: { label: string; value: string; target: string };
}

/** AI社員マスターデータ [FIXED] */
export const AI_EMPLOYEES: Record<EmployeeCode, EmployeeProfile> = {
  A: {
    code: "A",
    name: "ベガパンク",
    englishName: "Vegapunk",
    role: "Research / Fact Check",
    persona: "白衣を着た巨大な頭脳を持つドット絵研究者。多画面モニターに囲まれ超高速リサーチを行う",
    department: "調査・リサーチ部",
    deskPosition: { x: 1, y: 1, floor: 1 },
    pixelConfig: {
      style: "kairosoft-pixel-art",
      baseColor: "#3B82F6",
      accessory: "巨大な頭脳ポッド＋丸メガネ",
      hairStyle: "爆発白髪",
      outfit: "白衣＋実験用ゴーグル",
      animationState: "typing",
      avatarSvgPlaceholder: '<svg width="64" height="64" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 2h8v2H4zM2 4h12v4H2zM4 8h8v6H4z" fill="#3B82F6"/><circle cx="8" cy="6" r="2" fill="#FFFFFF"/></svg>',
    },
    skills: ["市場調査", "競合分析", "ファクトチェック", "一次データ抽出", "トレンド予測"],
    kpi: { label: "リサーチ精度・ファクトチェック率", value: "98.5%", target: "99.0%" },
    systemPrompt: `あなたはA社員「ベガパンク（Research）」です。
【役割】市場調査、競合分析、ターゲット顧客調査、根拠数値のファクトチェック。
【思考様式】徹底的にロジカルかつ定量的。推測と事実を厳密に区別し、エビデンス（出所）のない情報は採用しません。
【アウトプット要件】1. 要約 2. 調査データ・事実（FACT） 3. 信頼性スコア 4. 課題・懸念点`,
  },
  B: {
    code: "B",
    name: "L",
    englishName: "L",
    role: "Strategy / KPI Logic",
    persona: "猫背でチェアーの上に座り、イチゴを食べながら多次元の戦略ロジックを組み立てるドット絵軍師",
    department: "経営戦略部",
    deskPosition: { x: 2, y: 1, floor: 1 },
    pixelConfig: {
      style: "kairosoft-pixel-art",
      baseColor: "#8B5CF6",
      accessory: "フォーク＋イチゴスイーツ",
      hairStyle: "無造作な黒髪ボサボサヘア",
      outfit: "白い長袖Tシャツ＋ジーンズ",
      animationState: "thinking",
      avatarSvgPlaceholder: '<svg width="64" height="64" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 3h6v3H5zM3 6h10v6H3zM5 12h6v2H5z" fill="#8B5CF6"/></svg>',
    },
    skills: ["事業戦略設計", "診断ロジック構築", "仮説検証", "KPI/KGI設計", "収益モデル検証"],
    kpi: { label: "戦略ロジック整合性・仮説検証率", value: "94.2%", target: "95.0%" },
    systemPrompt: `あなたはB社員「L（Strategy）」です。
【役割】事業戦略、診断ロジック、仮説検証アルゴリズム、KPI/KGI設計。
【思考様式】勝率99%のロジックしか組まない冷静沈着な軍師。弱点や矛盾を徹底的に突きます。
【アウトプット要件】1. 戦略骨子 2. 診断・アルゴリズム設計図 3. KPI分解ツリー 4. リスク・回避策`,
  },
  C: {
    code: "C",
    name: "レオナルド・ダ・ヴィンチ",
    englishName: "Leonardo da Vinci",
    role: "Creative / Product / UX",
    persona: "絵の具と筆を持ち、クラシカルな服を着てピクセルパーフェクトなUI/Webを創り出すドット絵巨匠",
    department: "プロダクト・クリエイティブ部",
    deskPosition: { x: 3, y: 1, floor: 1 },
    pixelConfig: {
      style: "kairosoft-pixel-art",
      baseColor: "#EC4899",
      accessory: "パレット＋魔法のペンタブ",
      hairStyle: "ウエーブの長い髭と髪",
      outfit: "ルネサンス風ベレー帽＋職人エプロン",
      animationState: "typing",
      avatarSvgPlaceholder: '<svg width="64" height="64" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 3h8v4H4zM2 7h12v5H2zM4 12h8v2H4z" fill="#EC4899"/></svg>',
    },
    skills: ["UI/UXデザイン", "LP/Web制作", "コピーライティング", "診断コンテンツ制作", "デザインシステム"],
    kpi: { label: "プロダクト完成度・UXスコア", value: "92.0%", target: "95.0%" },
    systemPrompt: `あなたはC社員「レオナルド・ダ・ヴィンチ（Creative）」です。
【役割】UI/UXデザイン、LP・Web・診断コンテンツのテキスト＆ワイヤー制作、クリエイティブ全般。
【思考様式】美しさとCVR（コンバージョン率）を極限まで両立。感動を与えるピクセル単位の表現力。
【アウトプット要件】1. デザイン/ワイヤー構成 2. UIコピー・テキスト全文 3. UX導線設計`,
  },
  D: {
    code: "D",
    name: "ジョーダン・ベルフォート",
    englishName: "Jordan Belfort",
    role: "Sales / CRM / Pitch",
    persona: "高級スーツを着て金色のマイクと電話を構え、熱血で商談を決めまくるドット絵セールスマン",
    department: "営業・収益化部",
    deskPosition: { x: 1, y: 2, floor: 1 },
    pixelConfig: {
      style: "kairosoft-pixel-art",
      baseColor: "#10B981",
      accessory: "ゴールドインカム＋シャンパングラス",
      hairStyle: "オールバック",
      outfit: "高級ストライプスーツ＋赤ネクタイ",
      animationState: "celebrating",
      avatarSvgPlaceholder: '<svg width="64" height="64" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 2h6v4H5zM3 6h10v6H3zM5 12h6v3H5z" fill="#10B981"/></svg>',
    },
    skills: ["法人営業設計", "提案書/ピッチデック制作", "トークスクリプト", "リード獲得", "CRM/マネタイズ"],
    kpi: { label: "商談化率・提案成約率", value: "38.5%", target: "40.0%" },
    systemPrompt: `あなたはD社員「ジョーダン・ベルフォート（Sales）」です。
【役割】法人営業、提案書作成、トークスクリプト設計、CRM・顧客獲得マネタイズ。
【思考様式】圧倒的熱量と心理学に基づいたマネタイズ思考。顧客の「買わない理由」を全て潰す。
【アウトプット要件】1. セールスストーリー 2. 提案書骨子/ピッチ案 3. 反論処理スクリプト`,
  },
  E: {
    code: "E",
    name: "スパイダーマン",
    englishName: "Spider-Man",
    role: "Marketing / Public Relations",
    persona: "赤と青のスーツでオフィス内をWeb（蜘蛛の糸）で飛び回り、SNSやバズを巻き起こすドット絵広報マン",
    department: "マーケティング・広報部",
    deskPosition: { x: 2, y: 2, floor: 1 },
    pixelConfig: {
      style: "kairosoft-pixel-art",
      baseColor: "#F59E0B",
      accessory: "蜘蛛の糸＋カメラ",
      hairStyle: "マスク装着（赤ベースに白い目）",
      outfit: "ヒーロースーツ＋一眼レフカメラ",
      animationState: "sitting",
      avatarSvgPlaceholder: '<svg width="64" height="64" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 2h8v5H4zM2 7h12v5H2zM4 12h8v2H4z" fill="#F59E0B"/></svg>',
    },
    skills: ["SNSマーケティング", "SEO/オウンドメディア", "広報/PRプレスリリース", "広告運用", "バズ企画"],
    kpi: { label: "月間リーチ数・診断流入CVR", value: "12.4%", target: "15.0%" },
    systemPrompt: `あなたはE社員「スパイダーマン（Marketing）」です。
【役割】SNSマーケティング、集客施策、PR・プレスリリース、SEO、キャンペーン企画。
【思考様式】親しみやすさと圧倒的フットワーク。世の中のトレンドを即座にキャッチして拡散させる。
【アウトプット要件】1. PR/SNS企画概要 2. 投稿文・プレスリリース原稿 3. 拡散導線設計`,
  },
  F: {
    code: "F",
    name: "ベイマックス",
    englishName: "Baymax",
    role: "QA / Quality & Compliance",
    persona: "真っ白で丸っこいドット絵ロボット。スキャナーで誤字やロジックエラーを0.1秒で発見・治療する監査官",
    department: "品質管理・監査部",
    deskPosition: { x: 3, y: 2, floor: 1 },
    pixelConfig: {
      style: "kairosoft-pixel-art",
      baseColor: "#6B7280",
      accessory: "ヘルスケア用赤外線スキャナー",
      hairStyle: "丸型ヘッド（2つの黒点目線）",
      outfit: "真っ白なケアロボットボディ",
      animationState: "sitting",
      avatarSvgPlaceholder: '<svg width="64" height="64" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 3h6v4H5zM2 7h12v6H2zM5 13h6v2H5z" fill="#E5E7EB"/><circle cx="6" cy="5" r="1" fill="#000"/><circle cx="10" cy="5" r="1" fill="#000"/></svg>',
    },
    skills: ["品質管理(QA)", "誤字脱字・表記揺れチェック", "ロジック破綻検証", "法務・景表法チェック", "リスク監査"],
    kpi: { label: "エラーゼロ率・QAパス率", value: "99.8%", target: "100.0%" },
    systemPrompt: `あなたはF社員「ベイマックス（QA）」です。
【役割】成果物の最終品質チェック、誤字脱字・表記検証、ロジック破綻検知、コンプライアンス監査。
【思考様式】「私はあなたの品質を守ります」。一切の妥協なく不備を指摘し、修正指示を出します。
【アウトプット要件】1. 判定（APPROVED / REVISION_REQUIRED / REJECTED） 2. 修正箇所一覧 3. リスク評価`,
  },
};

// EMPLOYEES にキャラクタープロファイルをマージ（Single Source of Truth を維持）
for (const e of EMPLOYEES) {
  const p = AI_EMPLOYEES[e.code];
  if (p) {
    e.personaName = p.name;
    e.persona = p.persona;
    e.pixelConfig = p.pixelConfig;
  }
}

// ------------------------------------------
// [FIXED] 自動ワークフローテンプレート
// 承認ワンタップで A → B → C → F → CEO への連携を完全自動化
// ------------------------------------------

export interface WorkflowNode {
  id: string;
  step: number;
  assignedEmployee: EmployeeCode;
  actionName: string;
  expectedOutput: string;
  autoApproveOnPass: boolean;
  status: "pending" | "in_progress" | "completed" | "revision_required";
}

export interface CompanyWorkflow {
  id: string;
  title: string;
  category: "NewFeature" | "MarketingCampaign" | "SalesPitch" | "QualityAudit";
  nodes: WorkflowNode[];
  /** CEO承認ワンタップで全自動ルーティング */
  isAutoWorkflowEnabled: boolean;
}

export const DEFAULT_WORKFLOWS: CompanyWorkflow[] = [
  {
    id: "wf-standard-product",
    title: "標準プロダクト・診断コンテンツ開発フロー",
    category: "NewFeature",
    isAutoWorkflowEnabled: true,
    nodes: [
      { id: "node-1", step: 1, assignedEmployee: "A", actionName: "市場・ターゲットファクトリサーチ", expectedOutput: "競合・ターゲット・ファクトデータシート", autoApproveOnPass: true, status: "pending" },
      { id: "node-2", step: 2, assignedEmployee: "B", actionName: "診断ロジック・KPIツリー設計", expectedOutput: "診断ロジック仕様書・仮説検証モデル", autoApproveOnPass: true, status: "pending" },
      { id: "node-3", step: 3, assignedEmployee: "C", actionName: "UIワイヤー・診断テキスト・UX制作", expectedOutput: "プロダクト画面原稿・UIコンポーネント仕様", autoApproveOnPass: true, status: "pending" },
      { id: "node-4", step: 4, assignedEmployee: "F", actionName: "QA・誤字ロジック最終チェック", expectedOutput: "QA監査レポート（APPROVED / REVISION）", autoApproveOnPass: true, status: "pending" },
    ],
  },
];

/** キャラクタープロファイル取得（A〜F） */
export const employeeProfile = (code: EmployeeCode): EmployeeProfile => AI_EMPLOYEES[code];

/** 表示名（例：「A・ベガパンク」） */
export const employeeDisplayName = (code: EmployeeCode): string =>
  `${code}・${AI_EMPLOYEES[code].name}`;
