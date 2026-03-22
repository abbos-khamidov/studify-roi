import { NextResponse } from "next/server";
import { deleteTransaction, getTransaction, updateTransaction } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const { id: idStr } = ctx.params;
    const id = Number(idStr);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const body = await req.json();
    const patch: Parameters<typeof updateTransaction>[1] = {};
    if (body.type === "income" || body.type === "expense") patch.type = body.type;
    if (body.amount != null) {
      const a = Number(body.amount);
      if (!Number.isFinite(a) || a <= 0) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
      }
      patch.amount = a;
    }
    if (body.description !== undefined) patch.description = body.description;
    if (body.category_id !== undefined) {
      patch.category_id = body.category_id == null ? null : Number(body.category_id);
    }
    if (body.date != null) patch.date = String(body.date);
    if (body.is_recurring !== undefined) patch.is_recurring = body.is_recurring ? 1 : 0;
    const row = updateTransaction(id, patch);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { id: idStr } = ctx.params;
    const id = Number(idStr);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const cur = getTransaction(id);
    if (!cur) return NextResponse.json({ error: "Not found" }, { status: 404 });
    deleteTransaction(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
