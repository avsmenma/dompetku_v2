"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, PieChart, Loader2, AlertTriangle } from "lucide-react";
import { formatCurrency, getStartOfMonth, getEndOfMonth } from "@/lib/utils";

interface Category { id: number; name: string; type: string; icon: string; color: string; }
interface Budget {
  id: number; categoryId: number; limitAmount: number; period: string;
  startDate: string; endDate: string; categoryName: string | null;
  categoryColor: string | null; categoryIcon: string | null; spent: number;
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({
    categoryId: "", limitAmount: "", period: "monthly",
    startDate: getStartOfMonth(), endDate: getEndOfMonth(),
  });

  const loadData = useCallback(async () => {
    const [budgetsRes, catsRes] = await Promise.all([
      fetch("/api/budgets"),
      fetch("/api/categories"),
    ]);
    if (budgetsRes.ok) setBudgets(await budgetsRes.json());
    if (catsRes.ok) setCategories((await catsRes.json()).filter((c: Category) => c.type === "expense"));
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    if (!form.categoryId || !form.limitAmount) return;
    setSaving(true);
    try {
      await fetch("/api/budgets", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: Number(form.categoryId),
          limitAmount: Number(form.limitAmount),
          period: form.period,
          startDate: form.startDate,
          endDate: form.endDate,
        }),
      });
      setOpen(false);
      setForm({ categoryId: "", limitAmount: "", period: "monthly", startDate: getStartOfMonth(), endDate: getEndOfMonth() });
      await loadData();
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/budgets?id=${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    await loadData();
  };

  const totalBudget = budgets.reduce((s, b) => s + b.limitAmount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold">Budget</h1>
          <p className="text-sm text-muted-foreground">Bulan ini</p>
        </div>
        <Button onClick={() => setOpen(true)} size="sm" className="rounded-xl">
          <Plus className="h-4 w-4 mr-1" /> Tambah
        </Button>
      </div>

      {/* Summary */}
      {budgets.length > 0 && (
        <Card className="bg-gradient-to-br from-violet-600 to-purple-700 text-white border-0">
          <CardContent className="p-5">
            <div className="flex justify-between mb-3">
              <div>
                <p className="text-violet-200 text-xs">Total Digunakan</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
              </div>
              <div className="text-right">
                <p className="text-violet-200 text-xs">Total Budget</p>
                <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
              </div>
            </div>
            <Progress value={totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0}
              className="h-2 bg-white/20 [&>div]:bg-white" />
            <p className="text-xs text-violet-200 mt-1.5 text-right">
              Sisa: {formatCurrency(Math.max(totalBudget - totalSpent, 0))}
            </p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
      ) : budgets.length === 0 ? (
        <Card className="border-dashed border-2 border-muted">
          <CardContent className="flex flex-col items-center py-12 gap-3">
            <div className="bg-muted p-4 rounded-2xl"><PieChart className="h-8 w-8 text-muted-foreground" /></div>
            <p className="text-muted-foreground text-sm font-medium">Belum ada budget</p>
            <Button onClick={() => setOpen(true)} size="sm"><Plus className="h-4 w-4 mr-1" /> Buat Budget</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => {
            const pct = budget.limitAmount > 0 ? Math.min((budget.spent / budget.limitAmount) * 100, 100) : 0;
            const isOver = budget.spent >= budget.limitAmount;
            const isNear = pct >= 80 && !isOver;
            return (
              <Card key={budget.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${budget.categoryColor || "#6366f1"}20` }}>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: budget.categoryColor || "#6366f1" }} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{budget.categoryName || "Kategori"}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{budget.period === "monthly" ? "Per Bulan" : "Per Minggu"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(isOver || isNear) && (
                        <AlertTriangle className={`h-4 w-4 ${isOver ? "text-destructive" : "text-yellow-500"}`} />
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteId(budget.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <Progress value={pct}
                    className={`h-2 mb-2 ${isOver ? "[&>div]:bg-destructive" : isNear ? "[&>div]:bg-yellow-500" : ""}`} />

                  <div className="flex justify-between text-xs">
                    <span className={isOver ? "text-destructive font-semibold" : "text-muted-foreground"}>
                      {isOver ? "Over budget!" : `${formatCurrency(budget.spent)} digunakan`}
                    </span>
                    <span className="text-muted-foreground">
                      dari {formatCurrency(budget.limitAmount)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader><DialogTitle>Tambah Budget</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Kategori Pengeluaran</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih kategori..." /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Batas Budget (Rp)</Label>
              <Input type="number" placeholder="Contoh: 1000000" value={form.limitAmount}
                onChange={(e) => setForm({ ...form, limitAmount: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Periode</Label>
              <Select value={form.period} onValueChange={(v) => setForm({ ...form, period: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                  <SelectItem value="weekly">Mingguan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving || !form.categoryId || !form.limitAmount}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader><DialogTitle>Hapus Budget?</DialogTitle></DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
