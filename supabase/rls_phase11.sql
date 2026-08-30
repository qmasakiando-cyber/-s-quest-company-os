-- ============================================================================
-- S-QUEST COMPANY OS — Phase 11 RLS policy for company_os_entries
--
-- approvals/notifications/audit_logs/revenue_entries（rls_phase7〜10.sql）
-- と同じ方針：CEOログイン機能が既に完了しているため、まずanon全許可という
-- 段階を踏まず、最初から authenticated ロールのみを許可する。
-- ============================================================================

alter table company_os_entries enable row level security;

drop policy if exists "authenticated full access" on company_os_entries;

create policy "authenticated full access" on company_os_entries
  for all
  to authenticated
  using (true)
  with check (true);
