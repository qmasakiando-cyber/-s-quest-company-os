-- ============================================================================
-- Migration 005 — ai_employees: waiting_for / blocked_reason / error_count /
-- retry_count (per Obsidian "A〜F 状態管理 SYSTEM v1.0" §5 field list).
--
-- This phase only wires up write logic for waiting_for and error_count.
-- blocked_reason and retry_count are added now (columns only, unwritten)
-- so the future BLOCKED/REVIEW multi-stage transition work doesn't need
-- another DDL round-trip.
--
-- No RLS change needed (table-level policy from rls_phase1.sql already
-- covers all operations on ai_employees).
--
-- Safe to re-run.
-- ============================================================================

alter table ai_employees
  add column if not exists waiting_for text
    check (waiting_for is null or waiting_for in ('A', 'B', 'C', 'D', 'E', 'F', 'JARVIS', 'CEO'));

alter table ai_employees
  add column if not exists blocked_reason text;

alter table ai_employees
  add column if not exists error_count integer not null default 0
    check (error_count >= 0);

alter table ai_employees
  add column if not exists retry_count integer not null default 0
    check (retry_count >= 0);
