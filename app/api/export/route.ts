import { NextResponse } from "next/server";
import { serverError } from "@/lib/api-error";
import { exportAllJson } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await exportAllJson();
    const { openai_key, ...settingsRest } = data.settings as Record<string, unknown>;
    const safe = {
      ...data,
      settings: { ...settingsRest, openai_key: openai_key ? "[REDACTED]" : "" },
    };
    return NextResponse.json(safe);
  } catch (e) {
    console.error(e);
    return serverError(e);
  }
}
