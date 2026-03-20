"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, BarChart3, Loader2 } from "lucide-react";
import { formatCurrency, getStartOfMonth, getEndOfMonth } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

interface ReportData {
  totalIncome: number; totalExpense: number; netSaving: number;
  expenseByCategory: Array<{ name: string; amount: number; color: string }>;
  incomeByCategory: Array<{ name: string; amount: number; color: string }>;
  dailyData: Array<{ date: string; income: number; expense: number }>;
}

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];

export default function ReportsPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadReport = useCallback(async () => {
    setLoading(true);
    const start = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const end = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    const res = await fetch(`/api/reports?startDate=${start}&endDate=${end}`);
    if (res.ok) setReport(await res.json());
    setLoading(false);
  }, [selectedMonth, selectedYear]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const prevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  };
  const nextMonth = () => {
    const now = new Date();
    if (selectedYear === now.getFullYear() && selectedMonth === now.getMonth()) return;
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  };

  const isCurrentMonth = selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear();

  const dailyChartData = (report?.dailyData || []).map(d => ({
    day: d.date.slice(8),
    income: d.income,
    expense: d.expense,
  }));

  return (
    <div className="p-4 space-y-4">
      {/* Header + Month Picker */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold">Laporan</h1>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">‹</button>
          <span className="text-sm font-semibold min-w-[100px] text-center">
            {MONTHS[selectedMonth]} {selectedYear}
          </span>
          <button onClick={nextMonth} disabled={isCurrentMonth}
            className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold ${isCurrentMonth ? "opacity-40" : ""}`}>›</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <div className="flex justify-center mb-1.5">
                  <div className="bg-green-100 p-2 rounded-xl"><TrendingUp className="h-4 w-4 text-green-600" /></div>
                </div>
                <p className="text-[10px] text-muted-foreground">Pemasukan</p>
                <p className="font-bold text-xs mt-0.5 text-green-600">{formatCurrency(report?.totalIncome || 0)}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <div className="flex justify-center mb-1.5">
                  <div className="bg-red-100 p-2 rounded-xl"><TrendingDown className="h-4 w-4 text-red-500" /></div>
                </div>
                <p className="text-[10px] text-muted-foreground">Pengeluaran</p>
                <p className="font-bold text-xs mt-0.5 text-red-500">{formatCurrency(report?.totalExpense || 0)}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <div className="flex justify-center mb-1.5">
                  <div className={`p-2 rounded-xl ${(report?.netSaving || 0) >= 0 ? "bg-blue-100" : "bg-orange-100"}`}>
                    <Minus className={`h-4 w-4 ${(report?.netSaving || 0) >= 0 ? "text-blue-600" : "text-orange-500"}`} />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">Tabungan</p>
                <p className={`font-bold text-xs mt-0.5 ${(report?.netSaving || 0) >= 0 ? "text-blue-600" : "text-orange-500"}`}>
                  {formatCurrency(report?.netSaving || 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Bar Chart */}
          {dailyChartData.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Arus Kas Harian</CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={dailyChartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 9 }} tickFormatter={(v: number) => v >= 1000000 ? `${(v/1000000).toFixed(0)}jt` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="income" name="Pemasukan" fill="#22c55e" radius={[3,3,0,0]} />
                    <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Expense by Category */}
          {(report?.expenseByCategory || []).length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pengeluaran per Kategori</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <ResponsiveContainer width="45%" height={160}>
                    <PieChart>
                      <Pie data={report!.expenseByCategory} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="amount">
                        {report!.expenseByCategory.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2 justify-center flex flex-col">
                    {report!.expenseByCategory.slice(0, 6).map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-[11px] text-muted-foreground flex-1 truncate">{item.name}</span>
                        <span className="text-[11px] font-semibold">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Income by Category */}
          {(report?.incomeByCategory || []).length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pemasukan per Kategori</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {report!.incomeByCategory.map((item, i) => {
                  const total = report!.totalIncome;
                  const pct = total > 0 ? Math.round((item.amount / total) * 100) : 0;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs truncate">{item.name}</span>
                          <span className="text-xs font-semibold">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground w-20 text-right">{formatCurrency(item.amount)}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {!report?.totalIncome && !report?.totalExpense && (
            <Card className="border-dashed border-2 border-muted">
              <CardContent className="flex flex-col items-center py-12 gap-3">
                <BarChart3 className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">Belum ada data untuk bulan ini</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
