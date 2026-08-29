/**
 * 会社健全性スコア（6項目・合計100点）。売上・利益/タスク進捗/AI社員稼働/
 * 品質/リスクはSupabaseの実データから算出する。「システム」だけは実データの
 * 裏付けが弱い項目のため、控えめな判定（ERROR状態のAI社員がいないか）に
 * 留める。ダッシュボード・JARVISコンソールの健全性バッジも、この合計値を
 * 使う（別の計算式を並存させない）。
 */

export type HealthCategoryKey =
  "revenue" | "tasks" | "employees" | "quality" | "system" | "risk";

export interface HealthCategory {
  key: HealthCategoryKey;
  label: string;
  score: number;
  max: number;
}

export interface CompanyHealth {
  total: number;
  max: number;
  categories: HealthCategory[];
  issues: string[];
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export async function computeCompanyHealth(): Promise<CompanyHealth> {
  const [
    { listKpis },
    { listTasks },
    { listEmployeeLiveStates },
    { listApprovals },
  ] = await Promise.all([
    import("./kpi.server"),
    import("./tasks.server"),
    import("./employees.server"),
    import("./approvals.server"),
  ]);

  const [kpis, tasks, employees, approvals] = await Promise.all([
    listKpis(),
    listTasks(),
    listEmployeeLiveStates(),
    listApprovals(),
  ]);

  const errorEmployees = employees.filter((e) => e.status === "ERROR");
  const errorCount = errorEmployees.length;
  const employeeCount = employees.length || 6;

  // 売上・利益（30点）：BUSINESSカテゴリKPIの目標達成率平均
  const businessKpis = kpis.filter(
    (k) => k.category === "BUSINESS" && k.achievementRate !== undefined,
  );
  const revenueRate = businessKpis.length
    ? businessKpis.reduce((s, k) => s + clamp(k.achievementRate!, 0, 1.2), 0) /
      businessKpis.length
    : 1;
  const revenueScore = Math.round(clamp(revenueRate, 0, 1) * 30);

  // タスク進捗（20点）：BLOCKEDでないタスクの割合
  const blockedCount = tasks.filter((t) => t.status === "BLOCKED").length;
  const taskRate = tasks.length ? 1 - blockedCount / tasks.length : 1;
  const taskScore = Math.round(clamp(taskRate, 0, 1) * 20);

  // AI社員稼働（15点）：ERRORでない社員の割合
  const employeeRate = 1 - errorCount / employeeCount;
  const employeeScore = Math.round(clamp(employeeRate, 0, 1) * 15);

  // 品質（15点）：QA Pass Rate / Workflow Success Rateの目標達成率平均。
  // 無ければerror_countの少なさで代替
  const qualityKpis = kpis.filter(
    (k) =>
      (k.name === "QA Pass Rate" || k.name === "Workflow Success Rate") &&
      k.achievementRate !== undefined,
  );
  const qualityScore = qualityKpis.length
    ? Math.round(
        clamp(
          qualityKpis.reduce(
            (s, k) => s + clamp(k.achievementRate!, 0, 1.2),
            0,
          ) / qualityKpis.length,
          0,
          1,
        ) * 15,
      )
    : Math.round(clamp(employeeRate, 0, 1) * 15);

  // システム（10点）：控えめな判定。ERROR状態のAI社員がいなければ満点
  const systemScore = clamp(10 - errorCount * 3, 0, 10);

  // リスク（10点）：pending承認（レベルが高いほど重く）＋ERROR社員数
  const pendingApprovals = approvals.filter((a) => a.status === "pending");
  const l3Count = pendingApprovals.filter(
    (a) => a.approvalLevel === "L3",
  ).length;
  const l2Count = pendingApprovals.filter(
    (a) => a.approvalLevel === "L2",
  ).length;
  const otherPendingCount = pendingApprovals.length - l3Count - l2Count;
  const riskDeduction =
    l3Count * 3 + l2Count * 1.5 + otherPendingCount * 0.5 + errorCount;
  const riskScore = clamp(Math.round(10 - riskDeduction), 0, 10);

  const categories: HealthCategory[] = [
    { key: "revenue", label: "売上・利益", score: revenueScore, max: 30 },
    { key: "tasks", label: "タスク進捗", score: taskScore, max: 20 },
    { key: "employees", label: "AI社員稼働", score: employeeScore, max: 15 },
    { key: "quality", label: "品質", score: qualityScore, max: 15 },
    { key: "system", label: "システム", score: systemScore, max: 10 },
    { key: "risk", label: "リスク", score: riskScore, max: 10 },
  ];
  const total = categories.reduce((s, c) => s + c.score, 0);

  // 改善ポイント（固定ルール）
  const issues: string[] = [];
  for (const k of kpis) {
    if (k.change <= -10) {
      issues.push(`${k.name}が前期比${k.change}%（要確認）`);
    }
  }
  for (const c of categories) {
    if (c.score / c.max < 0.7) {
      issues.push(
        `${c.label}が${Math.round((c.score / c.max) * 100)}%まで低下しています`,
      );
    }
  }
  if (l3Count > 0) issues.push(`CEO承認待ち（L3）が${l3Count}件あります`);
  if (errorCount > 0) {
    issues.push(`ERROR状態のAI社員が${errorCount}名います`);
  }

  return { total, max: 100, categories, issues };
}

/**
 * JARVIS推奨（オンデマンド生成、キャッシュ・保存はしない）。健全性の内訳・
 * 改善ポイントを渡し、既存のJARVISプロンプト基盤（callJarvis）をそのまま
 * 再利用する。
 */
export async function getHealthRecommendation(
  health: CompanyHealth,
): Promise<string> {
  const { callJarvis } = await import("./jarvis.server");

  const breakdown = health.categories
    .map((c) => `${c.label}: ${c.score}/${c.max}`)
    .join(" / ");
  const issuesText = health.issues.length
    ? health.issues.join(" / ")
    : "特になし";

  const prompt = `現在の会社健全性は${health.total}/${health.max}点です。内訳: ${breakdown}。改善ポイント: ${issuesText}。

この状況を踏まえて、CEOが今すぐ実行すべき最も重要なアクションを1つだけ、担当するAI社員（A〜F）を明示した上で、40字程度の短い一文で提案してください。JARVISとしての意見を一言で述べてください。見出しや箇条書きは不要です。`;

  const { text } = await callJarvis(
    [{ role: "user", content: prompt }],
    "consultation",
  );
  return text;
}
