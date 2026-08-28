import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/os/AppShell";
import { JarvisCore } from "@/components/os/JarvisCore";
import {
  EmptyState,
  Meter,
  PageHeader,
  Panel,
  SectionTitle,
  SimulationBadge,
  Tag,
} from "@/components/os/primitives";
import { useExpenses } from "@/lib/use-expenses";
import {
  EXPENSE_CATEGORIES,
  formatMonthLabel,
  expenseMonthKey,
  jpy,
  summarizeExpensesByCategory,
  summarizeExpensesByMonth,
} from "@/lib/company-data";

export const Route = createFileRoute("/expenses")({
  head: () => ({
    meta: [
      { title: "経費管理 — S-QUEST COMPANY" },
      {
        name: "description",
        content: "JARVIS（AI COO）直轄の経費台帳。金額・カテゴリ・日付を記帳し、月次の支出サマリー・推移を確認する。",
      },
      { property: "og:title", content: "経費管理 — S-QUEST COMPANY" },
      {
        property: "og:description",
        content: "A〜Fの担当領域ではなく、会社全体の支出を横断的に把握するJARVIS直轄の台帳。",
      },
    ],
  }),
  component: ExpensesPage,
});

const todayIso = () => new Date().toISOString().slice(0, 10);
const CUSTOM_CATEGORY = "その他";

function ExpensesPage() {
  const { expenses, loading, error, addExpense } = useExpenses();

  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionDate, setTransactionDate] = useState(todayIso());
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const currentMonthKey = todayIso().slice(0, 7);
  const thisMonthExpenses = useMemo(
    () => expenses.filter((e) => expenseMonthKey(e.transactionDate) === currentMonthKey),
    [expenses, currentMonthKey],
  );
  const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const categoryBreakdown = useMemo(
    () => summarizeExpensesByCategory(thisMonthExpenses),
    [thisMonthExpenses],
  );
  const monthlyTrend = useMemo(() => {
    const rows = summarizeExpensesByMonth(expenses).slice(-6);
    return rows.map((r) => ({ label: formatMonthLabel(r.month), total: r.total }));
  }, [expenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const effectiveCategory = category === CUSTOM_CATEGORY ? customCategory.trim() : category;
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
      await addExpense({
        category: effectiveCategory,
        amount: amountValue,
        transactionDate,
        memo: memo.trim() || null,
      });
      toast.success("経費を記帳しました", {
        description: `${effectiveCategory} ・ ${jpy(amountValue)}`,
      });
      setAmount("");
      setMemo("");
      if (category === CUSTOM_CATEGORY) setCustomCategory("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "経費の登録に失敗しました。";
      setFormError(message);
      toast.error("経費の登録に失敗しました", { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="ファイナンス"
        title="経費管理"
        description="A〜Fの担当領域ではなく、会社全体の支出を横断的に把握するJARVIS（AI COO）直轄の台帳。ここは記帳のみを扱い、新規支出の事前承認は承認センターで扱う。"
        actions={<SimulationBadge />}
      />

      <Panel className="mb-6 flex items-center gap-6 p-5">
        <div className="shrink-0">
          <JarvisCore state="WORKING" size={100} label="JARVIS" health={90} />
        </div>
        <div className="min-w-0">
          <p className="label-caps">JARVIS COO 直轄</p>
          <p className="mt-1 text-sm text-foreground/90">
            経費の記帳・月次集計はJARVISが直轄管理します。CEOが入力した記録をもとに、支出サマリーを継続的に把握します。
          </p>
        </div>
      </Panel>

      {error ? <p className="mb-4 text-xs text-destructive">⚠️ {error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Panel>
            <SectionTitle title="今月の支出" hint={`${Number(currentMonthKey.slice(5, 7))}月`} />
            <p className="num-display text-3xl">{jpy(thisMonthTotal)}</p>
            {categoryBreakdown.length ? (
              <ul className="mt-4 space-y-3">
                {categoryBreakdown.map((c) => (
                  <li key={c.category}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{c.category}</span>
                      <span className="num-display">{jpy(c.total)}</span>
                    </div>
                    <Meter
                      className="mt-1.5"
                      tone="var(--destructive)"
                      value={thisMonthTotal > 0 ? Math.round((c.total / thisMonthTotal) * 100) : 0}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">今月の記帳はまだありません。</p>
            )}
          </Panel>

          <Panel>
            <SectionTitle title="月次推移" />
            {monthlyTrend.length ? (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="exp-trend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--destructive)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--destructive)" stopOpacity={0} />
                      </linearGradient>
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
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="var(--destructive)"
                      fill="url(#exp-trend)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title="推移データがありません" body="経費を記帳すると、月ごとの推移がここに表示されます。" />
            )}
          </Panel>

          <Panel className="p-0">
            <div className="p-5 pb-0">
              <SectionTitle title="記帳一覧" hint={`${expenses.length}件`} />
            </div>
            {loading && !expenses.length ? (
              <p className="px-5 pb-5 text-sm text-muted-foreground">読み込んでいます…</p>
            ) : expenses.length ? (
              <ul className="divide-y divide-border">
                {expenses.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <span className="w-24 shrink-0 text-xs text-muted-foreground">
                      {e.transactionDate}
                    </span>
                    <Tag tone="var(--destructive)">{e.category}</Tag>
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground/80">
                      {e.memo || "—"}
                    </span>
                    <span className="num-display text-sm">{jpy(e.amount)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-5">
                <EmptyState title="記帳がありません" body="右のフォームから最初の経費を記帳してください。" />
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel>
            <SectionTitle title="経費を記帳" />
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
              <div>
                <label className="label-caps mb-1.5 block">金額</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="例：12000"
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
                  {EXPENSE_CATEGORIES.map((c) => (
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
                  placeholder="例：Vercel Pro プラン"
                  className="h-9 w-full rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60"
                />
              </div>

              {formError ? <p className="text-xs text-destructive">⚠️ {formError}</p> : null}

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
      </div>
    </AppShell>
  );
}
