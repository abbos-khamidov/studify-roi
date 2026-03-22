"use client";

import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { CEOHint } from "@/components/ui/CEOHint";
import { formatCurrency } from "@/lib/format";

type TrendPoint = {
  month: string;
  label: string;
  expenses: number;
  variableExpenses?: number;
};

export function ExpenseStructureChart({
  trend,
  fixedMonthlyEquivalent,
  currency,
}: {
  trend: TrendPoint[];
  fixedMonthlyEquivalent: number;
  currency: string;
}) {
  const fixedProp = Math.max(0, Number(fixedMonthlyEquivalent) || 0);
  const data = trend.map((d) => {
    const total = Math.max(0, Number(d.expenses) || 0);
    const varTx =
      d.variableExpenses != null && Number.isFinite(Number(d.variableExpenses))
        ? Math.max(0, Number(d.variableExpenses))
        : null;
    let fixed: number;
    let variable: number;
    if (fixedProp > 0) {
      fixed = fixedProp;
      variable = Math.max(0, total - fixedProp);
    } else if (varTx !== null) {
      variable = varTx;
      fixed = Math.max(0, total - varTx);
    } else {
      fixed = 0;
      variable = total;
    }
    return {
      short: d.label,
      fixed,
      variable,
    };
  });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-5">
        <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">
          Структура расходов по месяцам
        </h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Фикс (одинаковый слой) + переменные из транзакций</p>
        <CEOHint>
          Нижний слой — все фиксированные расходы, приведённые к месяцу (квартал ÷3, год ÷12). Верхний —
          расходы по категориям за месяц. Если переменных не было, столбик = только фикс.
        </CEOHint>
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="short" tick={{ fill: "var(--text-muted)", fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={60} />
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
              <Legend />
              <Bar dataKey="fixed" name="Фикс (мес.)" stackId="exp" fill="var(--accent-danger)" radius={[0, 0, 0, 0]} />
              <Bar
                dataKey="variable"
                name="Переменные"
                stackId="exp"
                fill="var(--accent-warning)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  );
}
