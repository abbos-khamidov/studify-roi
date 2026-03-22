"use client";

import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { CEOHint } from "@/components/ui/CEOHint";
import { asNumber, formatCurrency } from "@/lib/format";

type Cat = { id: number; name: string; color: string; total: number };

export function IncomeBarChart({
  income,
  currency,
}: {
  income: Cat[];
  currency: string;
}) {
  const data = income.filter((e) => asNumber(e.total) > 0);
  if (data.length === 0) {
    return (
      <Card className="p-5">
        <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">
          Источники дохода
        </h3>
        <p className="mt-8 text-center text-sm text-[var(--text-muted)]">Нет доходов за месяц</p>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-5">
        <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">
          Источники дохода
        </h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">По категориям за текущий месяц</p>
        <CEOHint>
          Каждый столбец — сумма доходных транзакций в выбранной категории. Помогает увидеть, какая линия
          бизнеса даёт основную выручку.
        </CEOHint>
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="name"
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
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
              <Bar dataKey="total" radius={[8, 8, 0, 0]} fill="var(--accent-primary)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  );
}
