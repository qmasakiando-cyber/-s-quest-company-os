import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * DELETE禁止ルール：このクライアント経由で .delete() を呼び出すコードを追加しないこと。
 * データ削除は COMPANY OS / RULES の Approval Gate 対象（CEO承認必須）であり、
 * アプリ層からの自動削除は一切行わない。行を無効化・アーカイブしたい場合は
 * status/archived フラグの UPDATE で表現し、物理削除は行わない。
 */
/** Server-only Supabase client. Never import this from client-side code. */
export function getSupabaseServerClient(): SupabaseClient {
  if (client) return client;

  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_ANON_KEY が .env に設定されていません。");
  }

  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}
