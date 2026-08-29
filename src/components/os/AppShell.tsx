import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  Bell,
  Bot,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Command as CommandIcon,
  FileText,
  LogOut,
  Gauge,
  Gavel,
  HeartPulse,
  Home,
  LayoutGrid,
  Menu,
  Network,
  PackageOpen,
  Receipt,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCircle,
  Wallet,
  Workflow as WorkflowIcon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NOTIFICATIONS, EMPLOYEES } from "@/lib/company-data";
import { useAuth } from "@/lib/use-auth";
import { useTasks } from "@/lib/use-tasks";
import { useWorkflows } from "@/lib/use-workflows";
import { SimulationBadge } from "./primitives";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const NAV = [
  { to: "/", label: "本社ダッシュボード", icon: Home },
  { to: "/jarvis", label: "JARVIS 司令センター", icon: Sparkles },
  { to: "/tasks", label: "タスク", icon: ClipboardList },
  { to: "/calendar", label: "カレンダー", icon: CalendarDays },
  { to: "/employees", label: "AI社員", icon: Bot },
  { to: "/company-map", label: "組織図", icon: Network },
  { to: "/workflows", label: "ワークフロー", icon: WorkflowIcon },
  { to: "/approvals", label: "承認センター", icon: ClipboardCheck },
  { to: "/decisions", label: "CEO Decision Center", icon: Gavel },
  { to: "/errors", label: "エラーセンター", icon: AlertTriangle },
  { to: "/company-os", label: "会社データベース", icon: LayoutGrid },
  { to: "/kpi", label: "KPI", icon: Gauge },
  { to: "/company-health", label: "会社健全性", icon: HeartPulse },
  { to: "/revenue", label: "売上", icon: Wallet },
  { to: "/expenses", label: "経費管理", icon: Receipt },
  { to: "/outputs", label: "成果物管理", icon: PackageOpen },
  { to: "/projects", label: "プロジェクト", icon: Activity },
  { to: "/reports", label: "レポート", icon: FileText },
  { to: "/audit", label: "監査ログ", icon: ShieldCheck },
  { to: "/profile", label: "CEO プロフィール", icon: UserCircle },
  { to: "/settings", label: "設定", icon: Settings },
] as const;

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { email, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    await navigate({ to: "/login" });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Link to="/" onClick={onNavigate} className="block">
          <p className="text-sm font-semibold tracking-[0.22em]">S-QUEST</p>
          <p className="label-caps mt-1">会社OS</p>
        </Link>
      </div>

      <nav
        className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4"
        aria-label="Global"
      >
        {NAV.map(({ to, label, icon: Icon }) => {
          const active =
            to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium tracking-wide transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span>{label}</span>
              {active ? (
                <span
                  className="ml-auto size-1.5 rounded-full bg-primary"
                  aria-hidden
                />
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-sidebar-border p-4">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">システム稼働状況</span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--success)]">
            <span className="size-1.5 animate-pulse rounded-full bg-current" />
            正常稼働
          </span>
        </div>
        <SimulationBadge className="w-full justify-center" />
        <div className="flex items-center gap-3 rounded-lg border border-sidebar-border bg-secondary/50 px-3 py-2">
          <div className="grid size-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            M
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">安藤正騎</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {email ?? "CEO ・ 全権限"}
            </p>
          </div>
          {email ? (
            <button
              onClick={() => void handleSignOut()}
              aria-label="ログアウト"
              title="ログアウト"
              className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <LogOut className="size-3.5" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function NotificationPanel() {
  const unread = NOTIFICATIONS.filter((n) => n.unread).length;
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications, ${unread} unread`}
        className="relative grid size-9 place-items-center rounded-lg border border-border transition-colors hover:bg-accent"
      >
        <Bell className="size-4" aria-hidden />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="panel absolute right-0 top-11 z-50 w-80 p-2">
          <p className="label-caps px-3 py-2">通知センター</p>
          <ul className="max-h-80 space-y-1 overflow-y-auto">
            {NOTIFICATIONS.map((n) => (
              <li
                key={n.title + n.at}
                className="rounded-lg px-3 py-2 transition-colors hover:bg-accent"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold">{n.title}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {n.at}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function CommandPalette({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const { tasks } = useTasks();
  const { workflows } = useWorkflows();
  const go = (to: string) => {
    setOpen(false);
    void navigate({ to });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
        <DialogTitle className="sr-only">Global command palette</DialogTitle>
        <Command className="bg-popover">
          <CommandInput placeholder="会社を検索、またはコマンドを実行…" />
          <CommandList>
            <CommandEmpty>該当する項目がありません。</CommandEmpty>
            <CommandGroup heading="コマンド">
              <CommandItem onSelect={() => go("/jarvis")}>
                JARVISへ指示
              </CommandItem>
              <CommandItem onSelect={() => go("/tasks")}>
                タスクを作成
              </CommandItem>
              <CommandItem onSelect={() => go("/kpi")}>KPIを開く</CommandItem>
              <CommandItem onSelect={() => go("/company-health")}>
                会社健全性を開く
              </CommandItem>
              <CommandItem onSelect={() => go("/revenue")}>
                売上を開く
              </CommandItem>
              <CommandItem onSelect={() => go("/expenses")}>
                経費管理を開く
              </CommandItem>
              <CommandItem onSelect={() => go("/outputs")}>
                成果物管理を開く
              </CommandItem>
              <CommandItem onSelect={() => go("/workflows")}>
                ワークフローを実行
              </CommandItem>
              <CommandItem onSelect={() => go("/company-os")}>
                Search Company OS
              </CommandItem>
              <CommandItem onSelect={() => go("/company-map")}>
                組織図を開く
              </CommandItem>
              <CommandItem onSelect={() => go("/approvals")}>
                承認センターを開く
              </CommandItem>
              <CommandItem onSelect={() => go("/decisions")}>
                CEO Decision Center を開く
              </CommandItem>
              <CommandItem onSelect={() => go("/errors")}>
                エラーセンターを開く
              </CommandItem>
              <CommandItem onSelect={() => go("/profile")}>
                CEO プロフィールを開く
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="AI社員">
              {EMPLOYEES.map((e) => (
                <CommandItem
                  key={e.code}
                  onSelect={() => go(`/employees/${e.code}`)}
                >
                  {e.code}｜{e.name} — {e.department}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="タスク">
              {tasks.slice(0, 6).map((t) => (
                <CommandItem key={t.id} onSelect={() => go("/tasks")}>
                  {t.id} — {t.title}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="ワークフロー">
              {workflows.map((w) => (
                <CommandItem key={w.code} onSelect={() => go("/workflows")}>
                  {w.code} — {w.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen lg:pl-60">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-sidebar-border bg-sidebar/90 backdrop-blur lg:block">
        <SidebarNav />
      </aside>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-sidebar-border bg-sidebar">
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-4 grid size-8 place-items-center rounded-lg border border-border"
            >
              <X className="size-4" aria-hidden />
            </button>
            <SidebarNav onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      ) : null}

      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            className="grid size-9 place-items-center rounded-lg border border-border lg:hidden"
          >
            <Menu className="size-4" aria-hidden />
          </button>

          <button
            onClick={() => setPaletteOpen(true)}
            className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 text-left text-xs text-muted-foreground transition-colors hover:bg-accent sm:max-w-md"
          >
            <Search className="size-4" aria-hidden />
            <span className="flex-1 truncate">
              タスク・AI社員・KPI・会社データを検索…
            </span>
            <kbd className="hidden items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[10px] sm:flex">
              <CommandIcon className="size-3" aria-hidden />K
            </kbd>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-[11px] text-muted-foreground md:inline">
              2026-08-26 · 21:03 JST
            </span>
            <NotificationPanel />
            <Link
              to="/jarvis"
              className="hidden items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:inline-flex"
            >
              <Sparkles className="size-3.5" aria-hidden />
              JARVISへ指示
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] px-4 py-7 pb-24 sm:px-6 lg:pb-10">
        {children}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 px-4 py-2 backdrop-blur lg:left-60">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            JARVIS 稼働中 — WF-06 KPI → 戦略
          </span>
          <span className="hidden sm:inline">
            本日の完了：A 6件 · B 4件 · C 5件 · D 3件 · E 7件 · F 9件
          </span>
          <span>承認待ち 1件</span>
        </div>
      </div>

      <CommandPalette open={paletteOpen} setOpen={setPaletteOpen} />
    </div>
  );
}
