"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, BarChart3, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { localDb } from "@/lib/db/local";

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [expenseByCategory, setExpenseByCategory] = useState<{name:string;amount:number;color:string}[]>([]);
  const [incomeByCategory, setIncomeByCategory] = useState<{name:string;amount:number;color:string}[]>([]);
  const [dailyData, setDailyData] = useState<{day:string;income:number;expense:number}[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadReport = useCallback(async () => {
    setLoading(true);
    const start = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const end = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const [txs, cats] = await Promise.all([
      localDb.transactions.where("transactionDate").between(start, end, true, true).toArray(),
      localDb.categories.toArray(),
    ]);
    const catMap = Object.fromEntries(cats.map(c => [c.id!, c]));

    const inc = txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const exp = txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    setTotalIncome(inc);
    setTotalExpense(exp);

    // By category
    const expByCat: Record<number, number> = {};
    const incByCat: Record<number, number> = {};
    txs.forEach(t => {
      if (!t.categoryId) return;
      if (t.type === "expense") expByCat[t.categoryId] = (expByCat[t.categoryId] || 0) + t.amount;
      if (t.type === "income") incByCat[t.categoryId] = (incByCat[t.categoryId] || 0) + t.amount;
    });
    setExpenseByCategory(
      Object.entries(expByCat).map(([id, amount]) => ({ name: catMap[+id]?.name || "Lain", amount, color: catMap[+id]?.color || "#6366f1" }))
        .sort((a, b) => b.amount - a.amount)
    );
    setIncomeByCategory(
      Object.entries(incByCat).map(([id, amount]) => ({ name: catMap[+id]?.name || "Lain", amount, color: catMap[+id]?.color || "#22c55e" }))
        .sort((a, b) => b.amount - a.amount)
    );

    // Daily
    const daily: Record<string, {income:number;expense:number}> = {};
    txs.forEach(t => {
      if (!daily[t.transactionDate]) daily[t.transactionDate] = { income: 0, expense: 0 };
      if (t.type === "income") daily[t.transactionDate].income += t.amount;
      if (t.type === "expense") daily[t.transactionDate].expense += t.amount;
    });
    setDailyData(Object.entries(daily).sort(([a],[b]) => a.localeCompare(b)).map(([date, v]) => ({ day: date.slice(8), ...v })));
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
  const netSaving = totalIncome - totalExpense;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold">Laporan</h1>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">‹</button>
          <span className="text-sm font-semibold min-w-[100px] text-center">{MONTHS[selectedMonth]} {selectedYear}</span>
          <button onClick={nextMonth} disabled={isCurrentMonth}
            className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold ${isCurrentMonth ? "opacity-40" : ""}`}>›</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <div className="flex justify-center mb-1.5">
                  <div className="bg-green-100 p-2 rounded-xl"><TrendingUp className="h-4 w-4 text-green-600" /></div>
                </div>
                <p className="text-[10px] text-muted-foreground">Pemasukan</p>
                <p className="font-bold text-xs mt-0.5 text-green-600">{formatCurrency(totalIncome)}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <div className="flex justify-center mb-1.5">
                  <div className="bg-red-100 p-2 rounded-xl"><TrendingDown className="h-4 w-4 text-red-500" /></div>
                </div>
                <p className="text-[10px] text-muted-foreground">Pengeluaran</p>
                <p className="font-bold text-xs mt-0.5 text-red-500">{formatCurrency(totalExpense)}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <div className="flex justify-center mb-1.5">
                  <div className={`p-2 rounded-xl ${netSaving >= 0 ? "bg-blue-100" : "bg-orange-100"}`}>
                    <Minus className={`h-4 w-4 ${netSaving >= 0 ? "text-blue-600" : "text-orange-500"}`} />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">Tabungan</p>
                <p className={`font-bold text-xs mt-0.5 ${netSaving >= 0 ? "text-blue-600" : "text-orange-500"}`}>{formatCurrency(netSaving)}</p>
              </CardContent>
            </Card>
          </div>

          {dailyData.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Arus Kas Harian</CardTitle></CardHeader>
              <CardContent className="px-2 pb-4">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={dailyData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
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

          {expenseByCategory.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Pengeluaran per Kategori</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <ResponsiveContainer width="45%" height={160}>
                    <PieChart>
                      <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="amount">
                        {expenseByCategory.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2 justify-center flex flex-col">
                    {expenseByCategory.slice(0, 6).map((item, i) => (
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

          {incomeByCategory.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Pemasukan per Kategori</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {incomeByCategory.map((item, i) => {
                  const pct = totalIncome > 0 ? Math.round((item.amount / totalIncome) * 100) : 0;
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

          {!totalIncome && !totalExpense && (
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
