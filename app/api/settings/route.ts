import { NextResponse } from "next/server";
import { serverError } from "@/lib/api-error";
import { getSettings, updateSettings } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_CACHE = { "Cache-Control": "no-store, no-cache, must-revalidate" };

export async function GET() {
  try {
    const s = await getSettings();
    const { openai_key, ...rest } = s;
    const currencyOut = rest.currency === "EUR" ? "EUR" : "UZS";
    const masked =
      openai_key.length > 8
        ? `${openai_key.slice(0, 4)}…${openai_key.slice(-4)}`
        : openai_key
          ? "••••••••"
          : "";
    return NextResponse.json({
      ...rest,
      currency: currencyOut,
      openai_key_masked: masked,
      has_openai_key: Boolean(openai_key),
    }, { headers: NO_CACHE });
  } catch (e) {
    console.error(e);
    return serverError(e);
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
    if (body.currency !== undefined) {
      let c = String(body.currency);
      if (c === "USD") c = "UZS";
      patch.currency = c;
    }
    if (body.company_name !== undefined) patch.company_name = String(body.company_name);
    if (body.monthly_revenue_target !== undefined) {
      patch.monthly_revenue_target = Number(body.monthly_revenue_target);
    }
    if (patch.currency && !["UZS", "EUR"].includes(String(patch.currency))) {
      return NextResponse.json({ error: "Invalid currency" }, { status: 400 });
    }
    const updated = await updateSettings(patch);
    const { openai_key, ...rest } = updated;
    const currencyOut = rest.currency === "EUR" ? "EUR" : "UZS";
    return NextResponse.json({
      ...rest,
      currency: currencyOut,
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
    return serverError(e);
  }
}
