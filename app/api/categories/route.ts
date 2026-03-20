import { NextRequest, NextResponse } from "next/server";
import { db, initializeDatabase } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { or, eq, isNull } from "drizzle-orm";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1),
  type: z.enum(["income", "expense"]),
  icon: z.string().default("circle"),
  color: z.string().default("#6366f1"),
});

export async function GET() {
  try {
    initializeDatabase();
    const session = await requireAuth();
    const data = db
      .select()
      .from(categories)
      .where(or(eq(categories.userId, session.userId), isNull(categories.userId)))
      .all();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDatabase();
    const session = await requireAuth();
    const body = await request.json();
    const data = categorySchema.parse(body);

    const [category] = await db
      .insert(categories)
      .values({ ...data, userId: session.userId })
      .returning();

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
