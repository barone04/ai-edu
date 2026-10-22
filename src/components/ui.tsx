import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const buttonBase =
  "inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export const buttonStyles = {
  primary: `${buttonBase} bg-primary text-white hover:bg-primary-strong`,
  secondary: `${buttonBase} border border-line bg-surface text-ink hover:bg-canvas`,
  danger: `${buttonBase} border border-danger text-danger hover:bg-danger-soft`,
};

export const inputStyles =
  "min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft";

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: keyof typeof buttonStyles }) {
  return <Link className={`${buttonStyles[variant]} ${className}`} {...props} />;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-surface p-4 sm:p-5 ${className}`}>
      {children}
    </section>
  );
}

export function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors ${
        selected
          ? "border-primary bg-primary text-white"
          : "border-line bg-surface text-ink hover:border-primary"
      }`}
    >
      {children}
    </button>
  );
}

export function DemoBadge() {
  return (
    <span className="inline-flex items-center self-start rounded-full bg-warn-soft px-3 py-1 text-sm font-semibold text-warn">
      Dữ liệu minh họa
    </span>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-semibold">{label}</span>
      {children}
      {hint && !error && <span className="text-sm text-muted">{hint}</span>}
      {error && <span className="text-sm font-medium text-danger">{error}</span>}
    </label>
  );
}

export function LoadingBlock({ label = "Đang tải…" }: { label?: string }) {
  return <p className="py-8 text-center text-muted">{label}</p>;
}
