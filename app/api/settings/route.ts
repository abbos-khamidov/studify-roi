import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const s = getSettings();
    const { openai_key, ...rest } = s;
    const masked =
      openai_key.length > 8
        ? `${openai_key.slice(0, 4)}…${openai_key.slice(-4)}`
        : openai_key
          ? "••••••••"
          : "";
    return NextResponse.json({ ...rest, openai_key_masked: masked, has_openai_key: Boolean(openai_key) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const patch: Partial<{
      openai_key: string;
      currency: string;
      company_name: string;
      monthly_revenue_target: number;
    }> = {};
    if (body.openai_key !== undefined) patch.openai_key = String(body.openai_key);
    if (body.currency !== undefined) patch.currency = String(body.currency);
    if (body.company_name !== undefined) patch.company_name = String(body.company_name);
    if (body.monthly_revenue_target !== undefined) {
      patch.monthly_revenue_target = Number(body.monthly_revenue_target);
    }
    if (patch.currency && !["USD", "UZS", "EUR"].includes(String(patch.currency))) {
      return NextResponse.json({ error: "Invalid currency" }, { status: 400 });
    }
    const updated = updateSettings(patch);
    const { openai_key, ...rest } = updated;
    return NextResponse.json({
      ...rest,
      has_openai_key: Boolean(openai_key),
      openai_key_masked:
        openai_key.length > 8
          ? `${openai_key.slice(0, 4)}…${openai_key.slice(-4)}`
          : openai_key
            ? "••••••••"
            : "",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
