-- ============================================================================
-- S-QUEST COMPANY OS — Phase 6: RLSを anon → authenticated に切り替える
--
-- 本番運用ロードマップ4番目「CEOログイン機能」のステップ④で実行する。
-- rls_phase1〜5.sql に残されていた
--   "TODO (future hardening): once CEO login exists, replace this
--   permissive policy with one scoped to an authenticated CEO user."
-- を実施するもの。
--
-- CEOアカウントはSupabase Dashboardで手動作成した1つのみで、サインアップは
-- 無効化済み（自己登録不可）のため、"authenticated" ロールであること自体が
-- 実質的に「ログイン済みのCEO本人」であることを意味する。よって
-- auth.uid() で個別UUIDを指定する必要はなく、ロールの切り替えだけで足りる。
--
-- 【重要】このSQLは、②〜③（コード実装・ログイン動作確認）が完了し、
-- CEOが実際に /login からログインできることを確認してから実行すること。
-- 実行前に必ず rls_phase6_rollback_to_anon.sql を手元に用意しておき、
-- 万一の際は即座に打てるようにしておく。
--
-- 【③〜④の間の注意】コード側（supabase.server.ts）はCookie上にCEOセッションが
-- あれば自動的にauthenticatedロールとしてSupabaseへリクエストする。このSQLを
-- 実行するまではRLSはまだ anon のみ許可のため、③のテスト後にログインしたまま
-- （ブラウザにセッションが残ったまま）このSQLの実行を待つと、その間は
-- 全ページが空データに見える（エラーにはならないが、記帳一覧やタスクなどが
-- すべて0件に見える）。実害はなく、ログアウトすれば即座に元通り
-- （anonロールに戻り、今まで通りのデータが見える）だが、紛らわしいので、
-- このSQLを実行する準備ができるまではログアウトした状態で待つこと。
-- このSQLの実行と⑤（REQUIRE_CEO_LOGIN=true への切り替え）は、できるだけ
-- 間を空けずに連続して行うのが望ましい（実行後すぐにログインし直せば、
-- authenticatedロールでRLSを通過するようになる）。
--
-- 【冪等】各テーブルについて、想定されるどちらのポリシー名（"anon full
-- access" / "authenticated full access"）が残っていても対応できるよう、
-- 両方を drop if exists してから作り直す。これは初回実行時に一部テーブル
-- （tasks以外の7テーブル）で create policy がなぜか反映されず anon のまま
-- 残っていた事象が実際に起きたため、そのようなケースでも
-- 「もう一度このファイル全体を再実行するだけで正しい状態に揃う」ようにする
-- ための対応。既に authenticated 済みのテーブルに対して再実行しても無害。
-- ============================================================================

-- ai_employees
drop policy if exists "anon full access" on ai_employees;
drop policy if exists "authenticated full access" on ai_employees;
create policy "authenticated full access" on ai_employees
  for all
  to authenticated
  using (true)
  with check (true);

-- tasks
drop policy if exists "anon full access" on tasks;
drop policy if exists "authenticated full access" on tasks;
create policy "authenticated full access" on tasks
  for all
  to authenticated
  using (true)
  with check (true);

-- calendar_events
drop policy if exists "anon full access" on calendar_events;
drop policy if exists "authenticated full access" on calendar_events;
create policy "authenticated full access" on calendar_events
  for all
  to authenticated
  using (true)
  with check (true);

-- kpis
drop policy if exists "anon full access" on kpis;
drop policy if exists "authenticated full access" on kpis;
create policy "authenticated full access" on kpis
  for all
  to authenticated
  using (true)
  with check (true);

-- kpi_values
drop policy if exists "anon full access" on kpi_values;
drop policy if exists "authenticated full access" on kpi_values;
create policy "authenticated full access" on kpi_values
  for all
  to authenticated
  using (true)
  with check (true);

-- workflows
drop policy if exists "anon full access" on workflows;
drop policy if exists "authenticated full access" on workflows;
create policy "authenticated full access" on workflows
  for all
  to authenticated
  using (true)
  with check (true);

-- expenses
drop policy if exists "anon full access" on expenses;
drop policy if exists "authenticated full access" on expenses;
create policy "authenticated full access" on expenses
  for all
  to authenticated
  using (true)
  with check (true);

-- ai_outputs
drop policy if exists "anon full access" on ai_outputs;
drop policy if exists "authenticated full access" on ai_outputs;
create policy "authenticated full access" on ai_outputs
  for all
  to authenticated
  using (true)
  with check (true);
