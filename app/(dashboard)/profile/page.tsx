"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User, LogOut, Database, Shield, ChevronRight, Loader2 } from "lucide-react";

interface UserInfo { id: number; name: string; email: string; currencyDefault: string; }

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.user) setUser(data.user); });
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
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
              {user?.name.charAt(0).toUpperCase() || "?"}
            </div>
            <div>
              <p className="font-bold text-lg">{user?.name || "—"}</p>
              <p className="text-sm text-muted-foreground">{user?.email || "—"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Mata uang: {user?.currencyDefault || "IDR"}</p>
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
              <span className="text-xs text-muted-foreground">Lokal (SQLite)</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-xl"><Shield className="h-4 w-4 text-green-600" /></div>
                <span className="text-sm font-medium">Privasi</span>
              </div>
              <span className="text-xs text-muted-foreground">Data hanya di perangkat</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-xl"><User className="h-4 w-4 text-blue-600" /></div>
                <span className="text-sm font-medium">Versi</span>
              </div>
              <span className="text-xs text-muted-foreground">2.0.0</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="destructive"
        className="w-full h-12 text-base"
        onClick={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut
          ? <Loader2 className="h-5 w-5 animate-spin mr-2" />
          : <LogOut className="h-5 w-5 mr-2" />}
        Keluar
      </Button>

      <p className="text-center text-xs text-muted-foreground pb-4">
        Dompetku v2 — Keuangan pribadi, privat &amp; aman
      </p>
    </div>
  );
}
