import Dexie, { type Table } from "dexie";

export interface Account {
  id?: number;
  name: string;
  type: "cash" | "bank" | "ewallet";
  currentBalance: number;
  currency: string;
  color: string;
  isHidden: boolean;
  priorityOrder: number;
  createdAt: string;
}

export interface Category {
  id?: number;
  name: string;
  type: "income" | "expense";
  icon: string;
  color: string;
  isDefault: boolean;
}

export interface Transaction {
  id?: number;
  accountId: number;
  type: "income" | "expense" | "transfer";
  amount: number;
  categoryId: number | null;
  description: string | null;
  transactionDate: string;
  relatedAccountId: number | null;
  createdAt: string;
}

export interface Budget {
  id?: number;
  categoryId: number;
  limitAmount: number;
  period: "monthly" | "weekly";
  startDate: string;
  endDate: string;
  createdAt: string;
}

const DEFAULT_CATEGORIES: Omit<Category, "id">[] = [
  { name: "Gaji", type: "income", icon: "briefcase", color: "#22c55e", isDefault: true },
  { name: "Freelance", type: "income", icon: "laptop", color: "#10b981", isDefault: true },
  { name: "Investasi", type: "income", icon: "trending-up", color: "#06b6d4", isDefault: true },
  { name: "Bonus", type: "income", icon: "gift", color: "#84cc16", isDefault: true },
  { name: "Lainnya (Masuk)", type: "income", icon: "plus-circle", color: "#a3e635", isDefault: true },
  { name: "Makan & Minum", type: "expense", icon: "utensils", color: "#f97316", isDefault: true },
  { name: "Transport", type: "expense", icon: "car", color: "#3b82f6", isDefault: true },
  { name: "Belanja", type: "expense", icon: "shopping-bag", color: "#ec4899", isDefault: true },
  { name: "Kesehatan", type: "expense", icon: "heart-pulse", color: "#ef4444", isDefault: true },
  { name: "Hiburan", type: "expense", icon: "tv", color: "#a855f7", isDefault: true },
  { name: "Tagihan", type: "expense", icon: "file-text", color: "#f59e0b", isDefault: true },
  { name: "Pendidikan", type: "expense", icon: "book-open", color: "#6366f1", isDefault: true },
  { name: "Lainnya (Keluar)", type: "expense", icon: "minus-circle", color: "#94a3b8", isDefault: true },
];

class DompetkulDB extends Dexie {
  accounts!: Table<Account>;
  categories!: Table<Category>;
  transactions!: Table<Transaction>;
  budgets!: Table<Budget>;

  constructor() {
    super("dompetku_local_v2");
    this.version(1).stores({
      accounts: "++id, type, isHidden",
      categories: "++id, type, isDefault",
      transactions: "++id, accountId, type, transactionDate, categoryId",
      budgets: "++id, categoryId, period",
    });
  }
}

export const localDb = new DompetkulDB();

// Seed default categories if empty
export async function ensureDefaultCategories() {
  const count = await localDb.categories.count();
  if (count === 0) {
    await localDb.categories.bulkAdd(DEFAULT_CATEGORIES as Category[]);
  }
}

// Profile helpers (stored in localStorage)
export function getProfile(): { name: string; currency: string } | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("dompetku_profile");
  return raw ? JSON.parse(raw) : null;
}

export function saveProfile(name: string, currency = "IDR") {
  localStorage.setItem("dompetku_profile", JSON.stringify({ name, currency }));
}

export function clearProfile() {
  localStorage.removeItem("dompetku_profile");
}
