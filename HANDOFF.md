# HANDOFF.md — S-QUEST COMPANY OS 引き継ぎ資料

このドキュメントは、本プロジェクトを別のAIコーディングエージェント（Codex等）や
新しい開発者に引き継ぐための資料です。作業を始める前に必ず一読してください。

作成日: 2026-09-01

---

## 1. プロジェクト概要

### S-QUEST AI COMPANY とは

CEO（人間）× JARVIS（AI COO/司令塔）× AI社員A〜F が働く「仮想企業」のコンセプト。
JARVISがCEOの指示を分解し、AI社員A〜Fに配分し、結果を統合してCEOに報告する——
という業務フローを、実際に動くWebアプリとして構築している。

各AI社員には役割・部署・キャラクター性が設定されている（詳細は
`src/lib/company-data.ts` の `EMPLOYEES`）。

- A：調査／リサーチ部
- B：戦略／経営戦略部
- C：企画／プロダクト・クリエイティブ部
- D：営業／収益化部
- E：集客／マーケティング・広報部
- F：品質管理／監査部

S-QUEST COMPANYは将来的に「S-QUEST診断」（後述の16タイプ診断）を主力プロダクト
として展開する事業体という設定で、AI社員たちのタスクや会話にもこの文脈が
一貫して埋め込まれている。

### S-QUEST COMPANY OS とは

上記のコンセプトを実現する本リポジトリ＝Webアプリケーション本体。
「会社の運営そのものをソフトウェアとして持つ」ダッシュボード兼業務システムで、
タスク管理・カレンダー・KPI・ワークフロー・経費/売上台帳・成果物管理・承認ゲート
・監査ログ・通知・会社健全性スコアなど、実際の中小企業が持つ機能を一通り備える。
JARVIS司令センター（`/jarvis`）からはチャットでCEOが指示を出し、JARVISが
タスク作成やKPI目標変更を提案 → CEOが実行ボタンで確定、という運用になっている。

### 技術スタック

- **フロントエンド／フルスタックフレームワーク**: TanStack Start（React 19 +
  TanStack Router、SSR）+ Vite 8 + Nitro（`cloudflare-module` プリセット）
- **UI**: Tailwind CSS v4、Radix UI各種、lucide-react、recharts（グラフ）
- **バリデーション**: Zod（`*.functions.ts` の `inputValidator` で全面採用）
- **バックエンド／DB**: Supabase（Postgres + Row Level Security + Auth）。
  `@supabase/ssr` でCookieベースのCEOセッションをサーバー関数ごとに再生成する
  （詳細は `src/lib/supabase.server.ts`）
- **AI**: Google Gemini API（`gemini-3.6-flash`）を直接呼び出し。JARVISの
  function calling（`create_task` / `update_kpi_target`）もここで実装
  （旧: Lovable AI Gatewayをフォールバック経路として残しているが、function
  callingには非対応）
- **外部連携**: Google Calendar（サービスアカウント + Web Crypto APIによる
  自前JWT実装で読み取り専用連携。ライブラリ非依存、`google-calendar.server.ts`）
- **デプロイ**: Cloudflare Workers（GitHub連携によるWorkers Builds、`main`
  へのpushで自動デプロイ）
- **TypeScript**: strict モード全面適用

---

## 2. 現在の実装状況

### 完全に実データ化済み（Supabase Postgresに永続化、CRUDあり）

| 機能 | ルート | テーブル | 備考 |
|---|---|---|---|
| タスク管理 | `/tasks`, ダッシュボード | `tasks` | Kanban/List/カレンダー表示 |
| カレンダー | `/calendar`, ダッシュボード | `calendar_events` | Googleカレンダー（読み取り専用）と統合表示 |
| KPI | `/kpi`, ダッシュボード | `kpis`, `kpi_values` | JARVISがtarget変更を提案可能（3項目のみ） |
| ワークフロー | `/workflows`, `/decisions` | `workflows` | WF-01〜06、承認レベルL0〜L3を保持 |
| AI社員（稼働状況） | `/employees`, オフィスフロア | `ai_employees` | status/progress/currentTask/completedToday/lastActivityが実データ |
| 経費 | `/expenses` | `expenses` | |
| 売上 | `/revenue` | `revenue_entries` | 台帳形式（追記のみ） |
| 成果物管理 | `/outputs` | `ai_outputs` | |
| 承認センター | `/approvals` | `approvals` | 承認/却下でaudit_logsにも記録 |
| 監査ログ | `/audit`, ダッシュボード「全社アクティビティ」, `/jarvis`「アクションコンソール」 | `audit_logs` | actor（JARVIS\|CEO）・action・target。write-once、UPDATE/DELETE用関数を用意しない |
| 通知 | AppShellのベルアイコン | `notifications` | |
| 会社健全性 | `/company-health`, ダッシュボード | 上記テーブル群から算出 | |
| COMPANY OS（会社の方針・ルール台帳） | `/company-os` | `company_os_entries` | Vision/Values/Goal/RULES等 |
| CEOログイン／認証 | `/login`, 全ルート | Supabase Auth | `REQUIRE_CEO_LOGIN=true`で強制。未ログイン時のfail-open挙動は修正済み（9b75b0b） |

### まだ静的データ／演出のまま（実データ化されていない）

- **PLANTS / WEAPONS（16タイプ診断のマスターデータ）**:
  `src/lib/company-data.ts` の `PLANTS` / `WEAPONS` 定数。`/company-os`
  ページに「16 TYPES / PLANT / WEAPON（正式名称は変更しない）」として
  参照表示されているのみで、実際に診断を実施する機能はまだ存在しない。
  → **セクション6の次のタスクの対象。**
- **オフィスフロアの引き渡しアニメーション演出**（`src/lib/demo-mode.ts` の
  `useCompanySimulation`）: JARVIS⇄AI社員間の「引き渡し」アニメーション
  （`handoff`）、JARVISの状態演出（`questState` / `questMessage`）、
  売上ティッカーの微アニメーション、活動フィードの見た目上のtick、
  DeskCardの「Lv. / 経験値 / 本日の割当数」表示。これらは実データに対応する
  概念が存在しない「演出専用」レイヤーで、`DEMO_MODE`（現在`true`固定）で
  on/offできる。AI社員のstatus/progress/currentTask等は実データ
  （`ai_employees`）で上書きされるが、このアニメーション自体は今後も
  演出として維持する方針（直近の作業でもこの部分には触れていない）。
- **ダッシュボードの「CEOの確認が必要」パネルの一部**: `ALERTS`
  （`company-data.ts`）由来のWARNING/CRITICALアラートは静的モックのまま
  （実データの承認依頼＝`pendingApprovals`とは別枠で表示）。
- **組織図/Company Map**（`/company-map`）: 静的。
- **エラーセンター**（`/errors`）: 静的。
- **プロジェクト管理**（`/projects`）: 静的（`PROJECTS`定数）。
- **設定画面**（`/settings`）: `DEMO_MODE`フラグの表示のみで、トグル自体に
  実データ連動する副作用はない。

---

## 3. このプロジェクトで一貫して守ってきた設計原則・慣習

### DELETE禁止ルール（物理削除しない、追記式の台帳哲学）

アプリ層から `.delete()` を呼ぶコードは一切書かない。`src/lib/supabase.server.ts`
の冒頭にコメントとして明記されている恒久ルール:

> データ削除は COMPANY OS / RULES の Approval Gate 対象（CEO承認必須）であり、
> アプリ層からの自動削除は一切行わない。行を無効化・アーカイブしたい場合は
> status/archived フラグの UPDATE で表現し、物理削除は行わない。

`audit_logs` も同じ思想で「write-once・UPDATE/DELETE用の関数を用意しない」
（`audit.server.ts`のコメント参照）。新しいテーブルを設計するときも、削除ではなく
ステータス遷移や追記で表現できないかをまず検討すること。

### Supabaseスキーマ変更は手動SQL Editor実行方式

`wrangler` や Supabase CLI経由のマイグレーション自動化は**していない**。
`supabase/` ディレクトリの `schema_phaseN.sql` / `rls_phaseN.sql` /
`migration_NNN_*.sql` は、実行手順書として作成し、**Supabaseダッシュボードの
SQL Editorに人間（CEO）がコピペして手動実行する**運用。実行後にコードから
参照する。CIやアプリのビルドプロセスからDBスキーマを自動変更する仕組みは
存在しない。新しいテーブル/カラムを追加する際は次の phase 番号で
`schema_phaseN.sql`（テーブル定義）と `rls_phaseN.sql`（RLSポリシー）を分けて
作成し、コミットメッセージに実行済みかどうかの確認結果を書く。

### RLSはCEOログイン導入後、最初からauthenticatedロール限定で作成する

CEOログイン機能（`7234f07`〜）が入る前のテーブル（phase1〜6あたり）は、
「まずanonロール全許可 → RLS導入後にauthenticated限定へ段階移行」という
2段階を踏んだ（`rls_phase6_require_auth.sql`）。しかし**CEOログインが完了した
現在は、新しいテーブルはこの段階を踏まず最初からauthenticatedロール限定で
作成する**。`rls_phase7`〜`11`（approvals/notifications/audit_logs/
revenue_entries/company_os_entries）は全てこのパターン:

```sql
alter table <table> enable row level security;

drop policy if exists "authenticated full access" on <table>;

create policy "authenticated full access" on <table>
  for all
  to authenticated
  using (true)
  with check (true);
```

anonを一時的にでも許可する設計は、意図的な理由がない限り選ばない。

### TypeScript strict、Zodバリデーション

`tsconfig.json` は `"strict": true`。サーバー関数の入力は必ずZodスキーマで
検証してから使う（後述のパターン参照）。`any`は既存コード（音声認識の
`SpeechRecognition` Web API周り等、型定義が薄い箇所）に一部残っているのみで、
新規コードでは使わない。

### JARVISのfunction calling（create_task、update_kpi_target）の安全設計パターン

`src/lib/jarvis.server.ts` に集約されている設計思想。新しい関数をJARVISに
追加する際は、必ずこの3点セットを踏襲すること:

1. **ホワイトリスト方式**: `JARVIS_TOOLS` に列挙した関数以外は一切
   モデルに公開しない。`update_kpi_target` は対象を意図的に
   `monthly_revenue` / `mrr` / `profit` の3件のみに絞っている
   （曖昧な会話コマンドで会社健全性スコアに関わるKPIを不用意に変更
   させないため）。
2. **モデル出力の検証と実行ボタン確認**: モデルがfunction callを返しても
   **その場では絶対に実行しない**。`parseProposedTask` /
   `parseProposedKpiTargetUpdate` でホワイトリスト外の値
   （存在しない担当コード、範囲外の数値等）を弾き、不正なら提案自体を
   無効化する（実行ボタンを出さない）。有効な提案はUIに「提案カード」
   として表示し、CEOが画面上の実行ボタンを押して初めて
   `confirmJarvisTaskFn` / `confirmJarvisKpiTargetUpdateFn`
   （`jarvis.functions.ts`）が呼ばれ、実データが変更される。
3. **監査ログ記録**: 実行ボタン経由で実際にデータが変更される
   操作（`tasks.server.ts`のcreateTask、`kpi.server.ts`のKPI target変更等）
   は、必ず内部で `createAuditLog()` を呼ぶ（呼び出し側でtry/catchし、
   ログ記録の失敗が本処理を止めないようにする）。

---

## 4. 環境変数一覧

**重要: 実際の値はこのファイルにも、リポジトリのどこにも絶対にコミットしない。**
ここには変数名と用途、設定先のみを記載する。

### ローカル開発（`.env`、gitignore対象、リポジトリには含まれない）

| 変数名 | 用途 |
|---|---|
| `GEMINI_API_KEY` | JARVISの応答生成・function calling（Gemini API） |
| `SUPABASE_URL` | Supabaseプロジェクトの URL |
| `SUPABASE_ANON_KEY` | Supabaseクライアント用キー（publishable key） |
| `REQUIRE_CEO_LOGIN` | `"true"`でCEOログイン必須化（RLSがauthenticated限定のため、本番は常に`"true"`） |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Googleカレンダー連携用サービスアカウント |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | 同上、秘密鍵（PEM形式、改行は`\n`エスケープ） |
| `GOOGLE_CALENDAR_ID` | 表示対象のGoogleカレンダーID |

### Cloudflare本番環境

Cloudflare Workersは「非機密変数」と「機密（Secrets）」で設定経路が異なる。

- **非機密変数（`REQUIRE_CEO_LOGIN`, `SUPABASE_URL`,
  `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_CALENDAR_ID`）**:
  リポジトリルートの **`wrangler.jsonc` の `vars` にコミットする**。
  nitroの`cloudflare-module`プリセットがビルド時にこのファイルを読み込み、
  `.output/server/wrangler.json` へマージするため、pushするたびに自動で
  本番へ反映される。Cloudflareダッシュボードで手動設定した変数は
  デプロイのたびに上書き・消去されるため、**ここに書かない限り消える**
  （過去に実際に本番障害を起こした原因）。
- **機密（`GEMINI_API_KEY`, `SUPABASE_ANON_KEY`,
  `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`）**: ファイルにもGitにも書かない。
  Cloudflare側で個別にSecretとして設定する。設定方法の注意点は
  セクション5参照。

Worker名は `wrangler.jsonc` の `"name": "s-quest-company-os"` で明示固定
している（`git remote origin`から自動生成される名前とは異なるので、
このファイルの値を変更しないこと）。

---

## 5. デプロイ関連の注意点

### Cloudflare Workers Builds（GitHub連携の自動デプロイ）

このリポジトリはCloudflare Workers BuildsとGitHub連携済みで、**`main`
ブランチへのpushで自動的にビルド・デプロイされる**。手動で`wrangler deploy`
を叩く必要は通常ない。デプロイ後の確認は本番URL
（`https://s-quest-company-os.q-masaki-ando.workers.dev/`）で行う。

### Windows環境で `wrangler secret put` を使うとBOM文字が混入する問題（重要）

**今日発見した根本原因**: Windows（PowerShell）から `wrangler secret put
<NAME>` を実行し、標準入力経由で値を渡す（あるいはPowerShellの文字列を
パイプする）と、値の先頭に不可視のUTF-8 BOM（バイトオーダーマーク、
U+FEFF）が混入することがある。これが原因で:

- `wrangler secret list` では正常に登録されているように見える
- 値をコピペ確認しても目視ではBOMは見えない
- しかし実際にそのSecretを使う処理（Supabaseキー、Gemini APIキー等）が
  「キーが不正」「認証エラー」のような形で**原因不明のまま**失敗する

**対策**: Windows環境からは `wrangler secret put` をCLIで実行せず、
**Cloudflareダッシュボードから直接入力する**こと
（Workers & Pages → 対象Worker → Settings → Variables and Secrets →
Secretを追加 → Web上のテキストボックスに直接ペースト）。ダッシュボードの
入力フォームはBOMを混入させない。CLIから設定する必要がある場合は、
BOMを付与しないエンコーディング（例: `[System.IO.File]::WriteAllText(...,
$value, [System.Text.UTF8Encoding]::new($false))` で一時ファイルに書き出し
てから `wrangler secret put <NAME> < file`）を使うなど、明示的にBOMなしで
渡す経路を確保すること。原因が分からず「Secretを設定したのに動かない」
場合は、まずこのBOM混入を疑うこと。

---

## 6. 次のタスク：S-QUEST診断本体の実装

S-QUEST COMPANYの主力プロダクトという設定になっている「S-QUEST診断」
（16タイプ診断、PLANT × WEAPON）を、このCOMPANY OS上に実際に作る。

### 参照すべき既存マスターデータ

`src/lib/company-data.ts` の `PLANTS` と `WEAPONS`（**正式名称・スコア構造は
変更しない**——`/company-os`ページのヒント文言と同じ方針を踏襲すること）。

- **PLANT（4種）**: 性格・資質軸。AUGUSTA（主体性・リーダーシップ・推進力）／
  MONSTERA（共感・傾聴・信頼・協調性）／PACHIRA（論理性・計画性・安定感・
  再現性）／EVERFRESH（柔軟性・好奇心・適応力・発想力）
- **WEAPON（4種）**: 行動様式軸。コード`B`＝大剣（突破）／`S`＝弓（戦略）／
  `X`＝双剣（適応）／`K`＝魔導書（知略）
- **16タイプ**: PLANT × WEAPON の組み合わせで決まる（例:
  AUGUSTA×B＝「AB｜覇王」、MONSTERA×S＝「CS｜外交官」等）。**注意**:
  タイプコードのPLANT側の文字は、PLANT名の頭文字と一致しない
  （AUGUSTA→`A`、MONSTERA→`C`、PACHIRA→`S`、EVERFRESH→`E`）。
  `PLANTS[].types` にすでに正しい対応が定義されているので、これを
  正として扱うこと（新たに文字を割り当て直さない）。

### 実装時に検討すべきこと（未着手・要設計）

- 診断の質問セット（何問で、どの軸をどう判定するか）はまだ存在しない。
  `company-data.ts`内のコメントに「質問 → スコア → タイプ → 結果」の
  4段階を一本につなげて検証する、という言及があるが、実際の質問文・
  採点ロジック・同点処理・逆転項目の設計は未着手。
- 診断結果はCEO向け社内ツールではなく、エンドユーザー（診断を受ける人）
  向けの機能になる想定——認証・RLS設計は既存のCEO限定パターン
  （authenticated限定）をそのまま使えない可能性が高い。誰が結果を
  読み書きできるか（匿名ユーザー可否、結果の永続化要否）を最初に
  決めること。
- 新しいテーブルが必要になった場合は、セクション3の設計原則
  （手動SQL Editor実行、DELETE禁止、RLSは最初からauthenticated限定 or
  用途に応じた適切なロール設計）を踏襲すること。
- 既存の`src/routes/company-os.tsx`はあくまで「マスターデータの参照表示」
  であり、診断機能そのものではない。新しいルート（例: `/diagnosis`）を
  切って実装するのが自然。

---

## 7. リポジトリ構造の要点

### 命名パターン（`src/lib/`）

機能ごとに3層のファイルに分かれている。新機能を追加するときはこの3点
セットを踏襲すること:

1. **`<feature>.server.ts`** — Supabaseへの実際のCRUDロジック（server-only、
   `getSupabaseServerClient()`を使う）。型定義（`XxxEntry`等）もここに置く。
   DELETE禁止ルールに従い、`.delete()`は書かない。
2. **`<feature>.functions.ts`** — `createServerFn`によるクライアント⇄サーバー
   境界。`requireCeoAuthMiddleware`でCEO認証を要求し、Zodスキーマ
   （`.inputValidator((data: unknown) => schema.parse(data))`）で入力検証。
   ハンドラ内で `<feature>.server.ts` を動的import（`await import(...)`）
   して呼び出す。例（`tasks.functions.ts`）:

   ```ts
   export const createTaskFn = createServerFn({ method: "POST" })
     .middleware([requireCeoAuthMiddleware])
     .inputValidator((data: unknown) => createTaskSchema.parse(data))
     .handler(async ({ data }) => {
       const { createTask } = await import("./tasks.server");
       return createTask(data);
     });
   ```

3. **`use-<feature>.ts`** — クライアント側のReactフック。`useServerFn()`で
   上記の`*.functions.ts`をラップし、`loading`/`error`/データ本体/
   （必要なら）ミューテーション関数を返す。一覧系は多くが
   マウント時に一度だけfetchする方式（`use-approvals.ts`・`use-audit.ts`
   等）で、ベル通知のような常時ポーリングが必要なもの（`use-notifications.ts`）
   だけ例外的にintervalを持つ。

### `src/routes/`

TanStack Routerのファイルベースルーティング。1ルート1ファイル、
`createFileRoute`でheadタグ（title/description/OGP）とcomponentを定義する。
ページコンポーネントは基本的に対応する`use-<feature>.ts`フックを1つ以上
importして実データを表示する（セクション2の表を参照）。

### `src/components/os/`

`AppShell`（サイドバー・ヘッダー等の共通レイアウト）、`primitives.tsx`
（`Panel`/`SectionTitle`/`Tag`/`Meter`/`EmptyState`/`DemoDataBadge`等の
共通UIパーツ）、`OfficeFloor`/`JarvisCore`/`QuestCore`（AIオフィスフロアの
アニメーション演出コンポーネント）などが入る。

### `src/lib/company-data.ts`

全社共通の静的マスターデータ・定数の集約ファイル（かなり巨大）。
`EMPLOYEES`（AI社員プロファイル）、`PLANTS`/`WEAPONS`（16タイプ診断
マスター）、`ALERTS`/`PROJECTS`/`ACTIVITY`等の静的モック、`empColor()`・
`jpy()`等のユーティリティ関数、AI社員の詳細な人格・担当領域を記述した
長文プロンプト素材（JARVISのシステムプロンプト構築に使われる）まで
含む。実データ化が進むにつれて、対応するモック定数（例: 旧`AUDIT_LOGS`）
は削除されてきた。

### `src/lib/demo-mode.ts`

セクション2で述べた「演出専用」レイヤー（`useCompanySimulation`
フック、`DEMO_MODE`定数）。実データ化する際も、ここが担う演出
（handoff/questState/questMessage/revenueティッカー）は原則として
維持する方針。

### `supabase/`

`schema_phaseN.sql`（テーブル定義）、`rls_phaseN.sql`（RLSポリシー）、
`migration_NNN_*.sql`（既存テーブルへのカラム追加等）。すべて
Supabaseダッシュボードから手動実行する前提のSQLファイル
（セクション3参照）。テーブル一覧: `ai_employees`, `tasks`,
`calendar_events`, `kpis`, `kpi_values`, `workflows`, `expenses`,
`ai_outputs`, `approvals`, `notifications`, `revenue_entries`,
`audit_logs`, `company_os_entries`。

### その他

- `scripts/` — `npm run seed` 系のシードスクリプト（`--env-file=.env`で
  ローカル`.env`を読み込んでSupabaseに投入する）。
- `wrangler.jsonc` — Cloudflare Worker名固定・非機密環境変数
  （セクション4・5参照）。
