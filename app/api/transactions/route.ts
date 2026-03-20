import { NextRequest, NextResponse } from "next/server";
import { db, initializeDatabase } from "@/lib/db";
import { transactions, accounts } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

const transactionSchema = z.object({
  accountId: z.number(),
  type: z.enum(["income", "expense", "transfer"]),
  amount: z.number().positive(),
  categoryId: z.number().optional().nullable(),
  description: z.string().optional().nullable(),
  transactionDate: z.string(),
  relatedAccountId: z.number().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    initializeDatabase();
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");

    let query = db
      .select({
        id: transactions.id,
        accountId: transactions.accountId,
        userId: transactions.userId,
        type: transactions.type,
        amount: transactions.amount,
        categoryId: transactions.categoryId,
        description: transactions.description,
        transactionDate: transactions.transactionDate,
        relatedAccountId: transactions.relatedAccountId,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .where(eq(transactions.userId, session.userId))
      .$dynamic();

    const allTx = await query.orderBy(desc(transactions.transactionDate));

    let filtered = allTx;
    if (startDate) filtered = filtered.filter((t) => t.transactionDate >= startDate);
    if (endDate) filtered = filtered.filter((t) => t.transactionDate <= endDate);
    if (type && type !== "all") filtered = filtered.filter((t) => t.type === type);

    return NextResponse.json(filtered);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDatabase();
    const session = await requireAuth();
    const body = await request.json();
    const data = transactionSchema.parse(body);

    const account = db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, data.accountId), eq(accounts.userId, session.userId)))
      .get();

    if (!account) {
      return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
    }

    if (data.type === "transfer") {
      if (!data.relatedAccountId) {
        return NextResponse.json({ error: "Akun tujuan diperlukan untuk transfer" }, { status: 400 });
      }

      const targetAccount = db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, data.relatedAccountId), eq(accounts.userId, session.userId)))
        .get();

      if (!targetAccount) {
        return NextResponse.json({ error: "Akun tujuan tidak ditemukan" }, { status: 404 });
      }

      await db.update(accounts).set({ currentBalance: account.currentBalance - data.amount }).where(eq(accounts.id, data.accountId));
      await db.update(accounts).set({ currentBalance: targetAccount.currentBalance + data.amount }).where(eq(accounts.id, data.relatedAccountId));
    } else if (data.type === "income") {
      await db.update(accounts).set({ currentBalance: account.currentBalance + data.amount }).where(eq(accounts.id, data.accountId));
    } else if (data.type === "expense") {
      await db.update(accounts).set({ currentBalance: account.currentBalance - data.amount }).where(eq(accounts.id, data.accountId));
    }

    const [tx] = await db
      .insert(transactions)
      .values({ ...data, userId: session.userId })
      .returning();

    return NextResponse.json(tx, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid", details: error.errors }, { status: 400 });
    }
    console.error("Transaction error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    initializeDatabase();
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0");

    const tx = db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, session.userId)))
      .get();

    if (!tx) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    const account = db.select().from(accounts).where(eq(accounts.id, tx.accountId)).get();

    if (account) {
      if (tx.type === "income") {
        await db.update(accounts).set({ currentBalance: account.currentBalance - tx.amount }).where(eq(accounts.id, tx.accountId));
      } else if (tx.type === "expense") {
        await db.update(accounts).set({ currentBalance: account.currentBalance + tx.amount }).where(eq(accounts.id, tx.accountId));
      } else if (tx.type === "transfer" && tx.relatedAccountId) {
        const relatedAccount = db.select().from(accounts).where(eq(accounts.id, tx.relatedAccountId)).get();
        await db.update(accounts).set({ currentBalance: account.currentBalance + tx.amount }).where(eq(accounts.id, tx.accountId));
        if (relatedAccount) {
          await db.update(accounts).set({ currentBalance: relatedAccount.currentBalance - tx.amount }).where(eq(accounts.id, tx.relatedAccountId));
        }
      }
    }

    await db.delete(transactions).where(eq(transactions.id, id));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
