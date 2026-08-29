import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  STATUS_LABEL,
  STATUS_TONE,
  type EmployeeStatus,
} from "@/lib/company-data";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function Panel({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("panel p-5", className)} {...rest}>
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="label-caps">{title}</h2>
        {hint ? (
          <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="label-caps mb-2">{eyebrow}</p> : null}
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

export function StatusPill({
  status,
  className,
}: {
  status: EmployeeStatus;
  className?: string;
}) {
  const tone = STATUS_TONE[status];
  const live = status === "WORKING" || status === "THINKING";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        className,
      )}
      style={{
        borderColor: `color-mix(in oklab, ${tone} 40%, transparent)`,
        background: `color-mix(in oklab, ${tone} 12%, transparent)`,
        color: tone,
      }}
    >
      <span
        className={cn("size-1.5 rounded-full", live && "animate-pulse")}
        style={{ background: tone }}
      />
      {status.replace("_", " ")}
      <span className="text-muted-foreground">{STATUS_LABEL[status]}</span>
    </span>
  );
}

export function Tag({
  children,
  tone = "var(--primary)",
  className,
}: {
  children: ReactNode;
  tone?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
        className,
      )}
      style={{
        borderColor: `color-mix(in oklab, ${tone} 38%, transparent)`,
        background: `color-mix(in oklab, ${tone} 12%, transparent)`,
        color: tone,
      }}
    >
      {children}
    </span>
  );
}

export function Meter({
  value,
  tone = "var(--primary)",
  className,
  label,
}: {
  value: number;
  tone?: string;
  className?: string;
  label?: string;
}) {
  return (
    <div className={className}>
      {label ? (
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{label}</span>
          <span className="num-display text-foreground">{value}%</span>
        </div>
      ) : null}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "progress"}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
            background: `linear-gradient(90deg, color-mix(in oklab, ${tone} 65%, transparent), ${tone})`,
          }}
        />
      </div>
    </div>
  );
}

export function Delta({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className="num-display text-xs"
      style={{ color: up ? "var(--success)" : "var(--destructive)" }}
    >
      {up ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="panel flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="size-10 rounded-full border border-border bg-secondary" />
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{body}</p>
      {actionLabel ? (
        <button
          onClick={onAction}
          className="mt-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

/**
 * EmptyStateと同じ構造の、エラー・状態通知用Feedbackコンポーネント（Component Library Feedback / ErrorState）。
 * デフォルトは destructive（実際のエラー用）だが、`tone` を渡せば「承認待ち0件＝オールクリア」のような
 * 同じ構造の状態通知にも流用できる（例：success トーンで承認センターの0件表示）。
 */
export function ErrorState({
  title,
  body,
  actionLabel,
  onAction,
  tone = "var(--destructive)",
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: string;
}) {
  return (
    <div
      className="panel flex flex-col items-center gap-3 px-6 py-12 text-center"
      style={{ borderColor: `color-mix(in oklab, ${tone} 30%, var(--border))` }}
    >
      <div
        className="size-10 rounded-full border"
        style={{
          borderColor: `color-mix(in oklab, ${tone} 45%, transparent)`,
          background: `color-mix(in oklab, ${tone} 14%, transparent)`,
        }}
      />
      <h3 className="text-sm font-semibold" style={{ color: tone }}>
        {title}
      </h3>
      <p className="max-w-sm text-sm text-muted-foreground">{body}</p>
      {actionLabel ? (
        <button
          onClick={onAction}
          className="mt-2 rounded-lg border px-4 py-2 text-xs font-semibold transition-opacity hover:opacity-90"
          style={{ borderColor: tone, color: tone }}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

/** 破壊的・確定操作の前に一段確認を挟む共通ダイアログ（Component Library Feedback / ConfirmDialog）。 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "実行",
  cancelLabel = "キャンセル",
  danger = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** trueの場合、確認ボタンをdestructiveトーンで表示する。 */
  danger?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
        <div className="mt-2 flex justify-end gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-border px-4 py-2 text-xs font-semibold hover:bg-accent"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
            style={{
              background: danger ? "var(--destructive)" : "var(--primary)",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SimulationBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-semibold tracking-[0.14em]",
        className,
      )}
      style={{
        borderColor: "color-mix(in oklab, var(--warning) 40%, transparent)",
        background: "color-mix(in oklab, var(--warning) 12%, transparent)",
        color: "var(--warning)",
      }}
    >
      <span className="size-1.5 rounded-full bg-current" />
      SIMULATION
    </span>
  );
}

/**
 * SimulationBadgeは全ページ共通（このアプリ自体が仮想企業のシミュレーション
 * である旨）なので、まだSupabase実データ化していないページ・要素だけに絞って
 * 「これはデモデータです」を明示するための専用バッジ。
 */
export function DemoDataBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-semibold tracking-[0.14em]",
        className,
      )}
      style={{
        borderColor: "color-mix(in oklab, var(--muted-foreground) 40%, transparent)",
        background: "color-mix(in oklab, var(--muted-foreground) 12%, transparent)",
        color: "var(--muted-foreground)",
      }}
    >
      デモデータ
    </span>
  );
}
