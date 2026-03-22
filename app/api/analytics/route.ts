import { NextResponse } from "next/server";
import { serverError } from "@/lib/api-error";
import { getAnalytics } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getAnalytics();
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return serverError(e);
  }
}
