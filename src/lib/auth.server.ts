import { getSupabaseServerClient } from "./supabase.server";

/**
 * 段階導入フラグ（本番運用ロードマップ4番目）。false の間はログイン機能は
 * 存在するが強制しない。true に切り替えるまでは今まで通り未ログインでも
 * 全ページ・全サーバー関数にアクセスできる。
 *
 * 値は "true" / "false" の厳密一致のみ受け付ける。未設定・空文字・タイプミス
 * （例: "True"）を「ログイン不要」側へ暗黙にfail-openさせないよう、それ以外の
 * 値はモジュール読み込み時点で例外にする（このモジュールを最初にimportする
 * サーバー関数呼び出しで即座に失敗が表面化する）。
 */
const rawRequireCeoLogin = process.env["REQUIRE_CEO_LOGIN"];
if (rawRequireCeoLogin !== "true" && rawRequireCeoLogin !== "false") {
  throw new Error(
    `REQUIRE_CEO_LOGIN の値が不正です（現在の値: ${JSON.stringify(rawRequireCeoLogin)}）。` +
      `.env に "true" または "false" を明示的に設定してください。`,
  );
}
const CEO_LOGIN_REQUIRED = rawRequireCeoLogin === "true";

export function isCeoLoginRequired(): boolean {
  return CEO_LOGIN_REQUIRED;
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
