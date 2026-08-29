-- ============================================================================
-- S-QUEST COMPANY OS — Phase 7 RLS policy for approvals
--
-- CEOログイン機能（ロードマップ4番目）が既に完了しているため、rls_phase1〜5
-- のように「まずanon全許可→後でauthenticatedへ切替」という段階を踏まず、
-- 最初から authenticated ロールのみを許可する。
-- ============================================================================

alter table approvals enable row level security;

drop policy if exists "authenticated full access" on approvals;

create policy "authenticated full access" on approvals
  for all
  to authenticated
  using (true)
  with check (true);
