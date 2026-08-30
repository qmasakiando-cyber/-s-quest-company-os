-- ============================================================================
-- S-QUEST COMPANY OS — Phase 8 Schema
--
-- 通知ベルの実データ化。AppShell の NotificationPanel がこれまで
-- company-data.ts の NOTIFICATIONS（固定配列）を表示していたのを、実際に
-- 起きたイベントを記録する notifications テーブルに置き換える。
--
-- Scope: 以下の、実際にサーバー側で状態が変化する3イベントのみを対象と
-- する（詳細は各アプリ層の該当関数を参照）：
--   - approval_pending  : approvals.server.ts の createApproval()
--   - approval_decided  : approvals.server.ts の decideApproval()
--   - employee_error    : employees.server.ts の onEmployeeChatError()
--
-- 意図的に対象外：
--   - ワークフローの完了/停止：workflows.server.ts は listWorkflows() の
--     みで、ワークフローのstatusを変更する仕組みがコード上どこにも存在
--     しない（"Run workflow" ボタンも onClick 未実装の飾り）ため、今回は
--     対象イベント自体が実在しない。
--   - KPI閾値割れによるWF-06自動起動：kpi.server.ts も読み取り専用で、
--     閾値監視・自動起動ロジックが存在しない（cron trigger も未設定）。
--     これも対象イベントが実在しないため見送り。
--   - タスクの通常進捗・AI社員の日常作業ログ：CEOの判断が要らないため
--     対象外（既存の合意通り）。
--   - DELETE用の関数（既読管理は read_at の UPDATE のみで表現する）。
--
-- related_approval_id / related_employee_code は、approvals.related_task_id
-- と同じ流儀の緩いFK（on delete set null）。
--
-- 既にCEOログイン機能が完了しているため、approvals（phase7）と同様に
-- 最初から authenticated ロールのみで作成する。
--
-- Self-contained: re-declares set_updated_at() is not needed here (この
-- テーブルに updated_at は無い。既読状態は read_at の直接UPDATEで表現する
-- ため、更新トリガーは不要)。
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- notifications — 通知ベル
-- ----------------------------------------------------------------------------
create table if not exists notifications (
  id                     uuid primary key default gen_random_uuid(),
  kind                   text not null
                           check (kind in (
                             'approval_pending', 'approval_decided', 'employee_error'
                           )),
  title                  text not null,
  body                   text not null,
  related_approval_id    uuid references approvals (id) on delete set null,
  related_employee_code  text references ai_employees (code) on delete set null,
  read_at                timestamptz,
  created_at             timestamptz not null default now()
);

create index if not exists idx_notifications_created_at on notifications (created_at desc);
create index if not exists idx_notifications_read_at on notifications (read_at);
