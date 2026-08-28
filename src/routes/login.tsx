import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "ログイン — S-QUEST COMPANY" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { email, loading, signIn } = useAuth();
  const navigate = useNavigate();

  const [inputEmail, setInputEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && email) {
      void navigate({ to: "/" });
    }
  }, [loading, email, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(inputEmail.trim(), password);
      await navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "ログインに失敗しました。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold tracking-[0.22em]">S-QUEST</p>
          <p className="label-caps mt-1">会社OS</p>
        </div>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="panel space-y-4 p-6"
        >
          <div>
            <h1 className="text-lg font-semibold">CEOログイン</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              登録済みのメールアドレスとパスワードでログインしてください。
            </p>
          </div>

          <div>
            <label className="label-caps mb-1.5 block">メールアドレス</label>
            <input
              type="email"
              autoComplete="email"
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none focus:border-primary/60"
              required
            />
          </div>

          <div>
            <label className="label-caps mb-1.5 block">パスワード</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none focus:border-primary/60"
              required
            />
          </div>

          {error ? (
            <p className="text-xs text-destructive">⚠️ {error}</p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "ログイン中…" : "ログイン"}
          </button>
        </form>
      </div>
    </div>
  );
}
