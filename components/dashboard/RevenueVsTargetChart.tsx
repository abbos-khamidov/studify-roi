"use client";

import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { CEOHint } from "@/components/ui/CEOHint";
import { formatCurrency } from "@/lib/format";

type MonthRev = { month: string; total: number };
type TrendPoint = { month: string; label: string };

export function RevenueVsTargetChart({
  revenueByMonth,
  trendLabels,
  monthlyTarget,
  currency,
}: {
  revenueByMonth: MonthRev[];
  trendLabels: TrendPoint[];
  monthlyTarget: number;
  currency: string;
}) {
  const labelByMonth = new Map(trendLabels.map((t) => [t.month, t.label]));
  const data = revenueByMonth.map((r) => ({
    short: labelByMonth.get(r.month) ?? r.month,
    revenue: r.total,
  }));

  const showTarget = monthlyTarget > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-5">
        <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">
          Выручка и цель
        </h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Факт по месяцам и линия месячной цели из настроек
        </p>
        <CEOHint>
          Столбцы — доходы из транзакций. Красная линия — план выручки на месяц. Если цель не задана в
          настройках, линия скрыта.
        </CEOHint>
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="short" tick={{ fill: "var(--text-muted)", fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={60} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
              {showTarget && (
                <ReferenceLine
                  y={monthlyTarget}
                  stroke="var(--accent-danger)"
                  strokeDasharray="6 4"
                  label={{ value: "Цель", fill: "var(--text-muted)", fontSize: 11 }}
                />
              )}
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
              <Legend />
              <Bar dataKey="revenue" name="Выручка" fill="var(--accent-success)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  );
}
