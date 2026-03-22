import { NextResponse } from "next/server";
import { serverError } from "@/lib/api-error";
import { createTransaction, listTransactions } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? undefined;
    const category_id = searchParams.get("category_id");
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const sort = searchParams.get("sort") ?? undefined;
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";
    const result = await listTransactions({
      type: type === "income" || type === "expense" ? type : undefined,
      category_id: category_id ? Number(category_id) : undefined,
      from,
      to,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sort,
      order,
    });
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return serverError(e);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.type !== "income" && body.type !== "expense") {
      return NextResponse.json({ error: "type must be income or expense" }, { status: 400 });
    }
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (!body.date || typeof body.date !== "string") {
      return NextResponse.json({ error: "date required" }, { status: 400 });
    }
    const row = await createTransaction({
      type: body.type,
      amount,
      description: body.description ?? null,
      category_id: body.category_id != null ? Number(body.category_id) : null,
      date: body.date,
      is_recurring: body.is_recurring ? 1 : 0,
    });
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error(e);
    return serverError(e);
  }
}
