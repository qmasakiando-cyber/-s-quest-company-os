-- ============================================================================
-- Migration 004 — workflows.approval_level (L0〜L3)
--
-- From Obsidian "AI社員間Workflow 詳細仕様書 V1.0" §「Workflowの承認レベル」:
--   L0: 情報整理・下書き        — AI単独で実行可
--   L1: 通常業務・内部Task      — AI単独で実行可
--   L2: 外部公開・重要施策      — JARVIS(QUEST)確認
--   L3: 会社の重要意思決定      — CEO承認必須
--
-- Nullable: not every future workflow will be classified immediately.
-- tasks does NOT get its own approval_level column — a task inherits its
-- level from tasks.workflow_id -> workflows.approval_level when linked.
--
-- No RLS change needed (same reasoning as migration_003: RLS is
-- table-level, and workflows already has an "anon full access" policy
-- from rls_phase3.sql covering all operations).
--
-- Safe to re-run.
-- ============================================================================

alter table workflows
  add column if not exists approval_level text
    check (approval_level in ('L0', 'L1', 'L2', 'L3'));
