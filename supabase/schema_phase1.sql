-- ============================================================================
-- S-QUEST COMPANY OS — Phase 1 Schema
--
-- Source: Obsidian Vault "S-QUESTCOMPANY/COMPANY詳細/DATABASE SCHEMA v1.0.md"
--         (53-table master design for the full S-QUEST COMPANY OS)
--
-- Scope: only the 5 tables needed to back what the dashboard already
-- displays today:
--   - AI社員   -> ai_employees
--   - タスク   -> tasks
--   - カレンダーの予定 -> calendar_events
--   - KPI      -> kpis, kpi_values
--
-- The other 49 tables in the master design (companies, diagnosis,
-- users, career, knowledge, marketing, sales, workflows, audit_logs,
-- etc.) are intentionally NOT included in this phase.
--
-- Notes on deviations from the original design doc:
--   - Table/column set is extended beyond the original doc's minimal
--     columns where needed to actually hold what src/lib/company-data.ts
--     currently mocks (progress, currentTask, responsibilities,
--     capabilities, steps, persona, permissions, etc.), since the goal
--     of this schema is to eventually replace that mock data.
--   - No `companies` table is included yet (single-tenant for now), so
--     there is no company_id column/FK on any table here.
--   - `assignee` / `owner` use a CHECK constraint (A-F, JARVIS, CEO)
--     instead of a foreign key, since JARVIS and CEO are not rows in
--     ai_employees.
--   - Row Level Security is NOT configured in this file — add policies
--     separately once auth is wired up.
-- ============================================================================

-- Required for gen_random_uuid()
create extension if not exists pgcrypto;

-- Generic "touch updated_at on every UPDATE" trigger, reused below.
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
-- 1. ai_employees — AI社員（A〜F）のプロフィール・稼働状況
--    Obsidian table #34 "ai_employees" (07. AI COMPANY)、
--    company-data.ts の AIEmployee 型に対応
-- ----------------------------------------------------------------------------
create table if not exists ai_employees (
  id                uuid primary key default gen_random_uuid(),
  code              varchar(1) not null unique
                      check (code in ('A', 'B', 'C', 'D', 'E', 'F')),
  name              text not null,                  -- 部署の短い呼び名（例: "調査"）
  persona_name      text,                           -- キャラクター名（例: "ベガパンク"）
  department        text not null,                  -- 例: "Research / Intelligence"
  role              text not null,
  status            text not null default 'IDLE'
                      check (status in (
                        'IDLE', 'THINKING', 'WORKING', 'WAITING',
                        'REVIEW', 'APPROVAL_REQUIRED', 'COMPLETED', 'ERROR'
                      )),
  current_task      text,
  progress          smallint not null default 0
                      check (progress between 0 and 100),
  workflow          text,                           -- 例: "WF-01 Research → Strategy"
  completed_today   integer not null default 0,
  accent_color      text,                           -- 例: "var(--emp-a)"
  responsibilities  jsonb not null default '[]'::jsonb,
  capabilities      jsonb not null default '[]'::jsonb,
  steps             jsonb not null default '[]'::jsonb,
  persona           text,                           -- キャラクター説明文
  system_prompt     text not null,
  tasks_completed   integer not null default 0,
  success_rate      numeric(5, 2),
  avg_completion    text,                           -- 例: "18m"
  qa_pass_rate      numeric(5, 2),
  permissions_read  jsonb not null default '[]'::jsonb,
  permissions_write jsonb not null default '[]'::jsonb,
  last_activity_at  timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger trg_ai_employees_updated_at
  before update on ai_employees
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- 2. tasks — タスク管理
--    Obsidian table #28 "tasks" (06. COMPANY MANAGEMENT)
-- ----------------------------------------------------------------------------
create table if not exists tasks (
  id            text primary key,                   -- 表示用の人間可読ID（例: "TSK-1041"）
  title         text not null,
  description   text,
  status        text not null default 'BACKLOG'
                  check (status in (
                    'BACKLOG', 'TODO', 'IN PROGRESS', 'REVIEW', 'DONE', 'BLOCKED'
                  )),
  priority      text not null default 'P2'
                  check (priority in ('P0', 'P1', 'P2')),
  assignee      text not null
                  check (assignee in ('A', 'B', 'C', 'D', 'E', 'F', 'JARVIS', 'CEO')),
  created_by    text not null,
  due_at        timestamptz,
  project       text,                                -- 例: "S-QUEST Company"（Phase1ではprojectsテーブル化しない）
  workflow      text,                                -- 例: "WF-06 KPI → Strategy"
  dependencies  text[] not null default '{}',         -- 依存する tasks.id の配列（DB制約としてのFKなし）
  comments      jsonb not null default '[]'::jsonb,   -- [{ by, text, at }]
  log           jsonb not null default '[]'::jsonb,   -- [{ at, text }]
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_tasks_status   on tasks (status);
create index if not exists idx_tasks_assignee on tasks (assignee);

create trigger trg_tasks_updated_at
  before update on tasks
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. calendar_events — カレンダーの予定
--    Obsidian table #29 "calendar_events" (06. COMPANY MANAGEMENT)
-- ----------------------------------------------------------------------------
create table if not exists calendar_events (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  description      text,
  start_at         timestamptz not null,
  end_at           timestamptz,
  kind             text not null
                     check (kind in (
                       'Meeting', 'Review', 'Workflow', 'Report', 'Approval', 'Deadline'
                     )),
  owner            text
                     check (owner in ('A', 'B', 'C', 'D', 'E', 'F', 'JARVIS', 'CEO')),
  related_task_id  text references tasks (id) on delete set null,
  status           text not null default 'scheduled'
                     check (status in ('scheduled', 'completed', 'cancelled')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_calendar_events_start_at on calendar_events (start_at);

create trigger trg_calendar_events_updated_at
  before update on calendar_events
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. kpis — KPI定義
--    Obsidian table #30 "kpis" (06. COMPANY MANAGEMENT)
-- ----------------------------------------------------------------------------
create table if not exists kpis (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,                 -- 例: "monthly_revenue"
  name         text not null,                         -- 例: "Monthly Revenue"
  category     text not null
                 check (category in (
                   'BUSINESS', 'PRODUCT', 'MARKETING', 'SALES', 'DIAGNOSIS', 'AI COMPANY'
                 )),
  unit         text not null default '',              -- 例: "¥", "%", "件"
  target_value numeric,
  owner        text
                 check (owner in ('A', 'B', 'C', 'D', 'E', 'F', 'JARVIS', 'CEO')),
  status       text not null default 'active'
                 check (status in ('active', 'archived')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger trg_kpis_updated_at
  before update on kpis
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. kpi_values — KPI実績値（現在値・トレンドグラフの元データ）
--    Obsidian table #31 "kpi_values" (06. COMPANY MANAGEMENT)
-- ----------------------------------------------------------------------------
create table if not exists kpi_values (
  id           uuid primary key default gen_random_uuid(),
  kpi_id       uuid not null references kpis (id) on delete cascade,
  period_start date not null,
  period_end   date not null,
  value        numeric not null,
  target_value numeric,
  created_at   timestamptz not null default now()
);

create index if not exists idx_kpi_values_kpi_period on kpi_values (kpi_id, period_start);
