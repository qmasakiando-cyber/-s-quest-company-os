-- ============================================================================
-- S-QUEST COMPANY OS — Phase 5 Schema
--
-- Adds the `ai_outputs` table: AI社員（A〜F）が作成した成果物（レポート、
-- 企画書、施策案など）を一覧・管理するための台帳。Obsidian Vault
-- "S-QUESTCOMPANY/COMPANY詳細/DATABASE SCHEMA v1.0.md" 表#32 "ai_outputs"
-- (07. AI COMPANY) がベース。Obsidian側は ai_tasks 経由の紐付け
-- （ai_task_id FK）を想定しているが、実装済みの tasks テーブルは ai_tasks
-- という中間テーブルを持たない（tasks.assignee で直接担当者を持つ）ため、
-- ai_outputs も tasks(id) へ直接（かつnullableに）紐付ける形に簡略化する。
-- confidence / requires_approval / approved はPhase Aスコープでは不要な
-- 承認ワークフロー用の列のため省略（expenses/kpisなど他テーブルと同じく
-- 「まず最小限、必要になったら足す」方針）。
--
-- Scope: 台帳としての記帳（INSERT/SELECT）のみ。以下は意図的に対象外：
--   - UPDATE/DELETE用のUI・関数（登録ミス訂正は将来検討）
--   - 承認ステータス管理（Approval Centerとの連携）
--   - ファイル添付（Supabase Storage基盤自体が未整備のため）
--   - タスク完了時にAIが自動で成果物を生成・登録する連携
-- output_type は固定enumにせず自由入力のtext列（UI側でプリセット＋自由入力の
-- ハイブリッドを提供する想定、expenses.category と同じ方針）。
-- task_id は calendar_events.related_task_id と同じ流儀で nullable な緩い
-- FK とし、タスクに紐付かない成果物（アドホックな作業など）も許容する。
--
-- Self-contained: re-declares set_updated_at() (already created by
-- schema_phase1.sql) with `create or replace` so this file can also run on
-- its own against a fresh database.
-- ============================================================================

create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- ai_outputs — AI社員の成果物台帳
--    Obsidian table #32 "ai_outputs" (07. AI COMPANY) がベース
-- ----------------------------------------------------------------------------
create table if not exists ai_outputs (
  id             uuid primary key default gen_random_uuid(),
  employee_code  text not null
                   check (employee_code in ('A', 'B', 'C', 'D', 'E', 'F')),
  task_id        text references tasks (id) on delete set null,
  output_type    text not null,                     -- 固定enumにしない（UI側でプリセット＋自由入力）
  title          text not null,
  content        text,                               -- 本文（external_urlのみの場合はnull可）
  external_url   text,                               -- 外部成果物へのリンク（任意）
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_ai_outputs_employee_code on ai_outputs (employee_code);
create index if not exists idx_ai_outputs_task_id on ai_outputs (task_id);
create index if not exists idx_ai_outputs_created_at on ai_outputs (created_at);

create trigger trg_ai_outputs_updated_at
  before update on ai_outputs
  for each row execute function set_updated_at();
