import { NextResponse } from "next/server";
import { getChatContext, getSettings } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Msg = { role: string; content: string };

export async function POST(req: Request) {
  try {
    const { message, history } = (await req.json()) as {
      message?: string;
      history?: Msg[];
    };
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }
    const settings = getSettings();
    if (!settings.openai_key) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 400 }
      );
    }

    const { analytics, fixedCosts, categories } = getChatContext();
    const trend3 = analytics.profit.trend.slice(-3);

    const systemPrompt = `Ты финансовый аналитик CEO агентства "${settings.company_name}" (study abroad agency в Узбекистане).
Валюта: ${settings.currency}

ТЕКУЩИЙ МЕСЯЦ:
- Revenue: ${analytics.revenue.total}
- Expenses (включая фикс): ${analytics.expenses.total}
- Переменные расходы: ${analytics.expenses.variable}
- Fixed costs (ежемес. эквивалент): ${analytics.expenses.fixedTotal}
- Net Profit: ${analytics.profit.net}
- Margin: ${analytics.profit.margin.toFixed(1)}%
- Target Revenue: ${settings.monthly_revenue_target}

РАСХОДЫ ПО КАТЕГОРИЯМ:
${analytics.expenses.byCategory.map((c) => `- ${c.name}: ${c.total}`).join("\n") || "(нет)"}

ДОХОДЫ ПО КАТЕГОРИЯМ:
${analytics.revenue.byCategory.map((c) => `- ${c.name}: ${c.total}`).join("\n") || "(нет)"}

ФИКСИРОВАННЫЕ РАСХОДЫ:
${fixedCosts.map((fc) => `- ${fc.name}: ${fc.amount}/${fc.frequency}`).join("\n") || "(нет)"}

КАТЕГОРИИ:
${categories.map((c) => `- ${c.name} (${c.type})`).join("\n") || "(нет)"}

ТРЕНД (последние 3 мес):
${trend3.map((t) => `${t.month}: revenue ${t.revenue}, expenses ${t.expenses}, profit ${t.profit}`).join("\n")}

Отвечай кратко, с цифрами, без воды. Формат: проблема → решение → ожидаемый эффект.
Можно использовать эмодзи: 📊 🎯 💰`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(Array.isArray(history) ? history.filter((m) => m.role && m.content).slice(-20) : []),
      { role: "user", content: message },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.openai_key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      const err = data?.error?.message ?? "OpenAI error";
      return NextResponse.json({ error: err }, { status: 502 });
    }
    const reply = data.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ reply });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
