import {
  eachMonthOfInterval,
  endOfMonth,
  format,
  startOfMonth,
  subMonths,
} from "date-fns";
import { type ResultSet } from "@libsql/client";
import { getDb } from "./db";

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

/** Turso/libsql может отдавать INTEGER как BigInt — ломает JSON.stringify в NextResponse */
function normalizeCell(v: unknown): unknown {
  if (typeof v === "bigint") {
    const n = Number(v);
    return Number.isSafeInteger(n) ? n : v.toString();
  }
  return v;
}

function mapRows<T>(result: ResultSet): T[] {
  return result.rows.map((row) => {
    const obj: Record<string, unknown> = {};
    result.columns.forEach((col, i) => {
      obj[col] = normalizeCell(row[i]);
    });
    return obj as unknown as T;
  });
}

function mapRow<T>(result: ResultSet): T | undefined {
  if (result.rows.length === 0) return undefined;
  const row = result.rows[0];
  const obj: Record<string, unknown> = {};
  result.columns.forEach((col, i) => {
    obj[col] = normalizeCell(row[i]);
  });
  return obj as unknown as T;
}

function monthlyEquivalent(amount: number, frequency: string): number {
  if (frequency === "quarterly") return amount / 3;
  if (frequency === "yearly") return amount / 12;
  return amount;
}

export async function getFixedCostsMonthlyTotal(): Promise<number> {
  const result = await (await getDb()).execute({
    sql: `SELECT amount, frequency FROM fixed_costs WHERE is_active = 1`,
    args: [],
  });
  const rows = mapRows<{ amount: number; frequency: string }>(result);
  return rows.reduce((s, r) => s + monthlyEquivalent(Number(r.amount), r.frequency), 0);
}

export async function getSettings(): Promise<Settings> {
  const result = await (await getDb()).execute({
    sql: `SELECT * FROM settings WHERE id = 1`,
    args: [],
  });
  return mapRow<Settings>(result)!;
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
  await (await getDb()).execute({
    sql: `UPDATE settings SET
      openai_key = ?,
      currency = ?,
      company_name = ?,
      monthly_revenue_target = ?,
      updated_at = ?
    WHERE id = 1`,
    args: [
      next.openai_key,
      next.currency,
      next.company_name,
      next.monthly_revenue_target,
      next.updated_at,
    ],
  });
  return getSettings();
}

export async function resetAllData(): Promise<void> {
  const d = await getDb();
  // Не используем batch(): на Turso HTTP иногда даёт 400 (SQL cache / hrana)
  await d.execute({ sql: "DELETE FROM transactions", args: [] });
  await d.execute({ sql: "DELETE FROM fixed_costs", args: [] });
  await d.execute({ sql: "DELETE FROM categories", args: [] });
  await d.execute({
    sql: `UPDATE settings SET openai_key = '', currency = 'USD', company_name = 'Studify', monthly_revenue_target = 0, updated_at = CURRENT_TIMESTAMP WHERE id = 1`,
    args: [],
  });
}

export async function exportAllJson() {
  const d = await getDb();
  const settingsResult = await d.execute({
    sql: "SELECT * FROM settings WHERE id = 1",
    args: [],
  });
  const catResult = await d.execute({ sql: "SELECT * FROM categories", args: [] });
  const txResult = await d.execute({
    sql: "SELECT * FROM transactions ORDER BY date DESC",
    args: [],
  });
  const fcResult = await d.execute({ sql: "SELECT * FROM fixed_costs", args: [] });
  return {
    settings: mapRow<Settings>(settingsResult)!,
    categories: mapRows<CategoryRow>(catResult),
    transactions: mapRows<TransactionRow>(txResult),
    fixed_costs: mapRows<FixedCostRow>(fcResult),
    exported_at: new Date().toISOString(),
  };
}

export async function listCategories(filters?: {
  type?: string;
  includeInactive?: boolean;
}): Promise<CategoryRow[]> {
  let sql = `SELECT * FROM categories WHERE 1=1`;
  const args: (string | number)[] = [];
  if (!filters?.includeInactive) {
    sql += ` AND is_active = 1`;
  }
  if (filters?.type && (filters.type === "income" || filters.type === "expense")) {
    sql += ` AND type = ?`;
    args.push(filters.type);
  }
  sql += ` ORDER BY name ASC`;
  const result = await (await getDb()).execute({ sql, args });
  return mapRows<CategoryRow>(result);
}

export async function getCategory(id: number): Promise<CategoryRow | undefined> {
  const result = await (await getDb()).execute({
    sql: `SELECT * FROM categories WHERE id = ?`,
    args: [id],
  });
  return mapRow<CategoryRow>(result);
}

export async function createCategory(data: {
  name: string;
  type: "income" | "expense";
  color?: string;
  icon?: string;
}): Promise<CategoryRow> {
  const result = await (await getDb()).execute({
    sql: `INSERT INTO categories (name, type, color, icon) VALUES (?, ?, ?, ?)`,
    args: [data.name, data.type, data.color ?? "#F97316", data.icon ?? "folder"],
  });
  return (await getCategory(Number(result.lastInsertRowid)))!;
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
  await (await getDb()).execute({
    sql: `UPDATE categories SET name=?, type=?, color=?, icon=?, is_active=? WHERE id=?`,
    args: [next.name, next.type, next.color, next.icon, next.is_active, id],
  });
  return getCategory(id) as Promise<CategoryRow>;
}

export async function softDeleteCategory(id: number): Promise<CategoryRow | null> {
  return updateCategory(id, { is_active: 0 });
}

export async function listFixedCosts(): Promise<FixedCostRow[]> {
  const result = await (await getDb()).execute({
    sql: `SELECT * FROM fixed_costs ORDER BY name ASC`,
    args: [],
  });
  return mapRows<FixedCostRow>(result);
}

export async function createFixedCost(data: {
  name: string;
  amount: number;
  category_id?: number | null;
  frequency?: "monthly" | "quarterly" | "yearly";
}): Promise<FixedCostRow> {
  const result = await (await getDb()).execute({
    sql: `INSERT INTO fixed_costs (name, amount, category_id, frequency) VALUES (?, ?, ?, ?)`,
    args: [
      data.name,
      data.amount,
      data.category_id ?? null,
      data.frequency ?? "monthly",
    ],
  });
  const id = Number(result.lastInsertRowid);
  const r = await (await getDb()).execute({ sql: `SELECT * FROM fixed_costs WHERE id = ?`, args: [id] });
  return mapRow<FixedCostRow>(r)!;
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
  const curResult = await (await getDb()).execute({
    sql: `SELECT * FROM fixed_costs WHERE id = ?`,
    args: [id],
  });
  const cur = mapRow<FixedCostRow>(curResult);
  if (!cur) return null;
  const next = { ...cur, ...partial };
  await (await getDb()).execute({
    sql: `UPDATE fixed_costs SET name=?, amount=?, category_id=?, frequency=?, is_active=? WHERE id=?`,
    args: [next.name, next.amount, next.category_id, next.frequency, next.is_active, id],
  });
  const updated = await (await getDb()).execute({ sql: `SELECT * FROM fixed_costs WHERE id = ?`, args: [id] });
  return mapRow<FixedCostRow>(updated)!;
}

export async function deleteFixedCost(id: number): Promise<void> {
  await (await getDb()).execute({ sql: `DELETE FROM fixed_costs WHERE id = ?`, args: [id] });
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
  const qparams: (string | number)[] = [];
  if (params.type === "income" || params.type === "expense") {
    where += ` AND t.type = ?`;
    qparams.push(params.type);
  }
  if (params.category_id != null) {
    where += ` AND t.category_id = ?`;
    qparams.push(params.category_id);
  }
  if (params.from) {
    where += ` AND t.date >= ?`;
    qparams.push(params.from);
  }
  if (params.to) {
    where += ` AND t.date <= ?`;
    qparams.push(params.to);
  }

  const d = await getDb();
  const countResult = await d.execute({
    sql: `SELECT COUNT(*) as c FROM transactions t ${where}`,
    args: qparams,
  });
  const rowsResult = await d.execute({
    sql: `SELECT t.*, c.name as category_name, c.color as category_color
          FROM transactions t
          LEFT JOIN categories c ON c.id = t.category_id
          ${where}
          ORDER BY ${sort} ${order}
          LIMIT ? OFFSET ?`,
    args: [...qparams, limit, offset],
  });

  const total = Number(mapRow<{ c: number }>(countResult)!.c);
  return {
    items: mapRows(rowsResult),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getTransaction(id: number): Promise<Record<string, unknown> | undefined> {
  const result = await (await getDb()).execute({
    sql: `SELECT t.*, c.name as category_name FROM transactions t
          LEFT JOIN categories c ON c.id = t.category_id WHERE t.id = ?`,
    args: [id],
  });
  return mapRow<Record<string, unknown>>(result);
}

export async function createTransaction(data: {
  type: "income" | "expense";
  amount: number;
  description?: string | null;
  category_id?: number | null;
  date: string;
  is_recurring?: number;
}): Promise<Record<string, unknown> | undefined> {
  const result = await (await getDb()).execute({
    sql: `INSERT INTO transactions (type, amount, description, category_id, date, is_recurring)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      data.type,
      data.amount,
      data.description ?? null,
      data.category_id ?? null,
      data.date,
      data.is_recurring ?? 0,
    ],
  });
  return getTransaction(Number(result.lastInsertRowid));
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
  const curResult = await (await getDb()).execute({
    sql: `SELECT * FROM transactions WHERE id = ?`,
    args: [id],
  });
  const cur = mapRow<TransactionRow>(curResult);
  if (!cur) return null;
  const next = { ...cur, ...partial };
  await (await getDb()).execute({
    sql: `UPDATE transactions SET type=?, amount=?, description=?, category_id=?, date=?, is_recurring=? WHERE id=?`,
    args: [
      next.type,
      next.amount,
      next.description,
      next.category_id,
      next.date,
      next.is_recurring,
      id,
    ],
  });
  return getTransaction(id) as Promise<Record<string, unknown>>;
}

export async function deleteTransaction(id: number): Promise<void> {
  await (await getDb()).execute({ sql: `DELETE FROM transactions WHERE id = ?`, args: [id] });
}

/** Один запрос на весь диапазон вместо N×2 sumTxRange (Turso HTTP не любит параллель). */
async function transactionsTotalsByMonthAndType(
  from: string,
  to: string
): Promise<Map<string, { income: number; expense: number }>> {
  const result = await (await getDb()).execute({
    sql: `SELECT strftime('%Y-%m', date) AS month, type, COALESCE(SUM(amount), 0) AS total
          FROM transactions
          WHERE date >= ? AND date <= ?
          GROUP BY strftime('%Y-%m', date), type`,
    args: [from, to],
  });
  const map = new Map<string, { income: number; expense: number }>();
  for (const row of mapRows<{ month: string; type: string; total: number }>(result)) {
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
  const result = await (await getDb()).execute({
    sql: `SELECT COALESCE(AVG(amount), 0) as a, COUNT(*) as c FROM transactions WHERE type = 'income' AND date >= ? AND date <= ?`,
    args: [from, to],
  });
  const row = mapRow<{ a: number; c: number }>(result)!;
  return Number(row.c) > 0 ? Number(row.a) : 0;
}

async function categoryTotals(
  type: "income" | "expense",
  from: string,
  to: string
): Promise<{ id: number; name: string; color: string; total: number }[]> {
  const result = await (await getDb()).execute({
    sql: `SELECT c.id, c.name, c.color, COALESCE(SUM(t.amount), 0) as total
          FROM transactions t
          JOIN categories c ON c.id = t.category_id AND c.is_active = 1
          WHERE t.type = ? AND t.date >= ? AND t.date <= ?
          GROUP BY c.id
          ORDER BY total DESC`,
    args: [type, from, to],
  });
  return mapRows<{ id: number; name: string; color: string; total: number }>(result);
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

  const target = settings.monthly_revenue_target || 0;
  const currentProgress = target > 0 ? Math.min(1, revMonth / target) : 0;
  const revenueNeededForTarget = Math.max(0, target - revMonth);

  const last3Start = format(startOfMonth(subMonths(now, 2)), "yyyy-MM-dd");

  return {
    currency: settings.currency,
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
  let sql = `
    SELECT c.*,
      COUNT(t.id) AS transaction_count,
      COALESCE(SUM(t.amount), 0) AS total_amount
    FROM categories c
    LEFT JOIN transactions t ON t.category_id = c.id
    WHERE 1=1`;
  const args: (string | number)[] = [];
  if (!filters?.includeInactive) {
    sql += ` AND c.is_active = 1`;
  }
  if (filters?.type && (filters.type === "income" || filters.type === "expense")) {
    sql += ` AND c.type = ?`;
    args.push(filters.type);
  }
  sql += ` GROUP BY c.id ORDER BY c.name ASC`;
  const result = await (await getDb()).execute({ sql, args });
  return mapRows<CategoryRow & { transaction_count: number; total_amount: number }>(result);
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
