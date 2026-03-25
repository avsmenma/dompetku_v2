"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowLeft, Calendar, BarChart3, TrendingUp, TrendingDown, Info, Loader2 } from "lucide-react";
import { localDb, type Transaction } from "@/lib/db/local";

function compactNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  if (abs >= 1_000_000) return (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (abs >= 1_000) return (value / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return value.toFixed(0);
}

function formatFullCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function PnlCalendarPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "chart">("calendar");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  const loadData = useCallback(async () => {
    setLoading(true);
    const txs = await localDb.transactions.toArray();
    setTransactions(txs);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Calculate daily PnL
  const dailyPnl = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (tx.type === "transfer") return;
      if (!tx.transactionDate.startsWith(monthStr)) return;
      const day = tx.transactionDate;
      if (!map[day]) map[day] = 0;
      map[day] += tx.type === "income" ? tx.amount : -tx.amount;
    });
    return map;
  }, [transactions, monthStr]);

  // Monthly summary
  const monthlySummary = useMemo(() => {
    let income = 0, expense = 0;
    transactions.forEach((tx) => {
      if (tx.type === "transfer") return;
      if (!tx.transactionDate.startsWith(monthStr)) return;
      if (tx.type === "income") income += tx.amount;
      else expense += tx.amount;
    });
    return { income, expense, net: income - expense };
  }, [transactions, monthStr]);

  // Build calendar grid
  const calendarGrid = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const rows: { day: number | null; dateStr: string }[][] = [];
    let row: { day: number | null; dateStr: string }[] = [];

    // Fill leading blanks
    for (let i = 0; i < firstDay; i++) {
      row.push({ day: null, dateStr: "" });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      row.push({ day: d, dateStr });
      if (row.length === 7) {
        rows.push(row);
        row = [];
      }
    }

    // Fill trailing blanks
    if (row.length > 0) {
      while (row.length < 7) row.push({ day: null, dateStr: "" });
      rows.push(row);
    }

    return rows;
  }, [year, month]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  // Chart view: daily bars
  const chartData = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const data: { day: number; value: number; dateStr: string }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      data.push({ day: d, value: dailyPnl[dateStr] || 0, dateStr });
    }
    return data;
  }, [year, month, dailyPnl]);

  const maxAbsValue = useMemo(() => {
    const vals = chartData.map(d => Math.abs(d.value));
    return Math.max(...vals, 1);
  }, [chartData]);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push("/transactions")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl font-bold">PnL harian</h1>
            <div className="group relative">
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              <div className="absolute left-0 top-6 z-50 hidden group-hover:block w-56 p-2 bg-popover border border-border rounded-lg shadow-lg text-xs text-muted-foreground">
                PnL (Profit & Loss) menunjukkan selisih antara pemasukan dan pengeluaran per hari.
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-1 bg-muted p-0.5 rounded-lg">
          <button
            onClick={() => setViewMode("calendar")}
            className={`p-1.5 rounded-md transition-colors ${viewMode === "calendar" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
          >
            <Calendar className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("chart")}
            className={`p-1.5 rounded-md transition-colors ${viewMode === "chart" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
          >
            <BarChart3 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <span className="text-base font-semibold min-w-[100px] text-center">{monthStr}</span>
        <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-muted transition-colors">
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
      ) : viewMode === "calendar" ? (
        /* Calendar View */
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-border">
              {DAY_LABELS.map((label, i) => (
                <div key={i} className={`text-center py-2 text-xs font-semibold ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-muted-foreground"}`}>
                  {label}
                </div>
              ))}
            </div>

            {/* Calendar rows */}
            {calendarGrid.map((row, ri) => (
              <div key={ri} className="grid grid-cols-7 border-b border-border last:border-b-0">
                {row.map((cell, ci) => {
                  if (cell.day === null) {
                    return <div key={ci} className="h-16 bg-muted/30" />;
                  }

                  const pnl = dailyPnl[cell.dateStr] || 0;
                  const isToday = cell.dateStr === todayStr;

                  return (
                    <div
                      key={ci}
                      className={`h-16 flex flex-col items-center justify-center gap-0.5 border-r border-border last:border-r-0 transition-colors ${isToday ? "bg-primary/5" : "hover:bg-muted/50"}`}
                    >
                      {isToday ? (
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full leading-none">
                          Hari ini
                        </span>
                      ) : (
                        <span className={`text-xs font-medium ${ci === 0 ? "text-red-400" : ci === 6 ? "text-blue-400" : "text-foreground"}`}>
                          {String(cell.day).padStart(2, "0")}
                        </span>
                      )}
                      <span
                        className={`text-[11px] font-semibold leading-none ${
                          pnl > 0
                            ? "text-emerald-500"
                            : pnl < 0
                            ? "text-red-500"
                            : "text-muted-foreground/50"
                        }`}
                      >
                        {pnl > 0 ? "+" : ""}{pnl === 0 ? "0.00" : compactNumber(pnl)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        /* Chart View */
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="space-y-1">
              {chartData.map((d) => {
                const barWidth = maxAbsValue > 0 ? (Math.abs(d.value) / maxAbsValue) * 100 : 0;
                const isToday = d.dateStr === todayStr;
                return (
                  <div key={d.day} className={`flex items-center gap-2 py-0.5 ${isToday ? "bg-primary/5 rounded-md px-1 -mx-1" : ""}`}>
                    <span className={`text-[10px] w-5 text-right ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>
                      {d.day}
                    </span>
                    <div className="flex-1 h-4 bg-muted/50 rounded-full overflow-hidden relative">
                      {d.value !== 0 && (
                        <div
                          className={`h-full rounded-full transition-all ${d.value > 0 ? "bg-emerald-400" : "bg-red-400"}`}
                          style={{ width: `${Math.max(barWidth, 2)}%` }}
                        />
                      )}
                    </div>
                    <span className={`text-[10px] font-medium w-14 text-right ${d.value > 0 ? "text-emerald-500" : d.value < 0 ? "text-red-500" : "text-muted-foreground/50"}`}>
                      {d.value > 0 ? "+" : ""}{d.value === 0 ? "0" : compactNumber(d.value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Summary */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-[10px] text-muted-foreground font-medium">Pemasukan</span>
              </div>
              <p className="text-sm font-bold text-emerald-500">{formatFullCurrency(monthlySummary.income)}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                <span className="text-[10px] text-muted-foreground font-medium">Pengeluaran</span>
              </div>
              <p className="text-sm font-bold text-red-500">{formatFullCurrency(monthlySummary.expense)}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <BarChart3 className={`h-3.5 w-3.5 ${monthlySummary.net >= 0 ? "text-emerald-500" : "text-red-500"}`} />
                <span className="text-[10px] text-muted-foreground font-medium">Net PnL</span>
              </div>
              <p className={`text-sm font-bold ${monthlySummary.net >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {monthlySummary.net >= 0 ? "+" : ""}{formatFullCurrency(monthlySummary.net)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
