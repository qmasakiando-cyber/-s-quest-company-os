-- ============================================================================
-- S-QUEST COMPANY OS — Phase 1 RLS policies for ai_employees / tasks
--
-- Supabase enabled Row Level Security on these tables by default, which
-- blocks all access until policies exist (confirmed by the seed script
-- failing with "new row violates row-level security policy").
--
-- This app has no auth/login system yet — it's a single-CEO internal tool
-- accessed only through server-side code using the anon/publishable key
-- (never exposed to the browser). So for this phase we allow full access
-- to the anon role on just these two tables.
--
-- TODO (future hardening): once CEO login exists, replace these permissive
-- policies with ones scoped to an authenticated CEO user.
-- ============================================================================

alter table ai_employees enable row level security;
alter table tasks        enable row level security;

drop policy if exists "anon full access"     on ai_employees;
drop policy if exists "anon full access"     on tasks;

create policy "anon full access" on ai_employees
  for all
  to anon
  using (true)
  with check (true);

create policy "anon full access" on tasks
  for all
  to anon
  using (true)
  with check (true);
