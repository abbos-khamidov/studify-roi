"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { CEOHint } from "@/components/ui/CEOHint";
import { Slider } from "@/components/ui/Slider";
import { formatCurrency, formatPercent } from "@/lib/format";

type RangePreset = {
  dealDefault: number;
  dealMin: number;
  dealMax: number;
  dealStep: number;
  dealsMax: number;
};

function rangeForCurrency(currency: string): RangePreset {
  if (currency === "EUR") {
    return {
      dealDefault: 2000,
      dealMin: 50,
      dealMax: 80_000,
      dealStep: 50,
      dealsMax: 150,
    };
  }
  return {
    dealDefault: 5_000_000,
    dealMin: 100_000,
    dealMax: 200_000_000,
    dealStep: 500_000,
    dealsMax: 200,
  };
}

export function ROICalculator({
  totalMonthlyExpenses,
  fixedMonthlyEquivalent,
  variableExpensesThisMonth,
  currency,
}: {
  /** Полные расходы текущего месяца: переменные + фикс (в мес. эквиваленте). */
  totalMonthlyExpenses: number;
  fixedMonthlyEquivalent: number;
  variableExpensesThisMonth: number;
  currency: string;
}) {
  const preset = useMemo(() => rangeForCurrency(currency), [currency]);
  const [dealValue, setDealValue] = useState(preset.dealDefault);
  const [dealsPerMonth, setDealsPerMonth] = useState(10);
  const [targetMargin, setTargetMargin] = useState(30);

  useEffect(() => {
    const p = rangeForCurrency(currency);
    setDealValue(p.dealDefault);
    setDealsPerMonth(10);
    setTargetMargin(30);
  }, [currency]);

  const operatingCosts = totalMonthlyExpenses;
  const monthlyRevenue = dealValue * dealsPerMonth;
  const monthlyProfit = monthlyRevenue - operatingCosts;
  const actualMargin = monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0;
  const dealsForBreakeven =
    dealValue > 0 ? Math.ceil(operatingCosts / dealValue) : 0;
  const denom = 1 - targetMargin / 100;
  const revenueForTargetMargin =
    denom > 0 && denom < 1 ? operatingCosts / denom : null;

  const fmt = (n: number) => formatCurrency(n, currency);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-5">
        <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">
          Калькулятор ROI (сценарий)
        </h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Считаем «что если» по среднему чеку и числу сделок. База расходов — факт за текущий месяц.
        </p>
        <CEOHint>
          Раньше подставлялись только фиксированные расходы, из‑за этого при больших переменных расходах
          картина была искажена. Сейчас в формулу входят все расходы месяца (фикс + переменные по
          транзакциям). Для сумов слайдер чека масштабирован под крупные суммы; крупные значения показываются
          в компактном виде (млн).
        </CEOHint>
        <div className="mt-4 rounded-xl bg-[var(--bg-tertiary)] p-4 text-sm text-[var(--text-secondary)]">
          <p>
            Расходы месяца (база):{" "}
            <span className="font-mono-data font-semibold text-[var(--text-primary)]">
              {fmt(operatingCosts)}
            </span>
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            из них фикс (мес. эквив.): {fmt(fixedMonthlyEquivalent)} · переменные:{" "}
            {fmt(variableExpensesThisMonth)}
          </p>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Slider
              label="Средний чек (сделка)"
              min={preset.dealMin}
              max={preset.dealMax}
              step={preset.dealStep}
              value={Math.min(preset.dealMax, Math.max(preset.dealMin, dealValue))}
              onChange={setDealValue}
              format={(v) => fmt(v)}
            />
            <Slider
              label="Сделок в месяц"
              min={1}
              max={preset.dealsMax}
              step={1}
              value={Math.min(preset.dealsMax, Math.max(1, dealsPerMonth))}
              onChange={setDealsPerMonth}
            />
            <Slider
              label="Целевая маржа прибыли"
              min={0}
              max={80}
              step={1}
              value={targetMargin}
              onChange={setTargetMargin}
              format={(v) => formatPercent(v, 0)}
            />
          </div>
          <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--accent-primary-light)]/40 p-5 dark:bg-[var(--accent-primary-light)]/20">
            <Row label="Выручка в месяц (сценарий)" value={fmt(monthlyRevenue)} />
            <Row label="Прибыль в месяц" value={fmt(monthlyProfit)} highlight={monthlyProfit >= 0} />
            <Row label="Фактическая маржа" value={formatPercent(actualMargin, 1)} />
            <Row label="Сделок до безубыточности" value={String(dealsForBreakeven)} />
            <Row
              label="Выручка для целевой маржи"
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
