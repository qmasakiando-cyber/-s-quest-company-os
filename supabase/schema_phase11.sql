-- ============================================================================
-- S-QUEST COMPANY OS — Phase 11 Schema
--
-- Adds the `company_os_entries` table: /company-os の実データ化（Phase 1
-- ―― CEOによる直接インライン編集のみ。JARVIS会話編集（propose_update_os等）
-- と、AI社員発の更新を承認センター経由で反映する経路は、今回は意図的に
-- 対象外とする。将来追加する場合は別途設計する）。
--
-- 既存の company-data.ts の COMPANY_OS（固定38件のOsEntry）を、記帳や
-- 監査ログと同じ「上書きせず追記する」台帳方式に置き換える。1回の編集＝
-- 1行のINSERT。「現在の値」は (category, key) ごとの最新行、「バージョン
-- 履歴」はテーブル全体をcreated_at降順で並べたもの — kpi_valuesが目標
-- 変更履歴を自然に持つのと同じ構造で、OS_VERSIONSのような別テーブルは
-- 不要（company-os.server.ts側で集約する）。
--
-- Scope: エントリの記帳（INSERT/SELECT）のみ。以下は意図的に対象外：
--   - UPDATE/DELETE用の関数（他の台帳系テーブルと同じ判断。誤記帳の
--     訂正が必要になった時点で別途検討する）
--   - PLANTS/WEAPONS（16タイプ診断のマスターデータ）：Mission/Rules等の
--     「CEOが今正しいと考えている方針」とは性質が違う（製品の分類体系
--     そのものであり、正式名称は変更しない前提）。company-data.tsの
--     静的定数のまま据え置き、このテーブルの対象外とする。
--   - JARVIS発・AI社員発の更新経路（Phase 2/3として別途検討）
--
-- category は既存のOS_CATEGORIES（company-data.ts）と一致させるためCHECK
-- 制約で固定する。key/value/updated_by/source は自由入力のtext列
-- （updated_byは移行元データに"CEO"/"JARVIS"だけでなく"B｜Strategy"等の
-- 表記も含まれるため、audit_logs.actorのような2区分固定にはしない）。
--
-- 既にCEOログイン機能が完了しているため、他のphase7以降のテーブルと
-- 同様に最初から authenticated ロールのみで作成する。
--
-- Self-contained: set_updated_at()への依存なし（このテーブルにupdated_at
-- は無い。書いたら不変なので更新トリガー自体が不要）。
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- company_os_entries — COMPANY OS（会社の記憶、追記式）
-- ----------------------------------------------------------------------------
create table if not exists company_os_entries (
  id            uuid primary key default gen_random_uuid(),
  category      text not null
                  check (category in (
                    'COMPANY', 'BRAND', 'SERVICE', 'DIAGNOSIS', 'PRODUCT',
                    'MARKETING', 'SALES', 'KPI', 'REVENUE', 'AI', 'WORKFLOW',
                    'RULES', 'KNOWLEDGE'
                  )),
  key           text not null,
  value         text not null,
  status        text not null default 'ACTIVE'
                  check (status in ('ACTIVE', 'DRAFT', 'REVIEW')),
  updated_by    text not null,
  source        text not null,
  confidence    smallint not null default 100
                  check (confidence between 0 and 100),
  created_at    timestamptz not null default now()
);

-- (category, key) ごとの最新行を素早く引くための索引（listCompanyOsEntries()）。
create index if not exists idx_company_os_entries_category_key_created_at
  on company_os_entries (category, key, created_at desc);

-- バージョン履歴（全体を新しい順に並べる）用。
create index if not exists idx_company_os_entries_created_at
  on company_os_entries (created_at desc);
