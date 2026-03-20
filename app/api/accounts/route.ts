import { NextRequest, NextResponse } from "next/server";
import { db, initializeDatabase } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const accountSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["cash", "bank", "ewallet"]),
  currentBalance: z.number().default(0),
  currency: z.string().default("IDR"),
  color: z.string().default("#6366f1"),
});

export async function GET() {
  try {
    initializeDatabase();
    const session = await requireAuth();
    const data = db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, session.userId))
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
    const data = accountSchema.parse(body);

    const typeOrders: Record<string, number> = { cash: 0, bank: 1, ewallet: 2 };
    const priorityOrder = typeOrders[data.type] ?? 99;

    const [account] = await db
      .insert(accounts)
      .values({ ...data, userId: session.userId, priorityOrder })
      .returning();

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    initializeDatabase();
    const session = await requireAuth();
    const body = await request.json();
    const { id, ...data } = body;

    await db
      .update(accounts)
      .set(data)
      .where(and(eq(accounts.id, id), eq(accounts.userId, session.userId)));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    initializeDatabase();
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0");

    await db
      .delete(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, session.userId)));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
