import { createClient, type Client } from "@libsql/client";

let initPromise: Promise<Client> | null = null;

function cleanEnv(v: string | undefined | null): string | undefined {
  if (v == null) return undefined;
  let t = String(v).trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    t = t.slice(1, -1).trim();
  }
  return t || undefined;
}

async function migrate(client: Client) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      openai_key TEXT DEFAULT '',
      currency TEXT DEFAULT 'USD',
      company_name TEXT DEFAULT 'Studify',
      monthly_revenue_target REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      color TEXT DEFAULT '#F97316',
      icon TEXT DEFAULT 'folder',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      amount REAL NOT NULL,
      description TEXT,
      category_id INTEGER REFERENCES categories(id),
      date TEXT NOT NULL,
      is_recurring INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS fixed_costs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      category_id INTEGER REFERENCES categories(id),
      frequency TEXT DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'quarterly', 'yearly')),
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  await client.execute(
    `CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)`
  );
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type)`);
  await client.execute(`INSERT OR IGNORE INTO settings (id) VALUES (1)`);
}

export async function getDb(): Promise<Client> {
  if (!initPromise) {
    const p = (async () => {
      const url = cleanEnv(process.env.TURSO_DATABASE_URL);
      if (!url) {
        throw new Error(
          "TURSO_DATABASE_URL is not set. Add it in Vercel → Settings → Environment Variables."
        );
      }
      const authToken = cleanEnv(process.env.TURSO_AUTH_TOKEN);
      const isRemote =
        url.startsWith("libsql://") ||
        url.includes("turso.io") ||
        url.startsWith("https://");
      if (isRemote && !authToken) {
        throw new Error(
          "TURSO_AUTH_TOKEN is required for Turso. Create a DB token in the Turso dashboard and add it to Vercel env."
        );
      }
      const client = createClient({
        url,
        authToken: authToken || undefined,
      });
      await migrate(client);
      return client;
    })();
    initPromise = p.catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}
