import { NextResponse } from "next/server";
import { serverError } from "@/lib/api-error";
import { getCategory, hardDeleteCategory, updateCategory } from "@/lib/queries";

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
    const patch: Parameters<typeof updateCategory>[1] = {};
    if (body.name != null) patch.name = String(body.name).trim();
    if (body.type === "income" || body.type === "expense") patch.type = body.type;
    if (body.color != null) patch.color = String(body.color);
    if (body.icon != null) patch.icon = String(body.icon);
    if (body.is_active !== undefined) patch.is_active = body.is_active ? 1 : 0;
    const row = await updateCategory(id, patch);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (e) {
    console.error(e);
    return serverError(e);
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const { id: idStr } = ctx.params;
    const id = Number(idStr);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const cur = await getCategory(id);
    if (!cur) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (new URL(req.url).searchParams.get("permanent") !== "1") {
      return NextResponse.json(
        { error: "Деактивация: PUT с is_active. Полное удаление: DELETE ?permanent=1" },
        { status: 400 }
      );
    }
    await hardDeleteCategory(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return serverError(e);
  }
}
