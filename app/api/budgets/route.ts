import { NextRequest, NextResponse } from "next/server";
import { db, initializeDatabase } from "@/lib/db";
import { budgets, transactions, categories } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { getStartOfMonth, getEndOfMonth } from "@/lib/utils";

const budgetSchema = z.object({
  categoryId: z.number(),
  limitAmount: z.number().positive(),
  period: z.enum(["monthly", "weekly"]).default("monthly"),
  startDate: z.string(),
  endDate: z.string(),
});

export async function GET() {
  try {
    initializeDatabase();
    const session = await requireAuth();

    const allBudgets = await db
      .select({
        id: budgets.id,
        userId: budgets.userId,
        categoryId: budgets.categoryId,
        limitAmount: budgets.limitAmount,
        period: budgets.period,
        startDate: budgets.startDate,
        endDate: budgets.endDate,
        createdAt: budgets.createdAt,
        categoryName: categories.name,
        categoryIcon: categories.icon,
        categoryColor: categories.color,
      })
      .from(budgets)
      .leftJoin(categories, eq(budgets.categoryId, categories.id))
      .where(eq(budgets.userId, session.userId))
      .all();

    const startOfMonth = getStartOfMonth();
    const endOfMonth = getEndOfMonth();

    const budgetsWithSpent = await Promise.all(allBudgets.map(async (budget) => {
      const spentTxs = await db
        .select({ amount: transactions.amount })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, session.userId),
            eq(transactions.type, "expense"),
            eq(transactions.categoryId, budget.categoryId),
            gte(transactions.transactionDate, budget.period === "monthly" ? startOfMonth : budget.startDate),
            lte(transactions.transactionDate, budget.period === "monthly" ? endOfMonth : budget.endDate)
          )
        )
        .all();

      const spent = spentTxs.reduce((sum, t) => sum + t.amount, 0);

      return { ...budget, spent };
    }));

    return NextResponse.json(budgetsWithSpent);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDatabase();
    const session = await requireAuth();
    const body = await request.json();
    const data = budgetSchema.parse(body);

    const [budget] = await db
      .insert(budgets)
      .values({ ...data, userId: session.userId })
      .returning();

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }
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
      .delete(budgets)
      .where(and(eq(budgets.id, id), eq(budgets.userId, session.userId)));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
