import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  currencyDefault: text("currency_default").notNull().default("IDR"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  type: text("type", { enum: ["cash", "bank", "ewallet"] }).notNull(),
  currentBalance: real("current_balance").notNull().default(0),
  currency: text("currency").notNull().default("IDR"),
  priorityOrder: integer("priority_order").notNull().default(0),
  color: text("color").notNull().default("#6366f1"),
  isHidden: integer("is_hidden", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  type: text("type", { enum: ["income", "expense"] }).notNull(),
  icon: text("icon").notNull().default("circle"),
  color: text("color").notNull().default("#6366f1"),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
});

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  type: text("type", { enum: ["income", "expense", "transfer"] }).notNull(),
  amount: real("amount").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  description: text("description"),
  transactionDate: text("transaction_date").notNull(),
  relatedAccountId: integer("related_account_id").references(() => accounts.id),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const budgets = sqliteTable("budgets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  limitAmount: real("limit_amount").notNull(),
  period: text("period", { enum: ["monthly", "weekly"] }).notNull().default("monthly"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  transactions: many(transactions),
  budgets: many(budgets),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  relatedAccount: one(accounts, {
    fields: [transactions.relatedAccountId],
    references: [accounts.id],
    relationName: "relatedAccount",
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  user: one(users, { fields: [budgets.userId], references: [users.id] }),
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
