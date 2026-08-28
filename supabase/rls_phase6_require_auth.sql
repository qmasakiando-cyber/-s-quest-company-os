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
-- ============================================================================

-- ai_employees
drop policy if exists "anon full access" on ai_employees;
create policy "authenticated full access" on ai_employees
  for all
  to authenticated
  using (true)
  with check (true);

-- tasks
drop policy if exists "anon full access" on tasks;
create policy "authenticated full access" on tasks
  for all
  to authenticated
  using (true)
  with check (true);

-- calendar_events
drop policy if exists "anon full access" on calendar_events;
create policy "authenticated full access" on calendar_events
  for all
  to authenticated
  using (true)
  with check (true);

-- kpis
drop policy if exists "anon full access" on kpis;
create policy "authenticated full access" on kpis
  for all
  to authenticated
  using (true)
  with check (true);

-- kpi_values
drop policy if exists "anon full access" on kpi_values;
create policy "authenticated full access" on kpi_values
  for all
  to authenticated
  using (true)
  with check (true);

-- workflows
drop policy if exists "anon full access" on workflows;
create policy "authenticated full access" on workflows
  for all
  to authenticated
  using (true)
  with check (true);

-- expenses
drop policy if exists "anon full access" on expenses;
create policy "authenticated full access" on expenses
  for all
  to authenticated
  using (true)
  with check (true);

-- ai_outputs
drop policy if exists "anon full access" on ai_outputs;
create policy "authenticated full access" on ai_outputs
  for all
  to authenticated
  using (true)
  with check (true);
