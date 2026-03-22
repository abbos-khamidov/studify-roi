"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useCurrency } from "@/components/currency-provider";
import { FINANCE_DATA_CHANGED_EVENT } from "@/lib/finance-invalidate";
import { BreakEvenPanel } from "@/components/dashboard/BreakEvenPanel";
import { CategoryPieToggle } from "@/components/dashboard/CategoryPieToggle";
import { ExpenseStructureChart } from "@/components/dashboard/ExpenseStructureChart";
import { KPICards } from "@/components/dashboard/KPICards";
import { ProfitChart } from "@/components/dashboard/ProfitChart";
import { RevenueVsTargetChart } from "@/components/dashboard/RevenueVsTargetChart";
import { ROICalculator } from "@/components/dashboard/ROICalculator";
import { Card } from "@/components/ui/Card";

type Analytics = Awaited<ReturnType<typeof import("@/lib/queries").getAnalytics>>;

export function DashboardClient() {
  const { currency } = useCurrency();
  const router = useRouter();
  const [data, setData] = useState<Analytics | null>(null);
  const [cats, setCats] = useState<{ length: number }>({ length: 0 });
  const [fixedN, setFixedN] = useState(0);
  const [hasKey, setHasKey] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);
  const lastLoadedAt = useRef(0);

  const loadDashboard = useCallback(async () => {
    setErr(null);
    const opts: RequestInit = { cache: "no-store" };
    const t = Date.now();
    try {
      const [aRes, cRes, fRes, sRes] = await Promise.all([
        fetch(`/api/analytics?_t=${t}`, opts),
        fetch(`/api/categories?_t=${t}`, opts),
        fetch(`/api/fixed-costs?_t=${t}`, opts),
        fetch(`/api/settings?_t=${t}`, opts),
      ]);
      const [a, c, f, s] = await Promise.all([
        aRes.json(),
        cRes.json(),
        fRes.json(),
        sRes.json(),
      ]);
      if (a.error) setErr(a.error);
      else {
        setData(a);
        hasLoadedOnce.current = true;
        lastLoadedAt.current = Date.now();
      }
      setCats({ length: Array.isArray(c) ? c.length : 0 });
      if (!a.error && a.expenses && typeof a.expenses.activeFixedCount === "number") {
        setFixedN(Math.max(0, Math.floor(Number(a.expenses.activeFixedCount))));
      } else {
        setFixedN(Array.isArray(f) ? f.length : 0);
      }
      setHasKey(Boolean(s.has_openai_key));
    } catch {
      if (!hasLoadedOnce.current) setErr("Не удалось загрузить данные");
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [currency, loadDashboard]);

  useEffect(() => {
    const onInvalidate = () => {
      router.refresh();
      void loadDashboard();
    };
    window.addEventListener(FINANCE_DATA_CHANGED_EVENT, onInvalidate);

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) void loadDashboard();
    };
    window.addEventListener("pageshow", onPageShow);

    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - lastLoadedAt.current > 10_000) {
        void loadDashboard();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener(FINANCE_DATA_CHANGED_EVENT, onInvalidate);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadDashboard, router]);

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
              <p className="font-display font-semibold text-[var(--text-primary)]">Добавьте категории</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Отдельно доходы и расходы — на странице «Категории».
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
              <p className="font-display font-semibold text-[var(--text-primary)]">Фиксированные расходы</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Аренда, зарплаты, подписки — в разделе «Операции».
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
              <p className="font-display font-semibold text-[var(--text-primary)]">Ключ OpenAI</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Для ответов AI-аналитика в левом меню.
              </p>
              <Link
                href="/settings"
                className="mt-3 inline-block rounded-pill bg-[var(--accent-primary)] px-4 py-2 text-sm text-white"
              >
                Настройки
              </Link>
            </Card>
          )}
        </motion.div>
      )}

      <KPICards data={data} />

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

      <CategoryPieToggle
        expenses={data.expenses.byCategory}
        income={data.revenue.byCategory}
        fixedMonthlyEquivalent={data.expenses.fixedTotal}
        currency={data.currency}
      />

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
  );
}
