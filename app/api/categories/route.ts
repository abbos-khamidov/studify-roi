import { NextResponse } from "next/server";
import { serverError } from "@/lib/api-error";
import {
  createCategory,
  listCategories,
  listCategoriesWithStats,
} from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_CACHE = { "Cache-Control": "no-store, no-cache, must-revalidate" };

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? undefined;
    const stats = searchParams.get("stats") === "1";
    if (stats) {
      const rows = await listCategoriesWithStats({
        type: type === "income" || type === "expense" ? type : undefined,
        includeInactive: searchParams.get("include_inactive") === "1",
      });
      return NextResponse.json(rows, { headers: NO_CACHE });
    }
    const rows = await listCategories({
      type: type === "income" || type === "expense" ? type : undefined,
      includeInactive: searchParams.get("include_inactive") === "1",
    });
    return NextResponse.json(rows, { headers: NO_CACHE });
  } catch (e) {
    console.error(e);
    return serverError(e);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }
    if (body.type !== "income" && body.type !== "expense") {
      return NextResponse.json({ error: "type must be income or expense" }, { status: 400 });
    }
    const row = await createCategory({
      name: body.name.trim(),
      type: body.type,
      color: body.color,
      icon: body.icon,
    });
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error(e);
    return serverError(e);
  }
}
