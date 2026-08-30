-- ============================================================================
-- S-QUEST COMPANY OS — Phase 9 Schema
--
-- Adds the `revenue_entries` table: /revenue の実データ化。expenses
-- （schema_phase4.sql）と対になる売上台帳で、構造・スコープ判断もほぼ
-- そのまま踏襲する。
--
-- Scope: 台帳としての記帳（INSERT/SELECT）のみ。以下は意図的に対象外：
--   - UPDATE/DELETE用のUI・関数（expensesと同じ判断。記帳ミス訂正は将来検討）
--   - kpis/kpi_values への書き込み統合（"Monthly Revenue"等のKPIは今回も
--     手動記録のまま。/revenueの月間目標はkpis.target_valueを読むだけで、
--     revenue_entries側から書き戻すことはしない）
--   - 外部連携（マネーフォワード等）は既存方針通り後回し
-- category は固定enumにせず自由入力のtext列（expensesと同じくUI側でプリセット
-- ＋自由入力）。プリセットは Affiliate / Career / B2B / Other（旧/revenueの
-- 売上構成カテゴリを踏襲、company-data.tsのREVENUE_CATEGORIES参照）。
--
-- Self-contained: re-declares set_updated_at() (already created by
-- schema_phase1.sql / schema_phase4.sql) with `create or replace` so this
-- file can also run on its own against a fresh database.
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
-- revenue_entries — 売上台帳
-- ----------------------------------------------------------------------------
create table if not exists revenue_entries (
  id                uuid primary key default gen_random_uuid(),
  category          text not null,                    -- 固定enumにしない（UI側でプリセット＋自由入力）
  amount            numeric(12, 2) not null check (amount > 0),
  transaction_date  date not null,
  memo              text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_revenue_entries_transaction_date on revenue_entries (transaction_date);

create trigger trg_revenue_entries_updated_at
  before update on revenue_entries
  for each row execute function set_updated_at();
