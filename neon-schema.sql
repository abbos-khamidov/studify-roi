-- Выполни один раз в Neon: SQL Editor → New query → Run
-- https://console.neon.tech

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  openai_key TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'UZS',
  company_name TEXT NOT NULL DEFAULT 'Studify',
  monthly_revenue_target NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO settings (id, openai_key, currency, company_name, monthly_revenue_target)
VALUES (1, '', 'UZS', 'Studify', 0)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color TEXT NOT NULL DEFAULT '#F97316',
  icon TEXT NOT NULL DEFAULT 'folder',
  is_active SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC NOT NULL,
  description TEXT,
  category_id INTEGER REFERENCES categories (id) ON DELETE SET NULL,
  date DATE NOT NULL,
  is_recurring SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fixed_costs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category_id INTEGER REFERENCES categories (id) ON DELETE SET NULL,
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'quarterly', 'yearly')),
  is_active SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions (category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions (type);
