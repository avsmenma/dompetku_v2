"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfile } from "@/lib/db/local";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ensureDefaultCategories } from "@/lib/db/local";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const profile = getProfile();
    if (!profile?.name) {
      router.replace("/login");
      return;
    }
    // Seed default categories
    ensureDefaultCategories().then(() => setReady(true));
  }, [router]);

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <main className="max-w-lg mx-auto pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
