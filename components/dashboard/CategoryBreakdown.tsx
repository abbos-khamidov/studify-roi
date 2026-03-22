"use client";

import { motion } from "framer-motion";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";

type Cat = { id: number; name: string; color: string; total: number };

export function CategoryBreakdown({
  expenses,
  currency,
}: {
  expenses: Cat[];
  currency: string;
}) {
  const data = expenses.filter((e) => e.total > 0);
  if (data.length === 0) {
    return (
      <Card className="p-5">
        <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">
          Expense Breakdown
        </h3>
        <p className="mt-8 text-center text-sm text-[var(--text-muted)]">Нет расходов за период</p>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-5">
        <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">
          Expense Breakdown
        </h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">По категориям (текущий месяц)</p>
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
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
        <ul className="mt-2 space-y-1 text-sm text-[var(--text-secondary)]">
          {data.map((d) => (
            <li key={d.id} className="flex justify-between gap-2">
              <span className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
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
      </Card>
    </motion.div>
  );
}
