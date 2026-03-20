import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const isDev = process.env.NODE_ENV !== "production";
const tursoUrl = process.env.TURSO_DATABASE_URL || "file:./dompetku.db";
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
  url: tursoUrl,
  authToken: tursoAuthToken,
});

export const db = drizzle(client, { schema });

export async function initializeDatabase() {
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        currency_default TEXT NOT NULL DEFAULT 'IDR',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('cash', 'bank', 'ewallet')),
        current_balance REAL NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'IDR',
        priority_order INTEGER NOT NULL DEFAULT 0,
        color TEXT NOT NULL DEFAULT '#6366f1',
        is_hidden INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        icon TEXT NOT NULL DEFAULT 'circle',
        color TEXT NOT NULL DEFAULT '#6366f1',
        is_default INTEGER NOT NULL DEFAULT 0
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL REFERENCES accounts(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'transfer')),
        amount REAL NOT NULL,
        category_id INTEGER REFERENCES categories(id),
        description TEXT,
        transaction_date TEXT NOT NULL,
        related_account_id INTEGER REFERENCES accounts(id),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        category_id INTEGER NOT NULL REFERENCES categories(id),
        limit_amount REAL NOT NULL,
        period TEXT NOT NULL DEFAULT 'monthly' CHECK(period IN ('monthly', 'weekly')),
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const result = await client.execute("SELECT COUNT(*) as count FROM categories WHERE is_default = 1");
    const count = result.rows[0]?.count as number || 0;

    if (count === 0) {
      const defaultCategories = [
        { name: "Gaji", type: "income", icon: "briefcase", color: "#22c55e" },
        { name: "Freelance", type: "income", icon: "laptop", color: "#10b981" },
        { name: "Investasi", type: "income", icon: "trending-up", color: "#06b6d4" },
        { name: "Bonus", type: "income", icon: "gift", color: "#84cc16" },
        { name: "Lainnya (Masuk)", type: "income", icon: "plus-circle", color: "#a3e635" },
        { name: "Makan & Minum", type: "expense", icon: "utensils", color: "#f97316" },
        { name: "Transport", type: "expense", icon: "car", color: "#3b82f6" },
        { name: "Belanja", type: "expense", icon: "shopping-bag", color: "#ec4899" },
        { name: "Kesehatan", type: "expense", icon: "heart-pulse", color: "#ef4444" },
        { name: "Hiburan", type: "expense", icon: "tv", color: "#a855f7" },
        { name: "Tagihan", type: "expense", icon: "file-text", color: "#f59e0b" },
        { name: "Pendidikan", type: "expense", icon: "book-open", color: "#6366f1" },
        { name: "Lainnya (Keluar)", type: "expense", icon: "minus-circle", color: "#94a3b8" },
      ];

      for (const cat of defaultCategories) {
        await client.execute({
          sql: "INSERT INTO categories (name, type, icon, color, is_default) VALUES (?, ?, ?, ?, 1)",
          args: [cat.name, cat.type, cat.icon, cat.color]
        });
      }
    }
  } catch (error) {
    console.error("Failed to initialize database", error);
  }
}
