-- ============================================================================
-- S-QUEST COMPANY OS — Phase 4 Schema
--
-- Adds the `expenses` table: JARVIS（AI COO）直轄の経費台帳。個々の支出を
-- 金額・カテゴリ・日付・メモで記帳する。Obsidian Vault
-- "S-QUESTCOMPANY/COMPANY詳細/DATABASE SCHEMA v1.0.md" 表#33 "expenses"
-- (27. FINANCE) がベース。company_id / vendor / status / metadata は、
-- 単一テナント・記帳のみのPhase Aスコープでは不要なため省略（kpis/tasks
-- などPhase1の他テーブルと同じく「まず最小限、必要になったら足す」方針）。
--
-- Scope: 台帳としての記帳（INSERT/SELECT）のみ。以下は意図的に対象外：
--   - UPDATE/DELETE用のUI・関数（記帳ミス訂正は将来検討）
--   - 支出の事前承認ワークフロー（Approval Centerとの連携）
--   - kpis/kpi_values への正式統合（Phase Bとして切り出し）
-- category は固定enumにせず自由入力のtext列（UI側でプリセット＋自由入力の
-- ハイブリッドを提供する想定）。
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
-- expenses — 経費台帳（JARVIS直轄）
--    Obsidian table #33 "expenses" (27. FINANCE) がベース
-- ----------------------------------------------------------------------------
create table if not exists expenses (
  id                uuid primary key default gen_random_uuid(),
  category          text not null,                    -- 固定enumにしない（UI側でプリセット＋自由入力）
  amount            numeric(12, 2) not null check (amount > 0),
  transaction_date  date not null,
  memo              text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_expenses_transaction_date on expenses (transaction_date);

create trigger trg_expenses_updated_at
  before update on expenses
  for each row execute function set_updated_at();
