"use client";

import { Loader2, X } from "lucide-react";
import { useEffect, useId } from "react";
import { initials } from "@/lib/format";

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

/* ---------- Buttons ---------- */
type Variant = "primary" | "secondary" | "danger" | "dangerOutline" | "ghost";
const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  secondary: "bg-white text-ink border border-line hover:bg-canvas",
  danger: "bg-danger text-white hover:opacity-90",
  dangerOutline: "bg-white text-danger border border-line hover:bg-danger-soft",
  ghost: "text-muted hover:bg-black/5",
};

export function Button({
  variant = "primary",
  loading,
  small,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean; small?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        small ? "px-2.5 py-1.5 text-sm" : "px-4 py-2 text-sm",
        variants[variant],
        className
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

/* ---------- Form fields ---------- */
export const inputCls =
  "w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/70 disabled:bg-canvas";

export function Field({
  label,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: (id: string) => React.ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {children(id)}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

/* ---------- Badges ---------- */
const tones = {
  neutral: "bg-black/5 text-muted",
  ok: "bg-ok-soft text-ok",
  amber: "bg-amber-soft text-amber",
  danger: "bg-danger-soft text-danger",
  brand: "bg-brand-soft text-brand-dark",
};

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof tones; children: React.ReactNode }) {
  return <span className={cx("inline-block rounded-full px-2 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>;
}

const statusTone: Record<string, keyof typeof tones> = {
  active: "ok",
  approved: "ok",
  on_leave: "amber",
  pending: "amber",
  terminated: "danger",
  rejected: "danger",
  cancelled: "neutral",
};

export function StatusBadge({ status }: { status: string }) {
  const text = status.replace(/_/g, " ");
  return <Badge tone={statusTone[status] ?? "neutral"}>{text.charAt(0).toUpperCase() + text.slice(1)}</Badge>;
}

/* ---------- Layout bits ---------- */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-prose text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cx("rounded-lg border border-line bg-white", className)}>
      {title && (
        <header className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Notice({ tone = "danger", children }: { tone?: "danger" | "ok"; children: React.ReactNode }) {
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cx("rounded-md px-3 py-2 text-sm", tone === "danger" ? "bg-danger-soft text-danger" : "bg-ok-soft text-ok")}>
      {children}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
    </div>
  );
}

export function Loading({ text = "Loading…" }: { text?: string }) {
  return <p className="px-6 py-10 text-center text-sm text-muted">{text}</p>;
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.36, background: `hsl(${h} 30% 90%)`, color: `hsl(${h} 45% 25%)` }}
    >
      {initials(name)}
    </span>
  );
}

/* ---------- Table ---------- */
export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs text-muted">
            {head.map((h, i) => (
              <th key={i} scope="col" className="px-4 py-2.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export function Pagination({
  page,
  last,
  total,
  onChange,
}: {
  page: number;
  last: number;
  total: number;
  onChange: (p: number) => void;
}) {
  if (last <= 1) return <p className="border-t border-line px-4 py-3 text-xs text-muted">{total} total</p>;
  return (
    <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm">
      <span className="text-xs text-muted">
        Page {page} of {last} · {total} total
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" small disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Previous
        </Button>
        <Button variant="secondary" small disabled={page >= last} onClick={() => onChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

/* ---------- Modal ---------- */
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 text-muted hover:bg-black/5">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
