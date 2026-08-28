import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getCurrentCeoFn, signInFn, signOutFn } from "./auth.functions";

/**
 * CEOのログイン状態を読み込み、サインイン/サインアウト操作を提供する。
 * REQUIRE_CEO_LOGIN=false の間はセッションが無くても email は null のまま
 * （UI側では「ログインしていない＝ゲストのまま使える」として扱われる）。
 */
export function useAuth() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const currentFn = useServerFn(getCurrentCeoFn);
  const signInServerFn = useServerFn(signInFn);
  const signOutServerFn = useServerFn(signOutFn);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const user = await currentFn();
      setEmail(user?.email ?? null);
    } catch {
      setEmail(null);
    } finally {
      setLoading(false);
    }
  }, [currentFn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      await signInServerFn({ data: { email, password } });
      await refresh();
    },
    [signInServerFn, refresh],
  );

  const signOut = useCallback(async () => {
    await signOutServerFn();
    setEmail(null);
  }, [signOutServerFn]);

  return { email, loading, signIn, signOut, refresh };
}
