"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Database, Shield, User, Trash2, LogOut } from "lucide-react";
import { getProfile, clearProfile, localDb } from "@/lib/db/local";

export default function ProfilePage() {
  const router = useRouter();
  const profile = getProfile();
  const [clearDialog, setClearDialog] = useState(false);

  const handleLogout = () => {
    clearProfile();
    router.replace("/login");
  };

  const handleClearData = async () => {
    await Promise.all([
      localDb.accounts.clear(),
      localDb.transactions.clear(),
      localDb.budgets.clear(),
      localDb.categories.clear(),
    ]);
    clearProfile();
    router.replace("/login");
  };

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <h1 className="text-xl font-bold">Profil</h1>
      </div>

      {/* User Info Card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {profile?.name.charAt(0).toUpperCase() || "?"}
            </div>
            <div>
              <p className="font-bold text-lg">{profile?.name || "—"}</p>
              <p className="text-sm text-muted-foreground">Mata uang: {profile?.currency || "IDR"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Aplikasi</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            <div className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="bg-violet-100 p-2 rounded-xl"><Database className="h-4 w-4 text-violet-600" /></div>
                <span className="text-sm font-medium">Penyimpanan Data</span>
              </div>
              <span className="text-xs text-muted-foreground">Lokal (IndexedDB)</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-xl"><Shield className="h-4 w-4 text-green-600" /></div>
                <span className="text-sm font-medium">Privasi</span>
              </div>
              <span className="text-xs text-muted-foreground">Data hanya di perangkat ini</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-xl"><User className="h-4 w-4 text-blue-600" /></div>
                <span className="text-sm font-medium">Versi</span>
              </div>
              <span className="text-xs text-muted-foreground">2.1.0</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Button
        variant="outline"
        className="w-full h-12 text-base border-destructive text-destructive hover:bg-destructive/10"
        onClick={() => setClearDialog(true)}
      >
        <Trash2 className="h-5 w-5 mr-2" />
        Hapus Semua Data
      </Button>

      <Button
        variant="ghost"
        className="w-full h-12 text-base text-muted-foreground"
        onClick={handleLogout}
      >
        <LogOut className="h-5 w-5 mr-2" />
        Ganti Nama / Keluar
      </Button>

      <p className="text-center text-xs text-muted-foreground pb-4">
        Mas Febri Adithya — Aplikasi 100% Gratis
      </p>

      {/* Clear Data Dialog */}
      <Dialog open={clearDialog} onOpenChange={setClearDialog}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader><DialogTitle>Hapus Semua Data?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Semua akun, transaksi, budget, dan kategori akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setClearDialog(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleClearData}>Hapus Semua</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
