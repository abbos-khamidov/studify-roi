import { NextResponse } from "next/server";
import { exportAllJson } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = exportAllJson();
    const { openai_key, ...settingsRest } = data.settings as Record<string, unknown>;
    const safe = {
      ...data,
      settings: { ...settingsRest, openai_key: openai_key ? "[REDACTED]" : "" },
    };
    return NextResponse.json(safe);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
