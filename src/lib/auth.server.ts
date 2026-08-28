import { getSupabaseServerClient } from "./supabase.server";

/**
 * 段階導入フラグ（本番運用ロードマップ4番目）。false の間はログイン機能は
 * 存在するが強制しない。true に切り替えるまでは今まで通り未ログインでも
 * 全ページ・全サーバー関数にアクセスできる。
 */
export function isCeoLoginRequired(): boolean {
  return process.env["REQUIRE_CEO_LOGIN"] === "true";
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error)
    throw new Error("メールアドレスまたはパスワードが正しくありません。");
}

export async function signOut(): Promise<void> {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
}

/**
 * 現在のCEOセッションを返す（未ログインならnull）。getSession()ではなく
 * getUser()を使う：Supabaseに問い合わせて検証するため、Cookieの中身を
 * 信用するだけの getSession() よりも安全（サーバー側で使う場合の公式推奨）。
 */
export async function getCeoUser(): Promise<{
  id: string;
  email: string | null;
} | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}

/**
 * サーバー関数のmiddlewareから呼ぶ実際のゲート。REQUIRE_CEO_LOGIN=true の
 * 間だけチェックする。CEO以外のアカウントは存在しない前提（サインアップは
 * Supabase側で無効化済み）のため、ログイン済みかどうかだけを見る。
 */
export async function requireCeoAuth(): Promise<void> {
  if (!isCeoLoginRequired()) return;
  const user = await getCeoUser();
  if (!user) throw new Error("ログインが必要です。");
}
