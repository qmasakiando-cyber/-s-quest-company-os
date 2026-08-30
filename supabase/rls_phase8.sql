-- ============================================================================
-- S-QUEST COMPANY OS — Phase 8 RLS policy for notifications
--
-- approvals（rls_phase7.sql）と同じ方針：CEOログイン機能が既に完了して
-- いるため、まずanon全許可という段階を踏まず、最初から authenticated
-- ロールのみを許可する。
-- ============================================================================

alter table notifications enable row level security;

drop policy if exists "authenticated full access" on notifications;

create policy "authenticated full access" on notifications
  for all
  to authenticated
  using (true)
  with check (true);
