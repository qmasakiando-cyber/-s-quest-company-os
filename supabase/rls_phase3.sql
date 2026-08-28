-- ============================================================================
-- S-QUEST COMPANY OS — Phase 3 RLS policy for workflows
--
-- Same situation as rls_phase1.sql / rls_phase2.sql: Supabase enables Row
-- Level Security on new tables by default, which blocks all access until
-- policies exist. This app still has no auth/login system — it's a
-- single-CEO internal tool accessed only through server-side code using the
-- anon/publishable key (never exposed to the browser). So for this phase we
-- allow full access to the anon role on this table too.
--
-- TODO (future hardening): once CEO login exists, replace this permissive
-- policy with one scoped to an authenticated CEO user.
-- ============================================================================

alter table workflows enable row level security;

drop policy if exists "anon full access" on workflows;

create policy "anon full access" on workflows
  for all
  to anon
  using (true)
  with check (true);
