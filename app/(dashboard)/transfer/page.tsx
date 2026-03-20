"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDown, Loader2, CheckCircle } from "lucide-react";
import { formatCurrency, formatDateInput } from "@/lib/utils";
import { localDb, type Account } from "@/lib/db/local";

export default function TransferPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(formatDateInput(new Date()));
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const loadAccounts = useCallback(async () => {
    const accs = await localDb.accounts.toArray();
    setAccounts(accs);
  }, []);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const fromAccount = accounts.find(a => String(a.id) === fromId);
  const toAccount = accounts.find(a => String(a.id) === toId);
  const amountNum = Number(amount);
  const isInsufficient = fromAccount && amountNum > fromAccount.currentBalance;
  const canSave = fromId && toId && fromId !== toId && amount && amountNum > 0 && !isInsufficient;

  const handleSave = async () => {
    if (!canSave || !fromAccount || !toAccount) return;
    setSaving(true);
    try {
      const fromAcc = await localDb.accounts.get(Number(fromId));
      const toAcc = await localDb.accounts.get(Number(toId));
      if (!fromAcc || !toAcc) return;

      // Add transfer transaction
      await localDb.transactions.add({
        accountId: Number(fromId),
        type: "transfer",
        amount: amountNum,
        categoryId: null,
        description: description || null,
        transactionDate: date,
        relatedAccountId: Number(toId),
        createdAt: new Date().toISOString(),
      });

      // Update balances
      await localDb.accounts.update(Number(fromId), { currentBalance: fromAcc.currentBalance - amountNum });
      await localDb.accounts.update(Number(toId), { currentBalance: toAcc.currentBalance + amountNum });

      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    } finally { setSaving(false); }
  };

  if (success) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="bg-green-100 p-6 rounded-full"><CheckCircle className="h-12 w-12 text-green-600" /></div>
        <h2 className="text-xl font-bold">Transfer Berhasil!</h2>
        <p className="text-muted-foreground text-sm">Saldo telah dipindahkan</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <h1 className="text-xl font-bold">Transfer Antar Akun</h1>
        <p className="text-sm text-muted-foreground">Pindahkan saldo antar akunmu</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-5 space-y-5">
          <div className="space-y-1.5">
            <Label>Dari Akun</Label>
            <Select value={fromId} onValueChange={setFromId}>
              <SelectTrigger><SelectValue placeholder="Pilih akun sumber..." /></SelectTrigger>
              <SelectContent>
                {accounts.map(a => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: a.color }} />
                      {a.name} — {formatCurrency(a.currentBalance, a.currency)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fromAccount && (
              <p className="text-xs text-muted-foreground">
                Saldo: <span className="font-semibold text-foreground">{formatCurrency(fromAccount.currentBalance, fromAccount.currency)}</span>
              </p>
            )}
          </div>

          <div className="flex justify-center">
            <div className="bg-primary/10 p-3 rounded-full"><ArrowDown className="h-5 w-5 text-primary" /></div>
          </div>

          <div className="space-y-1.5">
            <Label>Ke Akun</Label>
            <Select value={toId} onValueChange={setToId}>
              <SelectTrigger><SelectValue placeholder="Pilih akun tujuan..." /></SelectTrigger>
              <SelectContent>
                {accounts.filter(a => String(a.id) !== fromId).map(a => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: a.color }} />
                      {a.name} — {formatCurrency(a.currentBalance, a.currency)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {toAccount && (
              <p className="text-xs text-muted-foreground">
                Saldo: <span className="font-semibold text-foreground">{formatCurrency(toAccount.currentBalance, toAccount.currency)}</span>
              </p>
            )}
          </div>

          {fromAccount && toAccount && amountNum > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Dari</span>
                <span className="font-medium">{fromAccount.name}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">Ke</span>
                <span className="font-medium">{toAccount.name}</span>
              </div>
              <div className="flex justify-between text-sm mt-1 pt-2 border-t border-primary/20">
                <span className="font-semibold">Jumlah Transfer</span>
                <span className="font-bold text-primary">{formatCurrency(amountNum)}</span>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Jumlah (Rp)</Label>
            <Input type="number" placeholder="0" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`text-lg font-bold ${isInsufficient ? "border-destructive" : ""}`} />
            {isInsufficient && <p className="text-xs text-destructive">Saldo tidak mencukupi</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Tanggal</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Catatan (opsional)</Label>
            <Input placeholder="Misal: Top-up Gopay, Tarik Tunai BCA..."
              value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <Button onClick={handleSave} disabled={!canSave || saving} className="w-full h-12 text-base">
            {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
            Transfer Sekarang
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
