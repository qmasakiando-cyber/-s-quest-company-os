-- ============================================================================
-- Migration 002 — ai_employees: align `status` with Obsidian's 8-state model
-- and add `started_at`.
--
-- Obsidian "A〜F 状態管理 SYSTEM v1.0" defines 8 states: IDLE / READY /
-- WORKING / WAITING / REVIEW / BLOCKED / ERROR / DONE, plus a per-employee
-- `started_at` field (when the current task/status began).
--
-- This keeps the existing THINKING / APPROVAL_REQUIRED / COMPLETED values
-- for backward compatibility (per CEO decision) and just adds the 3 missing
-- ones (READY / BLOCKED / DONE) to the CHECK constraint, plus the new
-- `started_at` column. No existing data is touched.
--
-- Safe to re-run.
-- ============================================================================

alter table ai_employees
  drop constraint if exists ai_employees_status_check;

alter table ai_employees
  add constraint ai_employees_status_check
  check (status in (
    'IDLE', 'THINKING', 'WORKING', 'WAITING',
    'REVIEW', 'APPROVAL_REQUIRED', 'COMPLETED', 'ERROR',
    'READY', 'BLOCKED', 'DONE'
  ));

alter table ai_employees
  add column if not exists started_at timestamptz;
