import { NextRequest, NextResponse } from "next/server";
import { db, initializeDatabase } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    const body = await request.json();
    const { name, email, password } = registerSchema.parse(body);

    const existing = await db.select().from(users).where(eq(users.email, email)).get();
    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db
      .insert(users)
      .values({ name, email, passwordHash, currencyDefault: "IDR" })
      .returning();

    await createSession({ userId: user.id, email: user.email, name: user.name });

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid", details: error.errors }, { status: 400 });
    }
    console.error("Register error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
