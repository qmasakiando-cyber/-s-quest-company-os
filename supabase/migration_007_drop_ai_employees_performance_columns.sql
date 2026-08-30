-- ============================================================================
-- Migration 007 — drop ai_employees.tasks_completed / success_rate /
-- avg_completion / qa_pass_rate
--
-- These 4 columns only ever held the one-time seed values from
-- scripts/seed-supabase.ts (company-data.ts's static AIEmployee.performance
-- mock). Nothing in the app has ever read them back — src/routes/
-- employees.index.tsx and employees.$code.tsx both render the same static
-- company-data.ts mock directly, not these DB columns. Now that /employees
-- computes tasks_completed / success_rate / avg_completion for real from
-- the tasks table (see employees.server.ts's listEmployeePerformance(),
-- added alongside this migration), and qa_pass_rate has no real signal to
-- back it (dropped from the UI rather than faked — see supabase/
-- migration_006_tasks_completed_at.sql's sibling app-layer change), keeping
-- these columns around would just be unused, driftable legacy state.
--
-- No RLS change needed (dropping columns, not the table).
--
-- Safe to re-run.
-- ============================================================================

alter table ai_employees
  drop column if exists tasks_completed;

alter table ai_employees
  drop column if exists success_rate;

alter table ai_employees
  drop column if exists avg_completion;

alter table ai_employees
  drop column if exists qa_pass_rate;
