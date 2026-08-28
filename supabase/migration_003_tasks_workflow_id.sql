-- ============================================================================
-- Migration 003 — tasks.workflow_id: FK from tasks to workflows
--
-- Adds a proper foreign key alongside the existing free-text tasks.workflow
-- column (which is left untouched, per the phased migration plan). Nullable
-- and ON DELETE SET NULL, since not every task will map cleanly to a
-- workflows row, and deleting a workflow should not delete or block
-- deleting the tasks that reference it.
--
-- No RLS change needed: tasks already has an "anon full access" policy
-- (rls_phase1.sql) covering ALL operations (select/insert/update/delete),
-- and RLS policies are table-level, not column-level, so adding a column
-- doesn't require a new policy.
--
-- Safe to re-run.
-- ============================================================================

alter table tasks
  add column if not exists workflow_id uuid references workflows (id) on delete set null;

create index if not exists idx_tasks_workflow_id on tasks (workflow_id);
