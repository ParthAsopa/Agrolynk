import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

function initDb() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl || (!databaseUrl.startsWith("postgres://") && !databaseUrl.startsWith("postgresql://"))) {
    return null;
  }
  try {
    const sql = neon(databaseUrl);
    return drizzle(sql);
  } catch (err) {
    console.warn("Failed to initialize database client with DATABASE_URL:", err);
    return null;
  }
}

export const db = initDb();
