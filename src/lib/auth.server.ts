import { createServerClient } from "@supabase/ssr";
import { getCookies, setCookie } from "@tanstack/react-start/server";

/**
 * 段階導入フラグ（本番運用ロードマップ4番目）。false の間はログイン機能は
 * 存在するが強制しない。true に切り替えるまでは今まで通り未ログインでも
 * 全ページ・全サーバー関数にアクセスできる。
 */
export function isCeoLoginRequired(): boolean {
  return process.env["REQUIRE_CEO_LOGIN"] === "true";
}

/**
 * Cookie経由でセッションを保持するSupabaseクライアント（リクエストごとに生成）。
 * @supabase/ssr がアクセストークンの検証・リフレッシュトークンでの再発行・
 * Cookie書き込みを自動で行う。
 */
function supabaseSessionClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_ANON_KEY が .env に設定されていません。",
    );
  }

  return createServerClient(url, key, {
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
            secure: process.env["NODE_ENV"] === "production",
            path: "/",
          });
        }
      },
    },
  });
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<void> {
  const supabase = supabaseSessionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error)
    throw new Error("メールアドレスまたはパスワードが正しくありません。");
}

export async function signOut(): Promise<void> {
  const supabase = supabaseSessionClient();
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
  const supabase = supabaseSessionClient();
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
