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

/** HTTP Neon: только `query("... $1", [x])` (без импорта клиента при загрузке модуля — иначе падает `next build` без env). */
export const sql = {
  query: (queryText: string, params: unknown[] = []) =>
    getSql().query(queryText, params as never[]),
};
