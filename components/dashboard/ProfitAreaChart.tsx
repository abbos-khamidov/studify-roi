"use client";

import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";

type Point = { month: string; label: string; profit: number };

export function ProfitAreaChart({
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
          Profit Trend
        </h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Зона прибыли / убытка</p>
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-success)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--accent-danger)" stopOpacity={0.15} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="short" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
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
              <Area
                type="monotone"
                dataKey="profit"
                name="Прибыль"
                stroke="var(--accent-primary)"
                fill="url(#profitFill)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  );
}
