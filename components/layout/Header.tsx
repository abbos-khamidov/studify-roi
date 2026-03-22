"use client";

import clsx from "clsx";
import { useCurrency } from "@/components/currency-provider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Header() {
  const { currency, setNavbarCurrency, saving } = useCurrency();

  const usdActive = currency === "USD";
  const uzsActive = currency === "UZS";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg-secondary)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:pl-6">
        <div className="min-w-0">
          <h1 className="font-display text-lg font-bold tracking-tight text-[var(--text-primary)] md:text-xl">
            Studify Finance
          </h1>
          <p className="hidden text-xs text-[var(--text-muted)] sm:block">
            CEO dashboard & calculator
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="flex overflow-hidden rounded-pill border border-[var(--border)] bg-[var(--bg-tertiary)] p-0.5"
            role="group"
            aria-label="Валюта отображения"
          >
            <button
              type="button"
              disabled={saving}
              onClick={() => setNavbarCurrency("USD")}
              className={clsx(
                "min-w-[3.25rem] rounded-pill px-3 py-1.5 text-xs font-semibold transition sm:min-w-[4rem] sm:text-sm",
                usdActive
                  ? "bg-[var(--accent-primary)] text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              USD
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => setNavbarCurrency("UZS")}
              className={clsx(
                "min-w-[3.25rem] rounded-pill px-3 py-1.5 text-xs font-semibold transition sm:min-w-[4rem] sm:text-sm",
                uzsActive
                  ? "bg-[var(--accent-primary)] text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              UZS
            </button>
          </div>
          {currency === "EUR" && (
            <span className="hidden text-xs text-[var(--text-muted)] lg:inline" title="В навбаре только USD/UZS">
              В настройках: EUR
            </span>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
