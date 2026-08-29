import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCookies, setCookie } from "@tanstack/react-start/server";

/**
 * DELETE禁止ルール：このクライアント経由で .delete() を呼び出すコードを追加しないこと。
 * データ削除は COMPANY OS / RULES の Approval Gate 対象（CEO承認必須）であり、
 * アプリ層からの自動削除は一切行わない。行を無効化・アーカイブしたい場合は
 * status/archived フラグの UPDATE で表現し、物理削除は行わない。
 */
/**
 * Server-only Supabase client. Never import this from client-side code.
 *
 * リクエストのCookieに保存されたCEOセッション（ログイン済みなら）を反映した
 * クライアントをリクエストごとに生成する。RLSがauthenticatedロールに
 * 限定された後は、ログイン済みCEOのアクセストークンがそのままPostgRESTの
 * リクエストに使われ、auth.role() = 'authenticated' として通る。未ログイン
 * ならanonロールのままなので、RLSがanonを許可している間だけ動作する。
 *
 * シングルトンにしない：セッションはCookie（＝リクエスト）ごとに異なるため。
 * 呼び出し側で await する前に .from() 等を呼ぶと、まだセッションがクライアント
 * 内部に反映されていない可能性があるため、必ず await して使うこと
 * （内部で auth.getSession() を一度済ませてから返す）。
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient> {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_ANON_KEY が .env に設定されていません。",
    );
  }

  const client = createServerClient(url, key, {
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({
          name,
          value,
        }));
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          setCookie(name, value, {
            ...(options as Parameters<typeof setCookie>[2]),
            httpOnly: true,
            sameSite: "lax",
            // process.env["NODE_ENV"]はデプロイ先（Cloudflare Workers等）が
            // 必ず設定してくれるとは限らない。import.meta.env.PRODはVite/nitroが
            // ビルド時（vite build＝production mode）に静的に確定させる値なので、
            // 実行時の環境変数設定漏れの影響を受けない
            secure: import.meta.env.PROD,
            path: "/",
          });
        }
      },
    },
  });

  // getSession()を一度済ませておく：これをしないと、直後の .from() 呼び出しに
  // Cookie上のセッションがまだ反映されておらず anon のまま送信されることがある。
  // 認可の判断そのものには使わない（それは auth.server.ts の getUser() の役目）。
  await client.auth.getSession();

  return client;
}
