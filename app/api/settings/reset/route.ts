import { NextResponse } from "next/server";
import { resetAllData } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    resetAllData();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}
