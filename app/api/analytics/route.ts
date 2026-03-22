import { NextResponse } from "next/server";
import { serverError } from "@/lib/api-error";
import { getAnalytics } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_CACHE = { "Cache-Control": "no-store, no-cache, must-revalidate" };

export async function GET() {
  try {
    const data = await getAnalytics();
    return NextResponse.json(data, { headers: NO_CACHE });
  } catch (e) {
    console.error(e);
    return serverError(e);
  }
}
