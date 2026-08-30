-- ============================================================================
-- S-QUEST COMPANY OS — Phase 9 RLS policy for revenue_entries
--
-- approvals/notifications（rls_phase7.sql / rls_phase8.sql）と同じ方針：
-- CEOログイン機能が既に完了しているため、まずanon全許可という段階を踏まず、
-- 最初から authenticated ロールのみを許可する（expensesがphase4時点で
-- anonから始めたのは、当時CEOログインがまだ無かったため）。
-- ============================================================================

alter table revenue_entries enable row level security;

drop policy if exists "authenticated full access" on revenue_entries;

create policy "authenticated full access" on revenue_entries
  for all
  to authenticated
  using (true)
  with check (true);
