import {
  eachMonthOfInterval,
  endOfMonth,
  format,
  startOfMonth,
  subMonths,
} from "date-fns";
import { sql } from "./db";

export type Settings = {
  id: number;
  openai_key: string;
  currency: string;
  company_name: string;
  monthly_revenue_target: number;
  created_at: string;
  updated_at: string;
};

export type CategoryRow = {
  id: number;
  name: string;
  type: "income" | "expense";
  color: string;
  icon: string;
  is_active: number;
  created_at: string;
};

export type TransactionRow = {
  id: number;
  type: "income" | "expense";
  amount: number;
  description: string | null;
  category_id: number | null;
  date: string;
  is_recurring: number;
  created_at: string;
};

export type FixedCostRow = {
  id: number;
  name: string;
  amount: number;
  category_id: number | null;
  frequency: "monthly" | "quarterly" | "yearly";
  is_active: number;
  created_at: string;
};

function normalizeCell(v: unknown): unknown {
  if (typeof v === "bigint") {
    const n = Number(v);
    return Number.isSafeInteger(n) ? n : v.toString();
  }
  return v;
}

function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    obj[k] = normalizeCell(v);
  }
  return obj;
}

function mapRows<T>(rows: Record<string, unknown>[]): T[] {
  return rows.map((row) => normalizeRow(row) as unknown as T);
}

function mapRow<T>(rows: Record<string, unknown>[]): T | undefined {
  if (rows.length === 0) return undefined;
  return normalizeRow(rows[0]) as unknown as T;
}

function monthlyEquivalent(amount: number, frequency: string): number {
  if (frequency === "quarterly") return amount / 3;
  if (frequency === "yearly") return amount / 12;
  return amount;
}

export async function getFixedCostsMonthlyTotal(): Promise<number> {
  /** Сумма в SQL: надёжнее чем JS (NUMERIC/string), is_active <> 0 — совместимо с PG smallint/boolean */
  const rows = await sql.query(
    `SELECT COALESCE(SUM(
        CASE TRIM(LOWER(frequency::text))
          WHEN 'quarterly' THEN amount::numeric / 3
          WHEN 'yearly' THEN amount::numeric / 12
          ELSE amount::numeric
        END
      ), 0)::float8 AS total
     FROM fixed_costs
     WHERE COALESCE(is_active, 0)::int <> 0`,
    []
  );
  const row = mapRow<{ total: unknown }>(rows as Record<string, unknown>[]);
  const n = Number(row?.total ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export async function getSettings(): Promise<Settings> {
  const rows = await sql.query(`SELECT * FROM settings WHERE id = 1`, []);
  return mapRow<Settings>(rows as Record<string, unknown>[])!;
}

export async function updateSettings(
  partial: Partial<{
    openai_key: string;
    currency: string;
    company_name: string;
    monthly_revenue_target: number;
  }>
): Promise<Settings> {
  const cur = await getSettings();
  const next = { ...cur, ...partial, updated_at: new Date().toISOString() };
  await sql.query(
    `UPDATE settings SET
      openai_key = $1,
      currency = $2,
      company_name = $3,
      monthly_revenue_target = $4,
      updated_at = $5
    WHERE id = 1`,
    [
      next.openai_key,
      next.currency,
      next.company_name,
      next.monthly_revenue_target,
      next.updated_at,
    ]
  );
  return getSettings();
}

export async function resetAllData(): Promise<void> {
  await sql.query(`DELETE FROM transactions`, []);
  await sql.query(`DELETE FROM fixed_costs`, []);
  await sql.query(`DELETE FROM categories`, []);
  await sql.query(
    `UPDATE settings SET openai_key = '', currency = 'UZS', company_name = 'Studify', monthly_revenue_target = 0, updated_at = NOW() WHERE id = 1`,
    []
  );
}

export async function exportAllJson() {
  const settingsRows = await sql.query(`SELECT * FROM settings WHERE id = 1`, []);
  const catRows = await sql.query(`SELECT * FROM categories`, []);
  const txRows = await sql.query(`SELECT * FROM transactions ORDER BY date DESC`, []);
  const fcRows = await sql.query(`SELECT * FROM fixed_costs`, []);
  return {
    settings: mapRow<Settings>(settingsRows as Record<string, unknown>[])!,
    categories: mapRows<CategoryRow>(catRows as Record<string, unknown>[]),
    transactions: mapRows<TransactionRow>(txRows as Record<string, unknown>[]),
    fixed_costs: mapRows<FixedCostRow>(fcRows as Record<string, unknown>[]),
    exported_at: new Date().toISOString(),
  };
}

export async function listCategories(filters?: {
  type?: string;
  includeInactive?: boolean;
}): Promise<CategoryRow[]> {
  let q = `SELECT * FROM categories WHERE 1=1`;
  const args: unknown[] = [];
  let i = 1;
  if (!filters?.includeInactive) {
    q += ` AND is_active = 1`;
  }
  if (filters?.type && (filters.type === "income" || filters.type === "expense")) {
    q += ` AND type = $${i++}`;
    args.push(filters.type);
  }
  q += ` ORDER BY name ASC`;
  const rows = await sql.query(q, args);
  return mapRows<CategoryRow>(rows as Record<string, unknown>[]);
}

export async function getCategory(id: number): Promise<CategoryRow | undefined> {
  const rows = await sql.query(`SELECT * FROM categories WHERE id = $1`, [id]);
  return mapRow<CategoryRow>(rows as Record<string, unknown>[]);
}

export async function createCategory(data: {
  name: string;
  type: "income" | "expense";
  color?: string;
  icon?: string;
}): Promise<CategoryRow> {
  const rows = await sql.query(
    `INSERT INTO categories (name, type, color, icon) VALUES ($1, $2, $3, $4) RETURNING *`,
    [data.name, data.type, data.color ?? "#F97316", data.icon ?? "folder"]
  );
  return mapRow<CategoryRow>(rows as Record<string, unknown>[])!;
}

export async function updateCategory(
  id: number,
  partial: Partial<{
    name: string;
    type: "income" | "expense";
    color: string;
    icon: string;
    is_active: number;
  }>
): Promise<CategoryRow | null> {
  const cur = await getCategory(id);
  if (!cur) return null;
  const next = { ...cur, ...partial };
  await sql.query(
    `UPDATE categories SET name=$1, type=$2, color=$3, icon=$4, is_active=$5 WHERE id=$6`,
    [next.name, next.type, next.color, next.icon, next.is_active, id]
  );
  return getCategory(id) as Promise<CategoryRow>;
}

export async function softDeleteCategory(id: number): Promise<CategoryRow | null> {
  return updateCategory(id, { is_active: 0 });
}

export async function hardDeleteCategory(id: number): Promise<void> {
  await sql.query(`DELETE FROM categories WHERE id = $1`, [id]);
}

export async function listFixedCosts(): Promise<FixedCostRow[]> {
  const rows = await sql.query(`SELECT * FROM fixed_costs ORDER BY name ASC`, []);
  return mapRows<FixedCostRow>(rows as Record<string, unknown>[]);
}

export async function createFixedCost(data: {
  name: string;
  amount: number;
  category_id?: number | null;
  frequency?: "monthly" | "quarterly" | "yearly";
}): Promise<FixedCostRow> {
  const rows = await sql.query(
    `INSERT INTO fixed_costs (name, amount, category_id, frequency) VALUES ($1, $2, $3, $4) RETURNING *`,
    [data.name, data.amount, data.category_id ?? null, data.frequency ?? "monthly"]
  );
  return mapRow<FixedCostRow>(rows as Record<string, unknown>[])!;
}

export async function updateFixedCost(
  id: number,
  partial: Partial<{
    name: string;
    amount: number;
    category_id: number | null;
    frequency: "monthly" | "quarterly" | "yearly";
    is_active: number;
  }>
): Promise<FixedCostRow | null> {
  const curRows = await sql.query(`SELECT * FROM fixed_costs WHERE id = $1`, [id]);
  const cur = mapRow<FixedCostRow>(curRows as Record<string, unknown>[]);
  if (!cur) return null;
  const next = { ...cur, ...partial };
  await sql.query(
    `UPDATE fixed_costs SET name=$1, amount=$2, category_id=$3, frequency=$4, is_active=$5 WHERE id=$6`,
    [next.name, next.amount, next.category_id, next.frequency, next.is_active, id]
  );
  const updated = await sql.query(`SELECT * FROM fixed_costs WHERE id = $1`, [id]);
  return mapRow<FixedCostRow>(updated as Record<string, unknown>[])!;
}

export async function deleteFixedCost(id: number): Promise<void> {
  await sql.query(`DELETE FROM fixed_costs WHERE id = $1`, [id]);
}

const TX_SORT_SQL: Record<string, string> = {
  date: "t.date",
  type: "t.type",
  amount: "t.amount",
  description: "t.description",
  category_id: "t.category_id",
  created_at: "t.created_at",
  category_name: "c.name",
};

export async function listTransactions(params: {
  type?: string;
  category_id?: number;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}) {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const offset = (page - 1) * limit;
  const sortKey = params.sort ?? "date";
  const sort = TX_SORT_SQL[sortKey] ?? TX_SORT_SQL.date;
  const order = params.order === "asc" ? "ASC" : "DESC";

  let where = `WHERE 1=1`;
  const qparams: unknown[] = [];
  let i = 1;
  if (params.type === "income" || params.type === "expense") {
    where += ` AND t.type = $${i++}`;
    qparams.push(params.type);
  }
  if (params.category_id != null) {
    where += ` AND t.category_id = $${i++}`;
    qparams.push(params.category_id);
  }
  if (params.from) {
    where += ` AND t.date >= $${i++}::date`;
    qparams.push(params.from);
  }
  if (params.to) {
    where += ` AND t.date <= $${i++}::date`;
    qparams.push(params.to);
  }

  const countRows = await sql.query(
    `SELECT COUNT(*)::bigint AS c FROM transactions t ${where}`,
    qparams
  );
  const limitPh = `$${i++}`;
  const offsetPh = `$${i++}`;
  const rowsResult = await sql.query(
    `SELECT t.*, c.name AS category_name, c.color AS category_color
          FROM transactions t
          LEFT JOIN categories c ON c.id = t.category_id
          ${where}
          ORDER BY ${sort} ${order}
          LIMIT ${limitPh} OFFSET ${offsetPh}`,
    [...qparams, limit, offset]
  );

  const total = Number(mapRow<{ c: number }>(countRows as Record<string, unknown>[])!.c);
  return {
    items: mapRows(rowsResult as Record<string, unknown>[]),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getTransaction(id: number): Promise<Record<string, unknown> | undefined> {
  const rows = await sql.query(
    `SELECT t.*, c.name AS category_name FROM transactions t
          LEFT JOIN categories c ON c.id = t.category_id WHERE t.id = $1`,
    [id]
  );
  return mapRow<Record<string, unknown>>(rows as Record<string, unknown>[]);
}

export async function createTransaction(data: {
  type: "income" | "expense";
  amount: number;
  description?: string | null;
  category_id?: number | null;
  date: string;
  is_recurring?: number;
}): Promise<Record<string, unknown> | undefined> {
  const inserted = await sql.query(
    `INSERT INTO transactions (type, amount, description, category_id, date, is_recurring)
          VALUES ($1, $2, $3, $4, $5::date, $6) RETURNING id`,
    [
      data.type,
      data.amount,
      data.description ?? null,
      data.category_id ?? null,
      data.date,
      data.is_recurring ?? 0,
    ]
  );
  const id = Number((inserted[0] as Record<string, unknown>).id);
  return getTransaction(id);
}

export async function updateTransaction(
  id: number,
  partial: Partial<{
    type: "income" | "expense";
    amount: number;
    description: string | null;
    category_id: number | null;
    date: string;
    is_recurring: number;
  }>
): Promise<Record<string, unknown> | null> {
  const curRows = await sql.query(`SELECT * FROM transactions WHERE id = $1`, [id]);
  const cur = mapRow<TransactionRow>(curRows as Record<string, unknown>[]);
  if (!cur) return null;
  const next = { ...cur, ...partial };
  await sql.query(
    `UPDATE transactions SET type=$1, amount=$2, description=$3, category_id=$4, date=$5::date, is_recurring=$6 WHERE id=$7`,
    [
      next.type,
      next.amount,
      next.description,
      next.category_id,
      next.date,
      next.is_recurring,
      id,
    ]
  );
  return getTransaction(id) as Promise<Record<string, unknown>>;
}

export async function deleteTransaction(id: number): Promise<void> {
  await sql.query(`DELETE FROM transactions WHERE id = $1`, [id]);
}

async function transactionsTotalsByMonthAndType(
  from: string,
  to: string
): Promise<Map<string, { income: number; expense: number }>> {
  const rows = await sql.query(
    `SELECT to_char(date, 'YYYY-MM') AS month, type, COALESCE(SUM(amount), 0)::numeric AS total
          FROM transactions
          WHERE date >= $1::date AND date <= $2::date
          GROUP BY to_char(date, 'YYYY-MM'), type`,
    [from, to]
  );
  const map = new Map<string, { income: number; expense: number }>();
  for (const row of mapRows<{ month: string; type: string; total: number }>(
    rows as Record<string, unknown>[]
  )) {
    const m = String(row.month);
    if (!map.has(m)) map.set(m, { income: 0, expense: 0 });
    const b = map.get(m)!;
    const t = Number(row.total);
    if (row.type === "income") b.income = t;
    else if (row.type === "expense") b.expense = t;
  }
  return map;
}

async function avgIncomeAmount(from: string, to: string): Promise<number> {
  const rows = await sql.query(
    `SELECT COALESCE(AVG(amount), 0)::numeric AS a, COUNT(*)::bigint AS c FROM transactions WHERE type = 'income' AND date >= $1::date AND date <= $2::date`,
    [from, to]
  );
  const row = mapRow<{ a: number; c: number }>(rows as Record<string, unknown>[])!;
  return Number(row.c) > 0 ? Number(row.a) : 0;
}

async function categoryTotals(
  type: "income" | "expense",
  from: string,
  to: string
): Promise<{ id: number; name: string; color: string; total: number }[]> {
  const rows = await sql.query(
    `SELECT c.id, c.name, c.color, COALESCE(SUM(t.amount), 0)::numeric AS total
          FROM transactions t
          JOIN categories c ON c.id = t.category_id AND c.is_active = 1
          WHERE t.type = $1 AND t.date >= $2::date AND t.date <= $3::date
          GROUP BY c.id, c.name, c.color
          ORDER BY total DESC`,
    [type, from, to]
  );
  return mapRows<{ id: number; name: string; color: string; total: number }>(
    rows as Record<string, unknown>[]
  );
}

export async function getAnalytics() {
  const settings = await getSettings();
  const fixedTotal = await getFixedCostsMonthlyTotal();

  const now = new Date();
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

  const rangeEnd = endOfMonth(now);
  const rangeStart = startOfMonth(subMonths(now, 11));
  const rangeFrom = format(rangeStart, "yyyy-MM-dd");
  const rangeTo = format(rangeEnd, "yyyy-MM-dd");
  const months = eachMonthOfInterval({ start: rangeStart, end: rangeEnd });

  const monthlyTotals = await transactionsTotalsByMonthAndType(rangeFrom, rangeTo);

  const curKey = format(startOfMonth(now), "yyyy-MM");
  const curAgg = monthlyTotals.get(curKey) ?? { income: 0, expense: 0 };
  const revMonth = curAgg.income;
  const expVarMonth = curAgg.expense;

  const prevKey = format(startOfMonth(subMonths(now, 1)), "yyyy-MM");
  const prevAgg = monthlyTotals.get(prevKey) ?? { income: 0, expense: 0 };
  const revPrev = prevAgg.income;
  const expVarPrev = prevAgg.expense;

  const avgDealVal = await avgIncomeAmount(monthStart, monthEnd);
  const incomeCats = await categoryTotals("income", monthStart, monthEnd);
  const expenseCats = await categoryTotals("expense", monthStart, monthEnd);

  const byMonthData = months.map((m) => {
    const key = format(m, "yyyy-MM");
    const agg = monthlyTotals.get(key) ?? { income: 0, expense: 0 };
    const revenue = agg.income;
    const expVar = agg.expense;
    const expenses = expVar + fixedTotal;
    return {
      month: key,
      label: format(m, "MMM yyyy"),
      revenue,
      expenses,
      /** Только транзакции-расходы; для графика структуры (фикс vs переменные) */
      variableExpenses: expVar,
      profit: revenue - expenses,
    };
  });

  const expMonth = expVarMonth + fixedTotal;
  const profitMonth = revMonth - expMonth;
  const marginMonth = revMonth > 0 ? (profitMonth / revMonth) * 100 : 0;

  const expPrev = expVarPrev + fixedTotal;
  const profitPrev = revPrev - expPrev;

  const revenueGap = Math.max(0, expMonth - revMonth);
  const dealsNeededBreakEven =
    avgDealVal > 0 ? Math.ceil(revenueGap / avgDealVal) : revenueGap > 0 ? null : 0;

  const target = Number(settings.monthly_revenue_target) || 0;
  const currentProgress = target > 0 ? Math.min(1, revMonth / target) : 0;
  const revenueNeededForTarget = Math.max(0, target - revMonth);

  const last3Start = format(startOfMonth(subMonths(now, 2)), "yyyy-MM-dd");

  return {
    currency: settings.currency === "EUR" ? "EUR" : "UZS",
    company_name: settings.company_name,
    monthly_revenue_target: target,
    revenue: {
      total: revMonth,
      prevTotal: revPrev,
      byCategory: incomeCats,
      byMonth: byMonthData.map((m) => ({ month: m.month, total: m.revenue })),
    },
    expenses: {
      total: expMonth,
      variable: expVarMonth,
      fixedTotal,
      prevTotal: expPrev,
      byCategory: expenseCats,
      byMonth: byMonthData.map((m) => ({ month: m.month, total: m.expenses })),
    },
    profit: {
      net: profitMonth,
      prevNet: profitPrev,
      margin: marginMonth,
      trend: byMonthData.map((m) => ({
        month: m.month,
        label: m.label,
        revenue: m.revenue,
        expenses: m.expenses,
        variableExpenses: m.variableExpenses,
        profit: m.profit,
      })),
    },
    breakEven: {
      currentProgress,
      dealsNeeded: dealsNeededBreakEven,
      revenueNeeded: revenueGap,
      revenueNeededForTarget,
      avgDeal: avgDealVal,
    },
    last3Months: {
      from: last3Start,
      to: monthEnd,
      summary: byMonthData.slice(-3),
    },
  };
}

export async function listCategoriesWithStats(filters?: {
  type?: string;
  includeInactive?: boolean;
}) {
  let q = `
    SELECT c.*,
      COUNT(t.id)::bigint AS transaction_count,
      COALESCE(SUM(t.amount), 0)::numeric AS total_amount
    FROM categories c
    LEFT JOIN transactions t ON t.category_id = c.id
    WHERE 1=1`;
  const args: unknown[] = [];
  let i = 1;
  if (!filters?.includeInactive) {
    q += ` AND c.is_active = 1`;
  }
  if (filters?.type && (filters.type === "income" || filters.type === "expense")) {
    q += ` AND c.type = $${i++}`;
    args.push(filters.type);
  }
  q += ` GROUP BY c.id ORDER BY c.name ASC`;
  const rows = await sql.query(q, args);
  return mapRows<CategoryRow & { transaction_count: number; total_amount: number }>(
    rows as Record<string, unknown>[]
  );
}

export async function getChatContext() {
  const analytics = await getAnalytics();
  const fixedCosts = await listFixedCosts();
  const categories = await listCategories({ includeInactive: false });
  return {
    analytics,
    fixedCosts: fixedCosts.filter((f) => f.is_active),
    categories,
  };
}
