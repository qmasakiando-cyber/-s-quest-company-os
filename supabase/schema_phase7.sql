-- ============================================================================
-- S-QUEST COMPANY OS — Phase 7 Schema
--
-- 承認ワークフローの実データ化（本番運用ロードマップ「モックデータ監査」
-- P2）。これまで company-data.ts の ALERTS（level = "APPROVAL"のもの）に
-- 固定表示されていた承認依頼を、実際にstatus・決裁日時が残るテーブルに置き
-- 換える。ApprovalModal / approvals.tsx / decisions.tsx が既に
-- {title, body, action, reason, risk, expected, approvalLevel} という
-- 共通の ApprovalRequest 型で統一されているため、ほぼそのままの列構成にした。
--
-- Scope: 承認依頼の登録（CEOが手動で作成）と、承認/却下による status 更新
-- のみ。以下は意図的に対象外：
--   - JARVISが自動で承認依頼を作成する仕組み（今回はCEOが手動登録）
--   - WARNING/CRITICAL相当のアラート（company-data.tsのALERTSに静的なまま
--     残す。異常検知ロジックが別途必要なため）
--   - DELETE用の関数（登録ミスの訂正は将来検討）
--
-- related_task_id は calendar_events.related_task_id と同じ流儀で nullable
-- な緩いFK。承認/却下時、関連タスクがあればそのタスクを DONE / IN PROGRESS
-- へ連動させる（アプリ層 approvals.server.ts 側の責務）。
--
-- 既にCEOログイン機能（ロードマップ4番目）が完了しているため、このテーブル
-- は最初から authenticated ロールのみで作成する（anon経由の期間を作らない）。
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
-- approvals — CEO承認ワークフロー
-- ----------------------------------------------------------------------------
create table if not exists approvals (
  id               uuid primary key default gen_random_uuid(),
  requested_by     text not null
                     check (requested_by in ('A', 'B', 'C', 'D', 'E', 'F', 'JARVIS')),
  approval_level   text not null
                     check (approval_level in ('L0', 'L1', 'L2', 'L3')),
  title            text not null,
  body             text not null,
  action           text not null,
  reason           text not null,
  risk             text not null,
  expected         text not null,
  related_task_id  text references tasks (id) on delete set null,
  status           text not null default 'pending'
                     check (status in ('pending', 'approved', 'rejected')),
  decided_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_approvals_status on approvals (status);
create index if not exists idx_approvals_approval_level on approvals (approval_level);

create trigger trg_approvals_updated_at
  before update on approvals
  for each row execute function set_updated_at();
