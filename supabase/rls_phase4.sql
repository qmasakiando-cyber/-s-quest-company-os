-- ============================================================================
-- S-QUEST COMPANY OS — Phase 4 RLS policy for expenses
--
-- Same situation as rls_phase1.sql / rls_phase2.sql / rls_phase3.sql:
-- Supabase enables Row Level Security on new tables by default, which
-- blocks all access until policies exist. This app still has no auth/login
-- system — it's a single-CEO internal tool accessed only through
-- server-side code using the anon/publishable key (never exposed to the
-- browser). So for this phase we allow full access to the anon role on
-- this table too.
--
-- TODO (future hardening): once CEO login exists, replace this permissive
-- policy with one scoped to an authenticated CEO user.
-- ============================================================================

alter table expenses enable row level security;

drop policy if exists "anon full access" on expenses;

create policy "anon full access" on expenses
  for all
  to anon
  using (true)
  with check (true);
