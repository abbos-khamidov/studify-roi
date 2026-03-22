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

  const metrics = [
    { label: "Выручка (сценарий)", value: fmt(monthlyRevenue) },
    { label: "Прибыль", value: fmt(monthlyProfit), highlight: monthlyProfit >= 0 ? true : false },
    { label: "Маржа", value: formatPercent(actualMargin, 1) },
    { label: "Сделок до безубытка", value: String(dealsForBreakeven) },
    {
      label: "Выручка под целевую маржу",
      value: revenueForTargetMargin != null ? fmt(revenueForTargetMargin) : "—",
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-6 md:p-8">
        <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">
          Калькулятор ROI (сценарий)
        </h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Полная ширина: подстройте средний чек и число сделок. База расходов — факт за текущий месяц.
        </p>
        <CEOHint>
          В расчёт входят все расходы месяца (фикс в месячном эквиваленте + переменные транзакции). Крупные суммы
          в сумах показываются компактно (млн).
        </CEOHint>

        <div className="mt-5 rounded-xl bg-[var(--bg-tertiary)] p-4 text-sm text-[var(--text-secondary)]">
          <p>
            Расходы месяца (база):{" "}
            <span className="font-mono-data font-semibold text-[var(--text-primary)]">
              {fmt(operatingCosts)}
            </span>
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            фикс (мес.): {fmt(fixedMonthlyEquivalent)} · переменные: {fmt(variableExpensesThisMonth)}
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
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
            label="Целевая маржа"
            min={0}
            max={80}
            step={1}
            value={targetMargin}
            onChange={setTargetMargin}
            format={(v) => formatPercent(v, 0)}
          />
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-xl border border-[var(--border)] bg-[var(--accent-primary-light)]/30 p-4 dark:bg-[var(--accent-primary-light)]/10"
            >
              <p className="text-xs text-[var(--text-secondary)]">{m.label}</p>
              <p
                className={`mt-2 font-mono-data text-lg font-semibold ${
                  m.highlight === true
                    ? "text-[var(--accent-success)]"
                    : m.highlight === false
                      ? "text-[var(--accent-danger)]"
                      : "text-[var(--text-primary)]"
                }`}
              >
                {m.value}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
