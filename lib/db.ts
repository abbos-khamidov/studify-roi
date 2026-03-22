import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let _sql: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not set");
    }
    _sql = neon(url);
  }
  return _sql;
}

/** HTTP Neon: query() returns { rows, fields, ... } — we unwrap to rows[] for compatibility. */
export const sql = {
  query: async (queryText: string, params: unknown[] = []) => {
    const result = await getSql().query(queryText, params as never[]);
    // neon .query() returns a FullQueryResults object { rows: [...], fields: [...], ... }
    // but our queries.ts expects a plain array of row objects
    if (result && typeof result === "object" && "rows" in result) {
      return (result as { rows: Record<string, unknown>[] }).rows;
    }
    // fallback: if somehow it's already an array
    return result;
  },
};
