import { NextResponse } from "next/server";
import { createFixedCost, listFixedCosts } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await listFixedCosts());
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to list fixed costs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    const freq = body.frequency;
    if (freq && !["monthly", "quarterly", "yearly"].includes(freq)) {
      return NextResponse.json({ error: "Invalid frequency" }, { status: 400 });
    }
    const row = await createFixedCost({
      name: body.name.trim(),
      amount,
      category_id: body.category_id != null ? Number(body.category_id) : null,
      frequency: freq,
    });
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
