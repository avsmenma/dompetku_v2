"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Eye, EyeOff, Wallet, Loader2 } from "lucide-react";
import { AccountLogo } from "@/components/ui/account-logo";
import { formatCurrency, getAccountTypeLabel } from "@/lib/utils";

interface Account {
  id: number; name: string; type: string;
  currentBalance: number; currency: string; color: string;
  isHidden: boolean; priorityOrder: number;
}

const COLORS = ["#6366f1","#8b5cf6","#ec4899","#ef4444","#f97316","#eab308","#22c55e","#10b981","#06b6d4","#3b82f6"];

const defaultForm = { name: "", type: "cash", currentBalance: 0, currency: "IDR", color: "#6366f1" };

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const loadAccounts = useCallback(async () => {
    const res = await fetch("/api/accounts");
    if (res.ok) setAccounts(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const openAdd = () => { setEditAccount(null); setForm(defaultForm); setOpen(true); };
  const openEdit = (acc: Account) => {
    setEditAccount(acc);
    setForm({ name: acc.name, type: acc.type, currentBalance: acc.currentBalance, currency: acc.currency, color: acc.color });
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editAccount) {
        await fetch("/api/accounts", {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editAccount.id, ...form }),
        });
      } else {
        await fetch("/api/accounts", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      setOpen(false);
      await loadAccounts();
    } finally { setSaving(false); }
  };

  const handleToggleHide = async (acc: Account) => {
    await fetch("/api/accounts", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: acc.id, isHidden: !acc.isHidden }),
    });
    await loadAccounts();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/accounts?id=${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    await loadAccounts();
  };

  const sorted = [...accounts].sort((a, b) => a.priorityOrder - b.priorityOrder);
  const totalBalance = accounts.filter(a => !a.isHidden).reduce((s, a) => s + a.currentBalance, 0);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold">Akun Saya</h1>
          <p className="text-sm text-muted-foreground">Total: {formatCurrency(totalBalance)}</p>
        </div>
        <Button onClick={openAdd} size="sm" className="rounded-xl">
          <Plus className="h-4 w-4 mr-1" /> Tambah
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
      ) : sorted.length === 0 ? (
        <Card className="border-dashed border-2 border-muted">
          <CardContent className="flex flex-col items-center py-12 gap-3">
            <div className="bg-muted p-4 rounded-2xl"><Wallet className="h-8 w-8 text-muted-foreground" /></div>
            <p className="text-muted-foreground text-sm font-medium">Belum ada akun</p>
            <Button onClick={openAdd} size="sm"><Plus className="h-4 w-4 mr-1" /> Tambah Akun Pertama</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((acc) => (
            <Card key={acc.id} className={`border-0 shadow-sm ${acc.isHidden ? "opacity-60" : ""}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <AccountLogo name={acc.name} color={acc.color} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{acc.name}</p>
                    {acc.isHidden && <Badge variant="secondary" className="text-[10px]">Tersembunyi</Badge>}
                  </div>
                  <Badge variant="outline" className="text-[10px] h-4 mt-0.5">{getAccountTypeLabel(acc.type)}</Badge>
                  <p className="font-bold text-primary mt-1">{formatCurrency(acc.currentBalance, acc.currency)}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleHide(acc)}>
                    {acc.isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(acc)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(acc.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>{editAccount ? "Edit Akun" : "Tambah Akun"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Akun</Label>
              <Input placeholder="Contoh: BCA, Cash, Gopay" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Tipe Akun</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Uang Tunai</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="ewallet">E-Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!editAccount && (
              <div className="space-y-1.5">
                <Label>Saldo Awal (Rp)</Label>
                <Input type="number" placeholder="0" value={form.currentBalance}
                  onChange={(e) => setForm({ ...form, currentBalance: Number(e.target.value) })} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Warna</Label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button key={c} onClick={() => setForm({ ...form, color: c })}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${form.color === c ? "border-gray-800 scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving || !form.name}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader><DialogTitle>Hapus Akun?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Semua transaksi terkait akun ini juga akan terhapus.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
