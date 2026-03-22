"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { formatCurrency, formatPercent } from "@/lib/format";

export function BreakEvenPanel({
  currentProgress,
  target,
  revenue,
  currency,
}: {
  currentProgress: number;
  target: number;
  revenue: number;
  currency: string;
}) {
  const pct = Math.min(100, currentProgress * 100);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-5">
        <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">
          Break-Even Tracker
        </h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Текущая выручка к целевой ({formatCurrency(target, currency)})
        </p>
        {target <= 0 ? (
          <p className="mt-6 text-sm text-[var(--text-secondary)]">
            Укажите месячную цель выручки в настройках.
          </p>
        ) : (
          <>
            <div className="mt-6">
              <div className="h-4 w-full overflow-hidden rounded-pill bg-[var(--bg-tertiary)]">
                <div
                  className="h-full rounded-pill bg-[var(--accent-primary)] transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-sm text-[var(--text-secondary)]">
                <span className="font-mono-data">{formatCurrency(revenue, currency)}</span>
                <span>{formatPercent(pct, 0)}</span>
              </div>
            </div>
          </>
        )}
      </Card>
    </motion.div>
  );
}
