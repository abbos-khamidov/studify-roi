"use client";

import { useCurrency } from "@/components/currency-provider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Header() {
  const { currency } = useCurrency();

  const label = currency === "EUR" ? "EUR (€)" : "UZS (сум)";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg-secondary)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:pl-6">
        <div className="min-w-0">
          <h1 className="font-display text-lg font-bold tracking-tight text-[var(--text-primary)] md:text-xl">
            Studify Finance
          </h1>
          <p className="hidden text-xs text-[var(--text-muted)] sm:block">
            Дашборд и калькулятор для руководителя
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span
            className="rounded-pill border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] sm:text-sm"
            title="Меняется в настройках"
          >
            {label}
          </span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
