"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Slider } from "@/components/ui/Slider";
import { formatCurrency, formatPercent } from "@/lib/format";

export function ROICalculator({
  operatingCosts,
  currency,
}: {
  operatingCosts: number;
  currency: string;
}) {
  const [dealValue, setDealValue] = useState(2500);
  const [dealsPerMonth, setDealsPerMonth] = useState(10);
  const [targetMargin, setTargetMargin] = useState(30);

  const monthlyRevenue = dealValue * dealsPerMonth;
  const monthlyProfit = monthlyRevenue - operatingCosts;
  const actualMargin = monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0;
  const dealsForBreakeven =
    dealValue > 0 ? Math.ceil(operatingCosts / dealValue) : 0;
  const denom = 1 - targetMargin / 100;
  const revenueForTargetMargin =
    denom > 0 && denom < 1 ? operatingCosts / denom : null;

  const fmt = (n: number) => formatCurrency(n, currency);

  const sliders = useMemo(
    () => ({
      dealValue: { min: 100, max: 50000, step: 100 },
      deals: { min: 1, max: 100, step: 1 },
      margin: { min: 0, max: 80, step: 1 },
    }),
    []
  );

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-5">
        <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">
          ROI Calculator
        </h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Операционные расходы подставлены из фиксированных затрат (месячный эквивалент)
        </p>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Slider
              label="Average deal value"
              min={sliders.dealValue.min}
              max={sliders.dealValue.max}
              step={sliders.dealValue.step}
              value={dealValue}
              onChange={setDealValue}
              format={(v) => fmt(v)}
            />
            <Slider
              label="Deals per month"
              min={sliders.deals.min}
              max={sliders.deals.max}
              step={sliders.deals.step}
              value={dealsPerMonth}
              onChange={setDealsPerMonth}
            />
            <Slider
              label="Target profit margin"
              min={sliders.margin.min}
              max={sliders.margin.max}
              step={sliders.margin.step}
              value={targetMargin}
              onChange={setTargetMargin}
              format={(v) => formatPercent(v, 0)}
            />
            <div className="rounded-xl bg-[var(--bg-tertiary)] p-4 text-sm text-[var(--text-secondary)]">
              <p>
                Operating costs / month:{" "}
                <span className="font-mono-data text-[var(--text-primary)]">
                  {fmt(operatingCosts)}
                </span>
              </p>
            </div>
          </div>
          <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--accent-primary-light)]/40 p-5 dark:bg-[var(--accent-primary-light)]/20">
            <Row label="Monthly Revenue" value={fmt(monthlyRevenue)} />
            <Row label="Monthly Profit" value={fmt(monthlyProfit)} highlight={monthlyProfit >= 0} />
            <Row label="Actual Margin" value={formatPercent(actualMargin, 1)} />
            <Row label="Deals for Break-Even" value={String(dealsForBreakeven)} />
            <Row
              label="Revenue for Target Margin"
              value={revenueForTargetMargin != null ? fmt(revenueForTargetMargin) : "—"}
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span
        className={`font-mono-data font-semibold ${
          highlight === true
            ? "text-[var(--accent-success)]"
            : highlight === false
              ? "text-[var(--accent-danger)]"
              : "text-[var(--text-primary)]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
