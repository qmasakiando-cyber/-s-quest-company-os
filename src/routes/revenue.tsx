import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/os/AppShell";
import {
  EmptyState,
  Meter,
  PageHeader,
  Panel,
  SectionTitle,
  Tag,
} from "@/components/os/primitives";
import { useRevenue } from "@/lib/use-revenue";
import { useExpenses } from "@/lib/use-expenses";
import {
  REVENUE_CATEGORIES,
  expenseMonthKey,
  formatMonthLabel,
  jpy,
  revenueMonthKey,
  summarizeExpensesByMonth,
  summarizeRevenueByCategory,
  summarizeRevenueByMonth,
} from "@/lib/company-data";

export const Route = createFileRoute("/revenue")({
  head: () => ({
    meta: [
      { title: "Revenue — S-QUEST COMPANY" },
      {
        name: "description",
        content:
          "Total / Monthly Revenue、収益源別内訳、経費と利益を月次で可視化する経営ダッシュボード。",
      },
      { property: "og:title", content: "Revenue — S-QUEST COMPANY" },
      {
        property: "og:description",
        content:
          "Affiliate / Career / B2B / Other の収益構造と利益を一画面で把握。",
      },
    ],
  }),
  component: RevenuePage,
});

const todayIso = () => new Date().toISOString().slice(0, 10);
const CUSTOM_CATEGORY = "その他";

const CATEGORY_TONES: Record<string, string> = {
  Affiliate: "var(--emp-a)",
  Career: "var(--emp-e)",
  B2B: "var(--emp-d)",
  Other: "var(--emp-b)",
};
const categoryTone = (category: string) =>
  CATEGORY_TONES[category] ?? "var(--primary)";

function RevenuePage() {
  const { entries, goal, monthlyTotal, loading, error, addEntry } =
    useRevenue();
  const { expenses } = useExpenses();

  const [category, setCategory] = useState<string>(REVENUE_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionDate, setTransactionDate] = useState(todayIso());
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const currentMonthKey = todayIso().slice(0, 7);
  const thisMonthEntries = useMemo(
    () =>
      entries.filter(
        (e) => revenueMonthKey(e.transactionDate) === currentMonthKey,
      ),
    [entries, currentMonthKey],
  );
  const thisMonthExpensesTotal = useMemo(
    () =>
      expenses
        .filter((e) => expenseMonthKey(e.transactionDate) === currentMonthKey)
        .reduce((sum, e) => sum + e.amount, 0),
    [expenses, currentMonthKey],
  );
  const totalRevenue = entries.reduce((sum, e) => sum + e.amount, 0);
  const monthlyProfit = monthlyTotal - thisMonthExpensesTotal;
  const achievementPct =
    goal && goal > 0 ? Math.round((monthlyTotal / goal) * 100) : null;

  const categoryBreakdown = useMemo(
    () => summarizeRevenueByCategory(thisMonthEntries),
    [thisMonthEntries],
  );

  const monthlyTrend = useMemo(() => {
    const revByMonth = new Map(
      summarizeRevenueByMonth(entries).map((r) => [r.month, r.total]),
    );
    const expByMonth = new Map(
      summarizeExpensesByMonth(expenses).map((r) => [r.month, r.total]),
    );
    const months = [...new Set([...revByMonth.keys(), ...expByMonth.keys()])]
      .sort()
      .slice(-6);
    return months.map((month) => {
      const revenue = revByMonth.get(month) ?? 0;
      const exp = expByMonth.get(month) ?? 0;
      return {
        label: formatMonthLabel(month),
        revenue,
        expenses: exp,
        profit: revenue - exp,
      };
    });
  }, [entries, expenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const effectiveCategory =
      category === CUSTOM_CATEGORY ? customCategory.trim() : category;
    const amountValue = Number(amount);

    if (!effectiveCategory) {
      setFormError("カテゴリを入力してください。");
      return;
    }
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setFormError("金額は0より大きい数値で入力してください。");
      return;
    }
    if (!transactionDate) {
      setFormError("日付を入力してください。");
      return;
    }

    setSubmitting(true);
    try {
      await addEntry({
        category: effectiveCategory,
        amount: amountValue,
        transactionDate,
        memo: memo.trim() || null,
      });
      toast.success("売上を記帳しました", {
        description: `${effectiveCategory} ・ ${jpy(amountValue)}`,
      });
      setAmount("");
      setMemo("");
      if (category === CUSTOM_CATEGORY) setCustomCategory("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "売上の登録に失敗しました。";
      setFormError(message);
      toast.error("売上の登録に失敗しました", { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="ファイナンス"
        title="売上"
        description="D｜Sales が集計し、F｜QA がデータ整合性を確認した実績値を表示します。"
      />

      {error ? (
        <p className="mb-4 text-xs text-destructive">⚠️ {error}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Total Revenue", jpy(totalRevenue)],
          ["Monthly Revenue", jpy(monthlyTotal)],
          ["Monthly Profit", jpy(monthlyProfit)],
        ].map(([k, v]) => (
          <Panel key={k} className="p-4">
            <p className="label-caps">{k}</p>
            <p className="num-display mt-2 text-2xl">{v}</p>
          </Panel>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <SectionTitle title="売上 / 費用 / 利益" hint="直近6か月" />
          <div className="h-72 w-full">
            {monthlyTrend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyTrend}
                  margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                >
                  <defs>
                    {[
                      ["rev", "var(--primary)"],
                      ["exp", "var(--destructive)"],
                      ["pro", "var(--success)"],
                    ].map(([id, tone]) => (
                      <linearGradient
                        key={id}
                        id={id}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor={tone} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={tone} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => jpy(v)}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--primary)"
                    fill="url(#rev)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="var(--destructive)"
                    fill="url(#exp)"
                    strokeWidth={1.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="var(--success)"
                    fill="url(#pro)"
                    strokeWidth={1.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                title="推移データがありません"
                body="売上・経費を記帳すると、月ごとの推移がここに表示されます。"
              />
            )}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <p className="label-caps">月間目標</p>
            <p className="num-display mt-2 text-3xl">{jpy(monthlyTotal)}</p>
            {achievementPct !== null ? (
              <>
                <Meter
                  className="mt-4"
                  value={achievementPct}
                  label="Achievement"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Goal {jpy(goal!)} · Gap {jpy(goal! - monthlyTotal)}
                </p>
              </>
            ) : (
              <p className="mt-4 text-xs text-muted-foreground">
                目標値が未設定です（KPIの「Monthly
                Revenue」に目標値を設定すると表示されます）。
              </p>
            )}
          </Panel>

          <Panel>
            <SectionTitle title="売上構成" hint="今月" />
            {categoryBreakdown.length ? (
              <ul className="space-y-3">
                {categoryBreakdown.map((c) => (
                  <li key={c.category}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {c.category}
                      </span>
                      <span className="num-display">{jpy(c.total)}</span>
                    </div>
                    <Meter
                      className="mt-1.5"
                      tone={categoryTone(c.category)}
                      value={
                        monthlyTotal > 0
                          ? Math.round((c.total / monthlyTotal) * 100)
                          : 0
                      }
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                今月の記帳はまだありません。
              </p>
            )}
          </Panel>

          <Panel>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Expenses</dt>
                <dd className="num-display text-[var(--destructive)]">
                  {jpy(thisMonthExpensesTotal)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Profit</dt>
                <dd className="num-display text-[var(--success)]">
                  {jpy(monthlyProfit)}
                </dd>
              </div>
            </dl>
            <Link
              to="/expenses"
              className="mt-3 block text-center text-xs text-muted-foreground hover:text-foreground"
            >
              経費の内訳を見る（JARVIS直轄）→
            </Link>
          </Panel>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Panel className="p-0">
          <div className="p-5 pb-0">
            <SectionTitle title="記帳一覧" hint={`${entries.length}件`} />
          </div>
          {loading && !entries.length ? (
            <p className="px-5 pb-5 text-sm text-muted-foreground">
              読み込んでいます…
            </p>
          ) : entries.length ? (
            <ul className="divide-y divide-border">
              {entries.map((e) => (
                <li
                  key={e.id}
                  className="flex flex-wrap items-center gap-3 px-5 py-3"
                >
                  <span className="w-24 shrink-0 text-xs text-muted-foreground">
                    {e.transactionDate}
                  </span>
                  <Tag tone={categoryTone(e.category)}>{e.category}</Tag>
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground/80">
                    {e.memo || "—"}
                  </span>
                  <span className="num-display text-sm">{jpy(e.amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-5">
              <EmptyState
                title="記帳がありません"
                body="右のフォームから最初の売上を記帳してください。"
              />
            </div>
          )}
        </Panel>

        <Panel>
          <SectionTitle title="売上を記帳" />
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
            <div>
              <label className="label-caps mb-1.5 block">金額</label>
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="例：50000"
                className="h-9 w-full rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60"
              />
            </div>

            <div>
              <label className="label-caps mb-1.5 block">カテゴリ</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none focus:border-primary/60"
              >
                {[...REVENUE_CATEGORIES, CUSTOM_CATEGORY].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {category === CUSTOM_CATEGORY ? (
                <input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="カテゴリ名を入力"
                  className="mt-2 h-9 w-full rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60"
                />
              ) : null}
            </div>

            <div>
              <label className="label-caps mb-1.5 block">日付</label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none focus:border-primary/60"
              />
            </div>

            <div>
              <label className="label-caps mb-1.5 block">メモ（任意）</label>
              <input
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="例：A社案件 着手金"
                className="h-9 w-full rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60"
              />
            </div>

            {formError ? (
              <p className="text-xs text-destructive">⚠️ {formError}</p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "記帳中…" : "記帳する"}
            </button>
          </form>
        </Panel>
      </div>
    </AppShell>
  );
}
