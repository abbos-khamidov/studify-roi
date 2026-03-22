"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useCurrency } from "@/components/currency-provider";
import { AIChat } from "@/components/dashboard/AIChat";
import { BreakEvenPanel } from "@/components/dashboard/BreakEvenPanel";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { ExpenseStructureChart } from "@/components/dashboard/ExpenseStructureChart";
import { IncomeBarChart } from "@/components/dashboard/IncomeBarChart";
import { KPICards } from "@/components/dashboard/KPICards";
import { ProfitChart } from "@/components/dashboard/ProfitChart";
import { RevenueVsTargetChart } from "@/components/dashboard/RevenueVsTargetChart";
import { ROICalculator } from "@/components/dashboard/ROICalculator";
import { Card } from "@/components/ui/Card";

type Analytics = Awaited<ReturnType<typeof import("@/lib/queries").getAnalytics>>;

export function DashboardClient() {
  const { currency } = useCurrency();
  const [data, setData] = useState<Analytics | null>(null);
  const [cats, setCats] = useState<{ length: number }>({ length: 0 });
  const [fixedN, setFixedN] = useState(0);
  const [hasKey, setHasKey] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setErr(null);
    Promise.all([
      fetch("/api/analytics").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/fixed-costs").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ])
      .then(([a, c, f, s]) => {
        if (a.error) setErr(a.error);
        else setData(a);
        setCats({ length: Array.isArray(c) ? c.length : 0 });
        setFixedN(Array.isArray(f) ? f.length : 0);
        setHasKey(Boolean(s.has_openai_key));
      })
      .catch(() => setErr("Не удалось загрузить данные"));
  }, [currency]);

  if (err || !data) {
    return (
      <div className="text-center text-[var(--text-secondary)]">
        {err || "Загрузка…"}
      </div>
    );
  }

  const showOnboarding = cats.length === 0 || fixedN === 0 || !hasKey;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {showOnboarding && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 md:grid-cols-3"
        >
          {cats.length === 0 && (
            <Card className="border border-dashed border-[var(--accent-primary)]/40 p-4">
              <p className="font-display font-semibold text-[var(--text-primary)]">
                Добавьте категории
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Категории доходов и расходов для учёта.
              </p>
              <Link
                href="/categories"
                className="mt-3 inline-block rounded-pill bg-[var(--accent-primary)] px-4 py-2 text-sm text-white"
              >
                Перейти
              </Link>
            </Card>
          )}
          {fixedN === 0 && (
            <Card className="border border-dashed border-[var(--accent-primary)]/40 p-4">
              <p className="font-display font-semibold text-[var(--text-primary)]">
                Внесите фиксированные расходы
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Аренда, зарплаты, подписки — на странице «Транзакции».
              </p>
              <Link
                href="/transactions"
                className="mt-3 inline-block rounded-pill bg-[var(--accent-primary)] px-4 py-2 text-sm text-white"
              >
                Перейти
              </Link>
            </Card>
          )}
          {!hasKey && (
            <Card className="border border-dashed border-[var(--accent-primary)]/40 p-4">
              <p className="font-display font-semibold text-[var(--text-primary)]">
                Настройте AI-аналитик
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Добавьте ключ OpenAI для чата.
              </p>
              <Link
                href="/settings"
                className="mt-3 inline-block rounded-pill bg-[var(--accent-primary)] px-4 py-2 text-sm text-white"
              >
                Перейти
              </Link>
            </Card>
          )}
        </motion.div>
      )}

      <KPICards data={data} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="grid gap-6 lg:grid-cols-2">
            <ExpenseStructureChart
              trend={data.profit.trend}
              fixedMonthlyEquivalent={data.expenses.fixedTotal}
              currency={data.currency}
            />
            <RevenueVsTargetChart
              revenueByMonth={data.revenue.byMonth}
              trendLabels={data.profit.trend.map(({ month, label }) => ({ month, label }))}
              monthlyTarget={data.monthly_revenue_target}
              currency={data.currency}
            />
          </div>

          <ProfitChart data={data.profit.trend} currency={data.currency} />

          <div className="grid gap-6 lg:grid-cols-2">
            <CategoryBreakdown expenses={data.expenses.byCategory} currency={data.currency} />
            <IncomeBarChart income={data.revenue.byCategory} currency={data.currency} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <BreakEvenPanel
              currentProgress={data.breakEven.currentProgress}
              target={data.monthly_revenue_target}
              revenue={data.revenue.total}
              currency={data.currency}
            />
            <ROICalculator
              totalMonthlyExpenses={data.expenses.total}
              fixedMonthlyEquivalent={data.expenses.fixedTotal}
              variableExpensesThisMonth={data.expenses.variable}
              currency={data.currency}
            />
          </div>
        </div>
        <div className="xl:col-span-1">
          <AIChat />
        </div>
      </div>
    </div>
  );
}
