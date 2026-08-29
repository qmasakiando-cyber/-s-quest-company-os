import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/os/AppShell";
import { JarvisCore } from "@/components/os/JarvisCore";
import {
  EmptyState,
  Meter,
  PageHeader,
  Panel,
  SectionTitle,
  Tag,
} from "@/components/os/primitives";
import { useCompanyHealth } from "@/lib/use-company-health";

export const Route = createFileRoute("/company-health")({
  head: () => ({
    meta: [
      { title: "会社健全性 — S-QUEST COMPANY" },
      {
        name: "description",
        content:
          "会社健全性スコアの内訳（売上・利益／タスク進捗／AI社員稼働／品質／システム／リスク）と、JARVISによる改善推奨。",
      },
      { property: "og:title", content: "会社健全性 — S-QUEST COMPANY" },
      {
        property: "og:description",
        content: "ダッシュボードの健全性バッジの内訳を6項目で確認する。",
      },
    ],
  }),
  component: CompanyHealthPage,
});

const scoreTone = (rate: number) =>
  rate >= 0.85
    ? "var(--success)"
    : rate >= 0.7
      ? "var(--warning)"
      : "var(--destructive)";

function CompanyHealthPage() {
  const {
    health,
    loading,
    error,
    recommendation,
    recommendationLoading,
    recommendationError,
    fetchRecommendation,
  } = useCompanyHealth();

  useEffect(() => {
    void fetchRecommendation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalRate = health ? health.total / health.max : 0;

  return (
    <AppShell>
      <PageHeader
        eyebrow="経営指標"
        title="会社健全性"
        description="売上・利益／タスク進捗／AI社員稼働／品質／システム／リスクの6項目から算出する、会社全体の健全性スコア。"
      />

      {error ? (
        <p className="mb-4 text-xs text-destructive">⚠️ {error}</p>
      ) : null}

      {loading && !health ? (
        <p className="text-sm text-muted-foreground">読み込んでいます…</p>
      ) : health ? (
        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <Panel className="flex flex-col items-center gap-3 p-6 text-center">
            <JarvisCore
              state="WORKING"
              size={140}
              label="JARVIS"
              health={health.total}
            />
            <p
              className="num-display text-4xl"
              style={{ color: scoreTone(totalRate) }}
            >
              {health.total}{" "}
              <span className="text-lg text-muted-foreground">
                / {health.max}
              </span>
            </p>
            <p className="label-caps">会社健全性スコア</p>
          </Panel>

          <div className="space-y-4">
            <Panel>
              <SectionTitle title="内訳" />
              <ul className="space-y-3">
                {health.categories.map((c) => (
                  <li key={c.key}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground/90">{c.label}</span>
                      <span
                        className="num-display"
                        style={{ color: scoreTone(c.score / c.max) }}
                      >
                        {c.score} / {c.max}
                      </span>
                    </div>
                    <Meter
                      className="mt-1.5"
                      value={(c.score / c.max) * 100}
                      tone={scoreTone(c.score / c.max)}
                    />
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel>
              <SectionTitle title="改善ポイント" />
              {health.issues.length ? (
                <ul className="space-y-2">
                  {health.issues.map((issue) => (
                    <li
                      key={issue}
                      className="flex items-start gap-2 text-sm text-foreground/90"
                    >
                      <span style={{ color: "var(--warning)" }}>⚠</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  現在、特に懸念点はありません。
                </p>
              )}
            </Panel>

            <Panel>
              <div className="mb-3 flex items-center justify-between">
                <SectionTitle title="JARVIS推奨" />
                <Tag tone="var(--primary)">AI生成</Tag>
              </div>
              {recommendationLoading ? (
                <p className="text-sm text-muted-foreground">
                  JARVISが検討しています…
                </p>
              ) : recommendationError ? (
                <p className="text-xs text-destructive">
                  ⚠️ {recommendationError}
                </p>
              ) : recommendation ? (
                <p className="text-sm text-foreground/90">→ {recommendation}</p>
              ) : (
                <EmptyState
                  title="まだ生成されていません"
                  body="ページを開くと自動的に生成されます。"
                />
              )}
            </Panel>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
