"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, TrendingUp, TrendingDown, Loader2, ArrowUpDown } from "lucide-react";
import { formatCurrency, formatDate, formatDateInput } from "@/lib/utils";
import { localDb, type Account, type Category, type Transaction } from "@/lib/db/local";

const defaultForm = {
  type: "expense", accountId: "", categoryId: "", amount: "",
  description: "", transactionDate: formatDateInput(new Date()),
};

export default function TransactionsPage() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") || "all";

  const [transactions, setTransactions] = useState<(Transaction & { categoryName?: string; accountName?: string })[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState(initialType);
  const [periodFilter, setPeriodFilter] = useState("month");
  const [form, setForm] = useState({ ...defaultForm, type: initialType === "all" ? "expense" : initialType });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    const [txs, accs, cats] = await Promise.all([
      localDb.transactions.orderBy("transactionDate").reverse().toArray(),
      localDb.accounts.toArray(),
      localDb.categories.toArray(),
    ]);
    const catMap = Object.fromEntries(cats.map(c => [c.id!, c]));
    const accMap = Object.fromEntries(accs.map(a => [a.id!, a]));
    const enriched = txs.map(t => ({
      ...t,
      categoryName: t.categoryId ? catMap[t.categoryId]?.name : undefined,
      accountName: accMap[t.accountId]?.name,
    }));
    setTransactions(enriched);
    setAccounts(accs);
    setCategories(cats);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openAdd = () => {
    setForm({ ...defaultForm, type: filter === "all" ? "expense" : filter });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.accountId || !form.amount) return;
    setSaving(true);
    try {
      const amount = Number(form.amount);
      const accountId = Number(form.accountId);
      const acc = await localDb.accounts.get(accountId);
      if (!acc) return;

      // Add transaction
      await localDb.transactions.add({
        accountId,
        type: form.type as "income" | "expense",
        amount,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        description: form.description || null,
        transactionDate: form.transactionDate,
        relatedAccountId: null,
        createdAt: new Date().toISOString(),
      });

      // Update account balance
      const newBalance = form.type === "income"
        ? acc.currentBalance + amount
        : acc.currentBalance - amount;
      await localDb.accounts.update(accountId, { currentBalance: newBalance });

      setOpen(false);
      await loadData();
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const tx = await localDb.transactions.get(deleteId);
    if (tx) {
      const acc = await localDb.accounts.get(tx.accountId);
      if (acc) {
        const restored = tx.type === "income"
          ? acc.currentBalance - tx.amount
          : acc.currentBalance + tx.amount;
        await localDb.accounts.update(tx.accountId, { currentBalance: restored });
      }
      await localDb.transactions.delete(deleteId);
    }
    setDeleteId(null);
    await loadData();
  };

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const yearStr = `${now.getFullYear()}`;

  const filtered = transactions.filter(t => {
    const typeOk = filter === "all" ? t.type !== "transfer" : t.type === filter;
    let periodOk = true;
    if (periodFilter === "today") periodOk = t.transactionDate === todayStr;
    else if (periodFilter === "month") periodOk = t.transactionDate.startsWith(monthStr);
    else if (periodFilter === "year") periodOk = t.transactionDate.startsWith(yearStr);
    return typeOk && periodOk;
  });
  const filteredCategories = categories.filter(c => c.type === form.type);
  const accountMap = Object.fromEntries(accounts.map(a => [a.id!, a]));

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold">Transaksi</h1>
        <Button onClick={openAdd} size="sm" className="rounded-xl">
          <Plus className="h-4 w-4 mr-1" /> Tambah
        </Button>
      </div>

      <div className="flex gap-2 bg-muted p-1 rounded-xl">
        {[["all", "Semua"], ["income", "Pemasukan"], ["expense", "Pengeluaran"]].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${filter === val ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Period Filter */}
      <div className="flex gap-1.5">
        {([["today", "Hari Ini"], ["month", "Bulan Ini"], ["year", "Tahun Ini"], ["all", "Semua"]] as [string,string][]).map(([val, label]) => (
          <button key={val} onClick={() => setPeriodFilter(val)}
            className={`flex-1 py-1.5 text-[11px] font-medium rounded-lg border transition-colors ${
              periodFilter === val
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground bg-background hover:bg-muted"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-2 border-muted">
          <CardContent className="flex flex-col items-center py-12 gap-3">
            <ArrowUpDown className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">Belum ada transaksi</p>
            <Button onClick={openAdd} size="sm"><Plus className="h-4 w-4 mr-1" /> Tambah Transaksi</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((tx) => {
            const acc = accountMap[tx.accountId];
            const isIncome = tx.type === "income";
            return (
              <Card key={tx.id} className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isIncome ? "bg-green-100" : "bg-red-100"}`}>
                    {isIncome ? <TrendingUp className="h-5 w-5 text-green-600" /> : <TrendingDown className="h-5 w-5 text-red-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{tx.categoryName || tx.description || "Tanpa Kategori"}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {acc && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: acc.color }} />
                          {acc.name}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">• {formatDate(tx.transactionDate)}</span>
                    </div>
                    {tx.description && tx.categoryName && (
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{tx.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`font-bold text-sm ${isIncome ? "text-green-600" : "text-red-500"}`}>
                      {isIncome ? "+" : "-"}{formatCurrency(tx.amount)}
                    </p>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteId(tx.id!)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader><DialogTitle>Tambah Transaksi</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2 bg-muted p-1 rounded-xl">
              {[["income", "Pemasukan"], ["expense", "Pengeluaran"]].map(([val, label]) => (
                <button key={val} onClick={() => setForm({ ...form, type: val, categoryId: "" })}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${form.type === val ? "bg-background shadow-sm" : "text-muted-foreground"}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label>Jumlah (Rp)</Label>
              <Input type="number" placeholder="0" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })} className="text-lg font-bold" />
            </div>
            <div className="space-y-1.5">
              <Label>Akun</Label>
              <Select value={form.accountId} onValueChange={(v) => setForm({ ...form, accountId: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih akun..." /></SelectTrigger>
                <SelectContent>
                  {accounts.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih kategori..." /></SelectTrigger>
                <SelectContent>
                  {filteredCategories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tanggal</Label>
              <Input type="date" value={form.transactionDate}
                onChange={(e) => setForm({ ...form, transactionDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Catatan (opsional)</Label>
              <Input placeholder="Catatan transaksi..." value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving || !form.accountId || !form.amount}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader><DialogTitle>Hapus Transaksi?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Saldo akun akan dikembalikan ke sebelum transaksi.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
