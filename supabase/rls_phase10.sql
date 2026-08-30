-- ============================================================================
-- S-QUEST COMPANY OS — Phase 10 RLS policy for audit_logs
--
-- approvals/notifications（rls_phase7.sql / rls_phase8.sql）と同じ方針：
-- CEOログイン機能が既に完了しているため、まずanon全許可という段階を踏まず、
-- 最初から authenticated ロールのみを許可する。
-- ============================================================================

alter table audit_logs enable row level security;

drop policy if exists "authenticated full access" on audit_logs;

create policy "authenticated full access" on audit_logs
  for all
  to authenticated
  using (true)
  with check (true);
