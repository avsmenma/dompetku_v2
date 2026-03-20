import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency: string = "IDR"
): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function getStartOfMonth(date: Date = new Date()): string {
  return new Date(date.getFullYear(), date.getMonth(), 1)
    .toISOString()
    .split("T")[0];
}

export function getEndOfMonth(date: Date = new Date()): string {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
}

export function getMonthName(monthIndex: number): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];
  return months[monthIndex];
}

export function getAccountTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    cash: "Tunai",
    bank: "Bank",
    ewallet: "E-Wallet",
  };
  return labels[type] || type;
}

export function getAccountTypeOrder(type: string): number {
  const order: Record<string, number> = {
    cash: 0,
    bank: 1,
    ewallet: 2,
  };
  return order[type] ?? 99;
}
