-- ============================================================================
-- Migration 006 — tasks.completed_at
--
-- AI社員実績（/employees の "タスク・Success・QA Pass" 表）の実データ化の
-- 一部。tasks.created_at はあるが「DONEになった瞬間」を表す列がなく、
-- updated_at はDONE以外の更新でも動くため使えない。この列を追加し、
-- src/lib/tasks.server.ts の setTaskStatus() が
--   - status を 'DONE' へ遷移させる時: completed_at = now()
--   - 'DONE' から他ステータスへ戻す時（onTaskResumed と同じ考え方）: completed_at = null
-- を明示的にセットすることで、avg(completed_at - created_at) が正確な
-- 平均完了時間になるようにする。
--
-- No RLS change needed (table-level policy from rls_phase1.sql already
-- covers all operations on tasks).
--
-- Safe to re-run.
-- ============================================================================

alter table tasks
  add column if not exists completed_at timestamptz;

create index if not exists idx_tasks_completed_at on tasks (completed_at);
