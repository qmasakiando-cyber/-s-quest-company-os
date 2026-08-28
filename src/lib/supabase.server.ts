import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

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
