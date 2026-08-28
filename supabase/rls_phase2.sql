-- ============================================================================
-- S-QUEST COMPANY OS — Phase 2 RLS policies for calendar_events / kpis / kpi_values
--
-- Same situation as supabase/rls_phase1.sql: Supabase enables Row Level
-- Security on new tables by default, which blocks all access until policies
-- exist. This app still has no auth/login system — it's a single-CEO
-- internal tool accessed only through server-side code using the
-- anon/publishable key (never exposed to the browser). So for this phase we
-- allow full access to the anon role on these three tables too.
--
-- TODO (future hardening): once CEO login exists, replace these permissive
-- policies with ones scoped to an authenticated CEO user.
-- ============================================================================

alter table calendar_events enable row level security;
alter table kpis            enable row level security;
alter table kpi_values      enable row level security;

drop policy if exists "anon full access" on calendar_events;
drop policy if exists "anon full access" on kpis;
drop policy if exists "anon full access" on kpi_values;

create policy "anon full access" on calendar_events
  for all
  to anon
  using (true)
  with check (true);

create policy "anon full access" on kpis
  for all
  to anon
  using (true)
  with check (true);

create policy "anon full access" on kpi_values
  for all
  to anon
  using (true)
  with check (true);
