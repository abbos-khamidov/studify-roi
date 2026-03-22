"use client";

import { motion } from "framer-motion";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";

type Point = { month: string; label: string; revenue: number; expenses: number; profit: number };

export function ProfitChart({
  data,
  currency,
}: {
  data: Point[];
  currency: string;
}) {
  const chartData = data.map((d) => ({
    ...d,
    short: d.label,
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-5">
        <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">
          Revenue vs Expenses
        </h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Последние 12 месяцев</p>
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="short" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                }}
                formatter={(value, name) => [
                  typeof value === "number" ? formatCurrency(value, currency) : String(value ?? ""),
                  name === "revenue" ? "Доход" : name === "expenses" ? "Расходы" : String(name),
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Доход"
                stroke="var(--accent-success)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                name="Расходы"
                stroke="var(--accent-danger)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  );
}
