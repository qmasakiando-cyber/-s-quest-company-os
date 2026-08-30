-- ============================================================================
-- S-QUEST COMPANY OS — Phase 10 Schema
--
-- Adds the `audit_logs` table: /audit の実データ化。company-data.ts の
-- AUDIT_LOGS（固定配列）を表示していたのを、実際に起きた操作を記録する
-- audit_logs テーブルに置き換える。
--
-- notifications（schema_phase8.sql）とは役割が異なる別テーブル：
-- notifications はCEOへの「今気づいてほしいこと」の受信箱（read_atで
-- 既読管理する可変データ）、audit_logs は「何が起きたか」の恒久的な証跡
-- （書いたら不変、既読概念なし）。承認申請/決定はイベントとして両方に
-- 書き込まれる（意図的な重複。GitHubのPRが通知とタイムラインの両方に
-- 残るのと同じ関係）。
--
-- Scope: 以下の、実際にサーバー側でCRUD操作が起きる6箇所のみを対象とする：
--   - Created Task      : tasks.server.ts の createTask()
--   - Updated Task Status: tasks.server.ts の setTaskStatus()
--   - Requested Approval: approvals.server.ts の createApproval()
--   - Approved / Rejected: approvals.server.ts の decideApproval()
--   - Logged Expense    : expenses.server.ts の createExpense()
--   - Logged Revenue    : revenue.server.ts の createRevenueEntry()
--
-- actor は "JARVIS" | "CEO" の2区分で十分という既存合意に基づく（詳細は
-- 各アプリ層の該当関数を参照。tasks.created_by が既に同じ2区分で実装
-- 済みなのを踏襲）。
--
-- 意図的に対象外：
--   - Status / Approval 列（旧UIの固定表示概念。記録は成功した操作の後に
--     しか書かないため「現在のステータス」は audit_logs 自体には無い —
--     必要ならrelated_approval_id経由でapprovalsを参照する）
--   - ログの自動削除・アーカイブ（DELETE禁止ルールと矛盾するため導入しない。
--     一覧取得はlistAuditLogs()側で件数上限をかけるのみ）
--   - UPDATE/DELETE用の関数（一度書いたら不変というこのテーブルの性質上、
--     そもそも用途が無い）
--
-- related_task_id / related_approval_id は、notifications.related_*と同じ
-- 流儀の緩いFK（on delete set null）。
--
-- 既にCEOログイン機能が完了しているため、approvals/notifications
-- （phase7/8）と同様に最初から authenticated ロールのみで作成する。
--
-- Self-contained: set_updated_at()への依存なし（このテーブルにupdated_at
-- は無い。書いたら不変なので更新トリガー自体が不要）。
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- audit_logs — 監査ログ（恒久的な証跡、不変）
-- ----------------------------------------------------------------------------
create table if not exists audit_logs (
  id                    uuid primary key default gen_random_uuid(),
  actor                 text not null
                          check (actor in ('JARVIS', 'CEO')),
  action                text not null,
  target                text not null,
  related_task_id       text references tasks (id) on delete set null,
  related_approval_id   uuid references approvals (id) on delete set null,
  created_at            timestamptz not null default now()
);

create index if not exists idx_audit_logs_created_at on audit_logs (created_at desc);
