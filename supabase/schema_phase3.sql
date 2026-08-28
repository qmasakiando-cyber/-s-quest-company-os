-- ============================================================================
-- S-QUEST COMPANY OS — Phase 3 Schema
--
-- Adds the `workflows` table, migrating the WF-01〜06 mock array currently
-- hardcoded in src/lib/company-data.ts (the `Workflow` interface / WORKFLOWS
-- const) into Supabase. Columns map 1:1 onto that interface's fields.
--
-- Scope: only `workflows` itself. `tasks.workflow_id` (a proper FK from
-- tasks to this table) is intentionally NOT added yet — tasks.workflow
-- stays a free-text label for now, per the phased plan.
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
-- workflows — WF-01〜06 の Workflow 定義
--    company-data.ts の Workflow 型に対応
-- ----------------------------------------------------------------------------
create table if not exists workflows (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,               -- 例: "WF-01"
  name            text not null,                       -- 例: "Research → Strategy"
  description     text,
  trigger         text,                                 -- 例: "CEO 指示 / 週次スケジュール"
  status          text not null default 'IDLE'
                    check (status in ('ACTIVE', 'IDLE', 'FAILED')),
  version         text,                                 -- 例: "v1.3"
  runs            integer not null default 0,
  success_rate    numeric(5, 2) not null default 0,
  diagram         jsonb not null default '[]'::jsonb,   -- ["トリガー","A 調査",...]
  input           text,
  processing      jsonb not null default '[]'::jsonb,   -- ["A が情報収集...", ...]
  output          text,
  approval_gate   text,
  failure_branch  text,
  os_update       text,
  retry           text,
  timeout         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger trg_workflows_updated_at
  before update on workflows
  for each row execute function set_updated_at();
