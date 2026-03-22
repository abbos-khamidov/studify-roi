import { NextResponse } from "next/server";
import { deleteFixedCost, listFixedCosts, updateFixedCost } from "@/lib/queries";

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
    const patch: Parameters<typeof updateFixedCost>[1] = {};
    if (body.name != null) patch.name = String(body.name).trim();
    if (body.amount != null) {
      const a = Number(body.amount);
      if (!Number.isFinite(a) || a <= 0) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
      }
      patch.amount = a;
    }
    if (body.category_id !== undefined) {
      patch.category_id = body.category_id == null ? null : Number(body.category_id);
    }
    if (body.frequency && ["monthly", "quarterly", "yearly"].includes(body.frequency)) {
      patch.frequency = body.frequency;
    }
    if (body.is_active !== undefined) patch.is_active = body.is_active ? 1 : 0;
    const row = await updateFixedCost(id, patch);
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
    const exists = (await listFixedCosts()).some((f) => f.id === id);
    if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await deleteFixedCost(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
