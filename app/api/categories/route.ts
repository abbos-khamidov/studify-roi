import { NextResponse } from "next/server";
import {
  createCategory,
  listCategories,
  listCategoriesWithStats,
} from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? undefined;
    const stats = searchParams.get("stats") === "1";
    if (stats) {
      const rows = listCategoriesWithStats({
        type: type === "income" || type === "expense" ? type : undefined,
        includeInactive: searchParams.get("include_inactive") === "1",
      });
      return NextResponse.json(rows);
    }
    const rows = listCategories({
      type: type === "income" || type === "expense" ? type : undefined,
      includeInactive: searchParams.get("include_inactive") === "1",
    });
    return NextResponse.json(rows);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to list categories" }, { status: 500 });
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
    const row = createCategory({
      name: body.name.trim(),
      type: body.type,
      color: body.color,
      icon: body.icon,
    });
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
