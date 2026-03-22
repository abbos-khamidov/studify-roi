"use client";

import { useCallback, useEffect, useState } from "react";
import { useCurrency } from "@/components/currency-provider";
import { FixedCostsPanel } from "@/components/transactions/FixedCostsPanel";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionTable } from "@/components/transactions/TransactionTable";

type Cat = { id: number; name: string; type: string };

export default function TransactionsPage() {
  const { currency } = useCurrency();
  const [tab, setTab] = useState<"income" | "expense">("income");
  const [categories, setCategories] = useState<Cat[]>([]);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => setCategories([]));
  }, [tick]);

  const expenseCats = categories.filter((c) => c.type === "expense");

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">
          Транзакции
        </h2>
        <p className="mt-1 text-[var(--text-secondary)]">Ввод доходов и расходов</p>
      </div>

      <div className="flex gap-2">
        {(["income", "expense"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-pill px-5 py-2 text-sm font-medium ${
              tab === t
                ? "bg-[var(--accent-primary)] text-white"
                : "border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
            }`}
          >
            {t === "income" ? "Доходы" : "Расходы"}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
        <TransactionForm
          categories={categories}
          defaultType={tab}
          onCreated={reload}
        />
        <aside className="rounded-card border border-[var(--border)] bg-[var(--bg-secondary)] p-5 text-sm text-[var(--text-secondary)]">
          <h3 className="font-display font-semibold text-[var(--text-primary)]">Как пользоваться</h3>
          <ul className="mt-3 list-inside list-disc space-y-2">
            <li>Вкладки «Доходы» и «Расходы» переключают тип операции и список категорий.</li>
            <li>Категории настраиваются в разделе «Категории» (отдельно для дохода и расхода).</li>
            <li>Ниже — таблица всех проводок; фиксированные расходы (аренда и т.д.) — в отдельном блоке.</li>
          </ul>
        </aside>
      </div>

      <p className="text-sm text-[var(--text-muted)]">
        В таблице ниже показаны только операции выбранной вкладки («Доходы» или «Расходы»), не все сразу.
      </p>
      <TransactionTable currency={currency} categories={categories} tabType={tab} key={`${tab}-${tick}`} />

      <FixedCostsPanel currency={currency} expenseCategories={expenseCats} />
    </div>
  );
}
