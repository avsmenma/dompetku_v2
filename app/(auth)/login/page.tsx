"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getProfile, saveProfile } from "@/lib/db/local";
import { Wallet, Shield, Smartphone } from "lucide-react";

export default function WelcomePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [step, setStep] = useState<"welcome" | "name">("welcome");

  useEffect(() => {
    const profile = getProfile();
    if (profile?.name) router.replace("/dashboard");
  }, [router]);

  const handleStart = () => {
    if (!name.trim()) return;
    saveProfile(name.trim());
    router.replace("/dashboard");
  };

  if (step === "name") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Wallet className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Siapa nama kamu?</h1>
            <p className="text-violet-200 text-sm">
              Nama ini akan ditampilkan di dashboard kamu
            </p>
          </div>

          <div className="space-y-3">
            <Input
              placeholder="Masukkan nama kamu..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
              className="h-14 text-base bg-white/10 border-white/20 text-white placeholder:text-violet-300 rounded-2xl focus:bg-white/20"
              autoFocus
            />
            <Button
              onClick={handleStart}
              disabled={!name.trim()}
              className="w-full h-14 text-base bg-white text-violet-700 hover:bg-violet-50 rounded-2xl font-bold shadow-lg"
            >
              Mulai →
            </Button>
          </div>

          <p className="text-center text-violet-300 text-xs pt-4">
            Mas Febri Adithya — Aplikasi 100% Gratis
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center shadow-2xl">
          <Wallet className="h-12 w-12 text-white" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white tracking-tight">Dompetku</h1>
          <p className="text-violet-200 text-lg">Catat keuangan pribadi kamu</p>
        </div>

        {/* Features */}
        <div className="space-y-3 w-full max-w-xs mt-4">
          {[
            { icon: Shield, text: "Data 100% tersimpan di hp kamu" },
            { icon: Smartphone, text: "Bekerja tanpa internet (offline)" },
            { icon: Wallet, text: "Gratis selamanya, tanpa iklan" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 bg-white/10 rounded-2xl px-4 py-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Icon className="h-4 w-4 text-white" />
              </div>
              <span className="text-white text-sm font-medium">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="p-6 space-y-3">
        <Button
          onClick={() => setStep("name")}
          className="w-full h-14 text-base bg-white text-violet-700 hover:bg-violet-50 rounded-2xl font-bold shadow-lg"
        >
          Mulai Sekarang
        </Button>
        <p className="text-center text-violet-300 text-xs">
          Mas Febri Adithya — Aplikasi 100% Gratis
        </p>
      </div>
    </div>
  );
}
