import { NextResponse } from "next/server";
import { serverError } from "@/lib/api-error";
import { resetAllData } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await resetAllData();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return serverError(e);
  }
}
