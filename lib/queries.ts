import {
  eachMonthOfInterval,
  endOfMonth,
  format,
  startOfMonth,
  subMonths,
} from "date-fns";
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

function monthlyEquivalent(amount: number, frequency: string): number {
  if (frequency === "quarterly") return amount / 3;
  if (frequency === "yearly") return amount / 12;
  return amount;
}

export function getFixedCostsMonthlyTotal(): number {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT amount, frequency FROM fixed_costs WHERE is_active = 1`
    )
    .all() as { amount: number; frequency: string }[];
  return rows.reduce(
    (s, r) => s + monthlyEquivalent(r.amount, r.frequency),
    0
  );
}

export function getSettings(): Settings {
  const db = getDb();
  return db.prepare(`SELECT * FROM settings WHERE id = 1`).get() as Settings;
}

export function updateSettings(partial: Partial<{
  openai_key: string;
  currency: string;
  company_name: string;
  monthly_revenue_target: number;
}>) {
  const db = getDb();
  const cur = getSettings();
  const next = { ...cur, ...partial, updated_at: new Date().toISOString() };
  db.prepare(
    `UPDATE settings SET
      openai_key = @openai_key,
      currency = @currency,
      company_name = @company_name,
      monthly_revenue_target = @monthly_revenue_target,
      updated_at = @updated_at
    WHERE id = 1`
  ).run({
    openai_key: next.openai_key,
    currency: next.currency,
    company_name: next.company_name,
    monthly_revenue_target: next.monthly_revenue_target,
    updated_at: next.updated_at,
  });
  return getSettings();
}

export function resetAllData() {
  const db = getDb();
  db.exec(`DELETE FROM transactions; DELETE FROM fixed_costs; DELETE FROM categories;`);
  db.prepare(
    `UPDATE settings SET openai_key = '', currency = 'USD', company_name = 'Studify', monthly_revenue_target = 0, updated_at = CURRENT_TIMESTAMP WHERE id = 1`
  ).run();
}

export function exportAllJson() {
  const db = getDb();
  return {
    settings: getSettings(),
    categories: db.prepare(`SELECT * FROM categories`).all(),
    transactions: db.prepare(`SELECT * FROM transactions ORDER BY date DESC`).all(),
    fixed_costs: db.prepare(`SELECT * FROM fixed_costs`).all(),
    exported_at: new Date().toISOString(),
  };
}

export function listCategories(filters?: { type?: string; includeInactive?: boolean }) {
  const db = getDb();
  let sql = `SELECT * FROM categories WHERE 1=1`;
  const params: (string | number)[] = [];
  if (!filters?.includeInactive) {
    sql += ` AND is_active = 1`;
  }
  if (filters?.type && (filters.type === "income" || filters.type === "expense")) {
    sql += ` AND type = ?`;
    params.push(filters.type);
  }
  sql += ` ORDER BY name ASC`;
  return db.prepare(sql).all(...params) as CategoryRow[];
}

export function getCategory(id: number) {
  const db = getDb();
  return db.prepare(`SELECT * FROM categories WHERE id = ?`).get(id) as
    | CategoryRow
    | undefined;
}

export function createCategory(data: {
  name: string;
  type: "income" | "expense";
  color?: string;
  icon?: string;
}) {
  const db = getDb();
  const r = db
    .prepare(
      `INSERT INTO categories (name, type, color, icon) VALUES (@name, @type, @color, @icon)`
    )
    .run({
      name: data.name,
      type: data.type,
      color: data.color ?? "#F97316",
      icon: data.icon ?? "folder",
    });
  return getCategory(Number(r.lastInsertRowid))!;
}

export function updateCategory(
  id: number,
  partial: Partial<{
    name: string;
    type: "income" | "expense";
    color: string;
    icon: string;
    is_active: number;
  }>
) {
  const db = getDb();
  const cur = getCategory(id);
  if (!cur) return null;
  const next = { ...cur, ...partial };
  db.prepare(
    `UPDATE categories SET name=@name, type=@type, color=@color, icon=@icon, is_active=@is_active WHERE id=@id`
  ).run({
    id,
    name: next.name,
    type: next.type,
    color: next.color,
    icon: next.icon,
    is_active: next.is_active,
  });
  return getCategory(id);
}

export function softDeleteCategory(id: number) {
  return updateCategory(id, { is_active: 0 });
}

export function listFixedCosts() {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM fixed_costs ORDER BY name ASC`)
    .all() as FixedCostRow[];
}

export function createFixedCost(data: {
  name: string;
  amount: number;
  category_id?: number | null;
  frequency?: "monthly" | "quarterly" | "yearly";
}) {
  const db = getDb();
  const r = db
    .prepare(
      `INSERT INTO fixed_costs (name, amount, category_id, frequency) VALUES (@name, @amount, @category_id, @frequency)`
    )
    .run({
      name: data.name,
      amount: data.amount,
      category_id: data.category_id ?? null,
      frequency: data.frequency ?? "monthly",
    });
  return db.prepare(`SELECT * FROM fixed_costs WHERE id = ?`).get(r.lastInsertRowid) as FixedCostRow;
}

export function updateFixedCost(
  id: number,
  partial: Partial<{
    name: string;
    amount: number;
    category_id: number | null;
    frequency: "monthly" | "quarterly" | "yearly";
    is_active: number;
  }>
) {
  const db = getDb();
  const cur = db.prepare(`SELECT * FROM fixed_costs WHERE id = ?`).get(id) as
    | FixedCostRow
    | undefined;
  if (!cur) return null;
  const next = { ...cur, ...partial };
  db.prepare(
    `UPDATE fixed_costs SET name=@name, amount=@amount, category_id=@category_id, frequency=@frequency, is_active=@is_active WHERE id=@id`
  ).run({
    id,
    name: next.name,
    amount: next.amount,
    category_id: next.category_id,
    frequency: next.frequency,
    is_active: next.is_active,
  });
  return db.prepare(`SELECT * FROM fixed_costs WHERE id = ?`).get(id) as FixedCostRow;
}

export function deleteFixedCost(id: number) {
  const db = getDb();
  db.prepare(`DELETE FROM fixed_costs WHERE id = ?`).run(id);
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

export function listTransactions(params: {
  type?: string;
  category_id?: number;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}) {
  const db = getDb();
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

  const countRow = db
    .prepare(`SELECT COUNT(*) as c FROM transactions t ${where}`)
    .get(...qparams) as { c: number };

  const rows = db
    .prepare(
      `SELECT t.*, c.name as category_name, c.color as category_color
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       ${where}
       ORDER BY ${sort} ${order}
       LIMIT ? OFFSET ?`
    )
    .all(...qparams, limit, offset);

  return {
    items: rows,
    total: countRow.c,
    page,
    limit,
    totalPages: Math.ceil(countRow.c / limit) || 1,
  };
}

export function getTransaction(id: number) {
  const db = getDb();
  return db
    .prepare(
      `SELECT t.*, c.name as category_name FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id WHERE t.id = ?`
    )
    .get(id) as Record<string, unknown> | undefined;
}

export function createTransaction(data: {
  type: "income" | "expense";
  amount: number;
  description?: string | null;
  category_id?: number | null;
  date: string;
  is_recurring?: number;
}) {
  const db = getDb();
  const r = db
    .prepare(
      `INSERT INTO transactions (type, amount, description, category_id, date, is_recurring)
       VALUES (@type, @amount, @description, @category_id, @date, @is_recurring)`
    )
    .run({
      type: data.type,
      amount: data.amount,
      description: data.description ?? null,
      category_id: data.category_id ?? null,
      date: data.date,
      is_recurring: data.is_recurring ?? 0,
    });
  return getTransaction(Number(r.lastInsertRowid));
}

export function updateTransaction(
  id: number,
  partial: Partial<{
    type: "income" | "expense";
    amount: number;
    description: string | null;
    category_id: number | null;
    date: string;
    is_recurring: number;
  }>
) {
  const db = getDb();
  const cur = db.prepare(`SELECT * FROM transactions WHERE id = ?`).get(id) as
    | TransactionRow
    | undefined;
  if (!cur) return null;
  const next = { ...cur, ...partial };
  db.prepare(
    `UPDATE transactions SET type=@type, amount=@amount, description=@description, category_id=@category_id, date=@date, is_recurring=@is_recurring WHERE id=@id`
  ).run({
    id,
    type: next.type,
    amount: next.amount,
    description: next.description,
    category_id: next.category_id,
    date: next.date,
    is_recurring: next.is_recurring,
  });
  return getTransaction(id);
}

export function deleteTransaction(id: number) {
  const db = getDb();
  db.prepare(`DELETE FROM transactions WHERE id = ?`).run(id);
}

function sumTxRange(
  type: "income" | "expense",
  from: string,
  to: string
): number {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) as s FROM transactions WHERE type = ? AND date >= ? AND date <= ?`
    )
    .get(type, from, to) as { s: number };
  return row.s;
}

function avgIncomeAmount(from: string, to: string): number {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT COALESCE(AVG(amount), 0) as a, COUNT(*) as c FROM transactions WHERE type = 'income' AND date >= ? AND date <= ?`
    )
    .get(from, to) as { a: number; c: number };
  return row.c > 0 ? row.a : 0;
}

function categoryTotals(
  type: "income" | "expense",
  from: string,
  to: string
) {
  const db = getDb();
  return db
    .prepare(
      `SELECT c.id, c.name, c.color, COALESCE(SUM(t.amount), 0) as total
       FROM transactions t
       JOIN categories c ON c.id = t.category_id AND c.is_active = 1
       WHERE t.type = ? AND t.date >= ? AND t.date <= ?
       GROUP BY c.id
       ORDER BY total DESC`
    )
    .all(type, from, to) as {
    id: number;
    name: string;
    color: string;
    total: number;
  }[];
}

export function getAnalytics() {
  const settings = getSettings();
  const now = new Date();
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");
  const prevStart = format(startOfMonth(subMonths(now, 1)), "yyyy-MM-dd");
  const prevEnd = format(endOfMonth(subMonths(now, 1)), "yyyy-MM-dd");

  const fixedTotal = getFixedCostsMonthlyTotal();

  const revMonth = sumTxRange("income", monthStart, monthEnd);
  const expVarMonth = sumTxRange("expense", monthStart, monthEnd);
  const expMonth = expVarMonth + fixedTotal;
  const profitMonth = revMonth - expMonth;
  const marginMonth = revMonth > 0 ? (profitMonth / revMonth) * 100 : 0;

  const revPrev = sumTxRange("income", prevStart, prevEnd);
  const expPrev = sumTxRange("expense", prevStart, prevEnd) + fixedTotal;
  const profitPrev = revPrev - expPrev;

  const revenueGap = Math.max(0, expMonth - revMonth);
  const avgDeal = avgIncomeAmount(monthStart, monthEnd);
  const dealsNeededBreakEven =
    avgDeal > 0 ? Math.ceil(revenueGap / avgDeal) : revenueGap > 0 ? null : 0;

  const target = settings.monthly_revenue_target || 0;
  const currentProgress = target > 0 ? Math.min(1, revMonth / target) : 0;
  const revenueNeededForTarget = Math.max(0, target - revMonth);

  const rangeEnd = endOfMonth(now);
  const rangeStart = startOfMonth(subMonths(now, 11));
  const months = eachMonthOfInterval({ start: rangeStart, end: rangeEnd });

  const byMonth = months.map((m) => {
    const fs = format(startOfMonth(m), "yyyy-MM-dd");
    const fe = format(endOfMonth(m), "yyyy-MM-dd");
    const revenue = sumTxRange("income", fs, fe);
    const expenses = sumTxRange("expense", fs, fe) + fixedTotal;
    const profit = revenue - expenses;
    return {
      month: format(m, "yyyy-MM"),
      label: format(m, "MMM yyyy"),
      revenue,
      expenses,
      profit,
    };
  });

  const last3Start = format(startOfMonth(subMonths(now, 2)), "yyyy-MM-dd");

  return {
    currency: settings.currency,
    company_name: settings.company_name,
    monthly_revenue_target: target,
    revenue: {
      total: revMonth,
      prevTotal: revPrev,
      byCategory: categoryTotals("income", monthStart, monthEnd),
      byMonth: byMonth.map((m) => ({ month: m.month, total: m.revenue })),
    },
    expenses: {
      total: expMonth,
      variable: expVarMonth,
      fixedTotal,
      prevTotal: expPrev,
      byCategory: categoryTotals("expense", monthStart, monthEnd),
      byMonth: byMonth.map((m) => ({ month: m.month, total: m.expenses })),
    },
    profit: {
      net: profitMonth,
      prevNet: profitPrev,
      margin: marginMonth,
      trend: byMonth.map((m) => ({
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
      avgDeal,
    },
    last3Months: {
      from: last3Start,
      to: monthEnd,
      summary: byMonth.slice(-3),
    },
  };
}

export function listCategoriesWithStats(filters?: {
  type?: string;
  includeInactive?: boolean;
}) {
  const db = getDb();
  let sql = `
    SELECT c.*,
      COUNT(t.id) AS transaction_count,
      COALESCE(SUM(t.amount), 0) AS total_amount
    FROM categories c
    LEFT JOIN transactions t ON t.category_id = c.id
    WHERE 1=1`;
  const params: (string | number)[] = [];
  if (!filters?.includeInactive) {
    sql += ` AND c.is_active = 1`;
  }
  if (filters?.type && (filters.type === "income" || filters.type === "expense")) {
    sql += ` AND c.type = ?`;
    params.push(filters.type);
  }
  sql += ` GROUP BY c.id ORDER BY c.name ASC`;
  return db.prepare(sql).all(...params) as (CategoryRow & {
    transaction_count: number;
    total_amount: number;
  })[];
}

export function getChatContext() {
  const analytics = getAnalytics();
  const fixed = listFixedCosts().filter((f) => f.is_active);
  const categories = listCategories({ includeInactive: false });
  return { analytics, fixedCosts: fixed, categories };
}
