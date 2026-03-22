"use client";

import { useState } from "react";
import { useCurrency } from "@/components/currency-provider";
import { CategoryForm } from "@/components/categories/CategoryForm";
import { CategoryList } from "@/components/categories/CategoryList";

export default function CategoriesPage() {
  const { currency } = useCurrency();
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">Категории</h2>
        <p className="mt-1 text-[var(--text-secondary)]">
          Слева — только <strong className="text-[var(--accent-success)]">доходы</strong>, справа — только{" "}
          <strong className="text-[var(--accent-danger)]">расходы</strong>. «Скрыть» убирает категорию из выбора;
          «Удалить» стирает её из базы (транзакции останутся без привязки к категории).
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 md:items-stretch">
        <CategoryForm type="income" onDone={() => setRefreshKey((k) => k + 1)} />
        <CategoryForm type="expense" onDone={() => setRefreshKey((k) => k + 1)} />
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Все"],
            ["income", "Только доходы"],
            ["expense", "Только расходы"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setFilter(v)}
            className={`rounded-pill px-4 py-2 text-sm font-medium ${
              filter === v
                ? "bg-[var(--accent-primary)] text-white"
                : "border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <CategoryList filter={filter} currency={currency} refreshKey={refreshKey} />
    </div>
  );
}
