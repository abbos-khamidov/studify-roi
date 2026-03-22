"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/Card";
import { CEOHint } from "@/components/ui/CEOHint";
import { asNumber, formatCurrency } from "@/lib/format";

type Cat = { id: number; name: string; color: string; total: number };

export function CategoryPieToggle({
  expenses,
  income,
  currency,
}: {
  expenses: Cat[];
  income: Cat[];
  currency: string;
}) {
  const [mode, setMode] = useState<"expense" | "income">("expense");
  const raw = mode === "expense" ? expenses : income;
  const data = raw.filter((e) => asNumber(e.total) > 0);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">
              Структура по категориям
            </h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Текущий месяц</p>
            <CEOHint>
              Переключите «Расходы» / «Доходы», чтобы на одном графике смотреть доли категорий. Суммы только из
              транзакций (фиксированные расходы здесь не делятся по категориям).
            </CEOHint>
          </div>
          <div
            className="flex shrink-0 gap-1 rounded-pill border border-[var(--border)] bg-[var(--bg-tertiary)] p-1"
            role="group"
            aria-label="Тип категорий"
          >
            <button
              type="button"
              onClick={() => setMode("expense")}
              className={`rounded-pill px-4 py-2 text-sm font-medium transition ${
                mode === "expense"
                  ? "bg-[var(--accent-danger)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Расходы
            </button>
            <button
              type="button"
              onClick={() => setMode("income")}
              className={`rounded-pill px-4 py-2 text-sm font-medium transition ${
                mode === "income"
                  ? "bg-[var(--accent-success)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Доходы
            </button>
          </div>
        </div>

        {data.length === 0 ? (
          <p className="mt-8 text-center text-sm text-[var(--text-muted)]">
            {mode === "expense"
              ? "Нет переменных расходов за месяц"
              : "Нет доходов за месяц"}
          </p>
        ) : (
          <div className="mx-auto mt-6 grid max-w-3xl gap-8 lg:grid-cols-2 lg:items-center">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={96}
                    paddingAngle={2}
                  >
                    {data.map((entry) => (
                      <Cell key={entry.id} fill={entry.color || "var(--accent-primary)"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                    }}
                    formatter={(value) =>
                      typeof value === "number" ? formatCurrency(value, currency) : String(value ?? "")
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              {data.map((d) => (
                <li key={d.id} className="flex justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: d.color || "var(--accent-primary)" }}
                    />
                    {d.name}
                  </span>
                  <span className="font-mono-data text-[var(--text-primary)]">
                    {formatCurrency(d.total, currency)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
