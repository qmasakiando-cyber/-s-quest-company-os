import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getCompanyHealthFn,
  getHealthRecommendationFn,
} from "./company-health.functions";
import type { CompanyHealth } from "./company-health.server";

/**
 * 会社健全性スコア（6項目・合計100点）を読み込む。JARVIS推奨は詳細画面を
 * 開いた時に1回だけオンデマンドで生成する（毎回のポーリングでは呼ばない、
 * キャッシュ・保存もしない）。
 */
export function useCompanyHealth() {
  const [health, setHealth] = useState<CompanyHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(
    null,
  );

  const getHealthFn = useServerFn(getCompanyHealthFn);
  const getRecommendationFn = useServerFn(getHealthRecommendationFn);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getHealthFn();
      setHealth(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "会社健全性の取得に失敗しました。",
      );
    } finally {
      setLoading(false);
    }
  }, [getHealthFn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const fetchRecommendation = useCallback(async () => {
    setRecommendationLoading(true);
    setRecommendationError(null);
    try {
      const text = await getRecommendationFn();
      setRecommendation(text);
    } catch (err) {
      setRecommendationError(
        err instanceof Error ? err.message : "JARVIS推奨の取得に失敗しました。",
      );
    } finally {
      setRecommendationLoading(false);
    }
  }, [getRecommendationFn]);

  return {
    health,
    loading,
    error,
    recommendation,
    recommendationLoading,
    recommendationError,
    fetchRecommendation,
    refresh,
  };
}
