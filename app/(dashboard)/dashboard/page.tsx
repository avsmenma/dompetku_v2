"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, TrendingDown, Wallet, Plus, ArrowLeftRight,
  Bell, User, ChevronRight, Eye, EyeOff
} from "lucide-react";
import { formatCurrency, getStartOfMonth, getEndOfMonth, getAccountTypeLabel } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { AccountLogo } from "@/components/ui/account-logo";

interface Account {
  id: number; name: string; type: string;
  currentBalance: number; currency: string; color: string;
  isHidden: boolean; priorityOrder: number;
}

interface ReportData {
  totalIncome: number; totalExpense: number; netSaving: number;
  expenseByCategory: Array<{ name: string; amount: number; color: string }>;
}

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [showBalance, setShowBalance] = useState(true);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [accsRes, reportRes, meRes] = await Promise.all([
        fetch("/api/accounts"),
        fetch(`/api/reports?startDate=${getStartOfMonth()}&endDate=${getEndOfMonth()}`),
        fetch("/api/auth/me"),
      ]);
      if (accsRes.ok) setAccounts(await accsRes.json());
      if (reportRes.ok) setReport(await reportRes.json());
      if (meRes.ok) {
        const { user } = await meRes.json();
        setUserName(user.name);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const totalWealth = accounts
    .filter((a) => !a.isHidden)
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const visibleAccounts = accounts
    .filter((a) => !a.isHidden)
    .sort((a, b) => a.priorityOrder - b.priorityOrder);

  const chartData = report?.expenseByCategory.slice(0, 5) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="text-sm text-muted-foreground">Selamat datang,</p>
          <h1 className="text-xl font-bold">{userName || "Pengguna"} 👋</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/profile">
              <User className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Total Wealth Card */}
      <Card className="bg-gradient-to-br from-violet-600 to-purple-700 text-white border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-violet-200 text-sm font-medium">Total Kekayaan</p>
              <div className="flex items-center gap-2 mt-1">
                {showBalance ? (
                  <p className="text-3xl font-bold">{formatCurrency(totalWealth)}</p>
                ) : (
                  <p className="text-3xl font-bold">Rp ••••••</p>
                )}
                <button onClick={() => setShowBalance(!showBalance)} className="text-violet-200 hover:text-white">
                  {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <Wallet className="h-6 w-6" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
            <div>
              <div className="flex items-center gap-1 text-violet-200 text-xs mb-1">
                <TrendingUp className="h-3 w-3" />
                <span>Pemasukan Bulan Ini</span>
              </div>
              <p className="font-semibold text-sm">
                {showBalance ? formatCurrency(report?.totalIncome || 0) : "Rp ••••"}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1 text-violet-200 text-xs mb-1">
                <TrendingDown className="h-3 w-3" />
                <span>Pengeluaran Bulan Ini</span>
              </div>
              <p className="font-semibold text-sm">
                {showBalance ? formatCurrency(report?.totalExpense || 0) : "Rp ••••"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { href: "/transactions?type=income", label: "Pemasukan", icon: TrendingUp, color: "bg-green-100 text-green-600" },
          { href: "/transactions?type=expense", label: "Pengeluaran", icon: TrendingDown, color: "bg-red-100 text-red-600" },
          { href: "/transfer", label: "Transfer", icon: ArrowLeftRight, color: "bg-blue-100 text-blue-600" },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-0 shadow-sm">
                <CardContent className="p-4 flex flex-col items-center gap-2">
                  <div className={`p-3 rounded-2xl ${action.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-center">{action.label}</span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Accounts */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Akun Saya</CardTitle>
          <Link href="/accounts">
            <Button variant="ghost" size="sm" className="text-primary h-8 px-2">
              Kelola <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {visibleAccounts.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground text-sm">Belum ada akun</p>
              <Link href="/accounts">
                <Button className="mt-3" size="sm">
                  <Plus className="h-4 w-4 mr-2" /> Tambah Akun
                </Button>
              </Link>
            </div>
          ) : (
            visibleAccounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AccountLogo name={acc.name} color={acc.color} size="sm" />
                  <div>
                    <p className="font-medium text-sm">{acc.name}</p>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                      {getAccountTypeLabel(acc.type)}
                    </Badge>
                  </div>
                </div>
                <p className="font-semibold text-sm">
                  {showBalance ? formatCurrency(acc.currentBalance, acc.currency) : "Rp ••••"}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Expense Chart */}
      {chartData.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pengeluaran Bulan Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <ResponsiveContainer width="40%" height={150}>
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="amount">
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2 justify-center flex flex-col">
                {chartData.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-muted-foreground truncate flex-1">{item.name}</span>
                    <span className="text-xs font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
