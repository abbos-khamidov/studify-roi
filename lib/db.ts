import { createClient } from "@libsql/client/http";

const url = (process.env.TURSO_DATABASE_URL ?? "").replace(
  /^libsql:\/\//,
  "https://"
);

export const db = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
