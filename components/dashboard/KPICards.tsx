"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Wallet, Percent, Target, Scale } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Card } from "@/components/ui/Card";

type Analytics = {
  currency: string;
  revenue: { total: number; prevTotal: number };
  expenses: { total: number; prevTotal: number };
  profit: { net: number; margin: number; prevNet: number };
  breakEven: {
    dealsNeeded: number | null;
    revenueNeeded: number;
    currentProgress: number;
    revenueNeededForTarget: number;
  };
  monthly_revenue_target: number;
};

function trendPct(current: number, prev: number): { text: string; up: boolean } {
  if (prev === 0) return { text: "—", up: true };
  const p = ((current - prev) / Math.abs(prev)) * 100;
  return {
    text: `${p >= 0 ? "↑" : "↓"}${Math.abs(p).toFixed(0)}% к прошлому мес.`,
    up: p >= 0,
  };
}

export function KPICards({ data }: { data: Analytics }) {
  const cur = data;
  const fmt = (n: number) => formatCurrency(n, cur.currency);
  const revTrend = trendPct(cur.revenue.total, cur.revenue.prevTotal);
  const expTrend = trendPct(cur.expenses.total, cur.expenses.prevTotal);
  const profitTrend = trendPct(cur.profit.net, cur.profit.prevNet);

  const cards = [
    {
      label: "Total Revenue",
      value: fmt(cur.revenue.total),
      sub: revTrend.text,
      subUp: revTrend.up,
      border: "border-l-[var(--accent-success)]",
      icon: Wallet,
    },
    {
      label: "Total Expenses",
      value: fmt(cur.expenses.total),
      sub: expTrend.text,
      subUp: !expTrend.up,
      border: "border-l-[var(--accent-danger)]",
      icon: TrendingDown,
    },
    {
      label: "Net Profit",
      value: fmt(cur.profit.net),
      sub: profitTrend.text,
      subUp: cur.profit.net >= 0,
      border:
        cur.profit.net >= 0
          ? "border-l-[var(--accent-success)]"
          : "border-l-[var(--accent-danger)]",
      icon: TrendingUp,
    },
    {
      label: "Profit Margin",
      value: formatPercent(cur.profit.margin, 1),
      sub: "от выручки за месяц",
      subUp: cur.profit.margin >= 0,
      border: "border-l-[var(--accent-primary)]",
      icon: Percent,
    },
    {
      label: "Break-Even",
      value:
        cur.breakEven.revenueNeeded > 0
          ? fmt(cur.breakEven.revenueNeeded)
          : "0",
      sub:
        cur.breakEven.dealsNeeded != null && cur.breakEven.revenueNeeded > 0
          ? `ещё ~${cur.breakEven.dealsNeeded} сделок (ср. чек)`
          : cur.breakEven.revenueNeeded > 0
            ? "добавьте доходы для нуля"
            : "в зоне безубыточности",
      subUp: cur.breakEven.revenueNeeded <= 0,
      border: "border-l-[var(--accent-warning)]",
      icon: Scale,
    },
    {
      label: "Target Progress",
      value:
        cur.monthly_revenue_target > 0
          ? formatPercent(cur.breakEven.currentProgress * 100, 0)
          : "—",
      sub:
        cur.monthly_revenue_target > 0
          ? `осталось ${fmt(cur.breakEven.revenueNeededForTarget)}`
          : "задайте цель в настройках",
      subUp: true,
      border: "border-l-[var(--accent-info)]",
      icon: Target,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className={`border-l-4 ${c.border} p-5`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[var(--text-secondary)]">{c.label}</p>
                  <p className="mt-2 font-mono-data text-2xl font-semibold text-[var(--text-primary)]">
                    {c.value}
                  </p>
                  <p
                    className={`mt-1 flex items-center gap-1 text-xs ${
                      c.subUp ? "text-[var(--accent-success)]" : "text-[var(--accent-danger)]"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {c.sub}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
