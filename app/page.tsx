"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProfile } from "@/lib/db/local";

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    const profile = getProfile();
    if (profile?.name) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);
  return null;
}
