-- ============================================================================
-- S-QUEST COMPANY OS — Phase 6 ロールバック：authenticated → anon に戻す
--
-- rls_phase6_require_auth.sql を実行した後に何か問題が起きた場合、これを
-- Supabase SQL Editorで実行すれば rls_phase1〜5.sql と同じ「anon全許可」の
-- 状態に即座に戻せる。ロックアウトした場合の緊急復旧用。
--
-- これを実行した後は、念のため .env の REQUIRE_CEO_LOGIN も false に戻す
-- こと（アプリ側のログイン強制も同時に解除する）。
-- ============================================================================

-- ai_employees
drop policy if exists "authenticated full access" on ai_employees;
create policy "anon full access" on ai_employees
  for all
  to anon
  using (true)
  with check (true);

-- tasks
drop policy if exists "authenticated full access" on tasks;
create policy "anon full access" on tasks
  for all
  to anon
  using (true)
  with check (true);

-- calendar_events
drop policy if exists "authenticated full access" on calendar_events;
create policy "anon full access" on calendar_events
  for all
  to anon
  using (true)
  with check (true);

-- kpis
drop policy if exists "authenticated full access" on kpis;
create policy "anon full access" on kpis
  for all
  to anon
  using (true)
  with check (true);

-- kpi_values
drop policy if exists "authenticated full access" on kpi_values;
create policy "anon full access" on kpi_values
  for all
  to anon
  using (true)
  with check (true);

-- workflows
drop policy if exists "authenticated full access" on workflows;
create policy "anon full access" on workflows
  for all
  to anon
  using (true)
  with check (true);

-- expenses
drop policy if exists "authenticated full access" on expenses;
create policy "anon full access" on expenses
  for all
  to anon
  using (true)
  with check (true);

-- ai_outputs
drop policy if exists "authenticated full access" on ai_outputs;
create policy "anon full access" on ai_outputs
  for all
  to anon
  using (true)
  with check (true);
