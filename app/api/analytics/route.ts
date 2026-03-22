import { NextResponse } from "next/server";
import { getAnalytics } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getAnalytics();
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Analytics failed" }, { status: 500 });
  }
}
