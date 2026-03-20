import { NextRequest, NextResponse } from "next/server";
import { db, initializeDatabase } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    initializeDatabase();

    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const user = await db.select().from(users).where(eq(users.email, email)).get();
    if (!user) {
      return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
    }

    await createSession({ userId: user.id, email: user.email, name: user.name });

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }
    console.error("Login error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
