"use client";

import clsx from "clsx";
import { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { CEOHint } from "@/components/ui/CEOHint";

type Msg = { role: "user" | "assistant"; content: string };

type Props = {
  /** default — карточка на дашборде; sidebar — в левой колонке; page — полная страница /chat */
  variant?: "default" | "sidebar" | "page";
  className?: string;
};

export function AIChat({ variant = "default", className }: Props) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setLoading(true);
    try {
      const history = next.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: history.slice(0, -1) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка");
        return;
      }
      setMessages([...next, { role: "assistant", content: data.reply || "" }]);
    } catch {
      setError("Сеть недоступна");
    } finally {
      setLoading(false);
    }
  }

  const scrollArea = (
    <div
      className={clsx(
        "min-h-0 space-y-3 overflow-y-auto rounded-xl bg-[var(--bg-tertiary)]/60 p-3",
        variant === "sidebar" && "min-h-[160px] flex-1",
        variant === "default" && "mt-4 flex-1",
        variant === "page" && "mt-4 min-h-[45vh] flex-1"
      )}
    >
      {messages.length === 0 && (
        <p className="text-center text-sm text-[var(--text-muted)]">
          Спросите про расходы, маржу или план продаж.
        </p>
      )}
      {messages.map((m, i) => (
        <div
          key={i}
          className={clsx(
            "max-w-[95%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
            m.role === "user"
              ? "ml-auto bg-[var(--accent-primary)] text-white"
              : "mr-auto border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
          )}
        >
          {m.content}
        </div>
      ))}
      {loading && <p className="text-sm text-[var(--text-muted)]">Думаю…</p>}
    </div>
  );

  const inputRow = (
    <div className={clsx("flex gap-2", variant === "sidebar" ? "mt-2 shrink-0" : "mt-3")}>
      <input
        className="min-w-0 flex-1 rounded-pill border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
        placeholder="Вопрос…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
      />
      <button
        type="button"
        onClick={send}
        disabled={loading}
        className="inline-flex shrink-0 items-center justify-center rounded-pill bg-[var(--accent-primary)] px-4 py-2 text-white transition hover:bg-[var(--accent-primary-hover)] disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );

  if (variant === "sidebar") {
    return (
      <div
        className={clsx(
          "flex min-h-0 flex-1 flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-3",
          className
        )}
      >
        <h3 className="font-display text-sm font-bold text-[var(--text-primary)]">AI-аналитик</h3>
        <CEOHint>
          Ответы по вашим данным дашборда. Не заменяет бухгалтера.
        </CEOHint>
        {scrollArea}
        {error && <p className="mt-2 text-xs text-[var(--accent-danger)]">{error}</p>}
        {inputRow}
      </div>
    );
  }

  const body = (
    <>
      <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">AI-аналитик</h3>
      <CEOHint>
        Ответы строятся по вашим же цифрам из дашборда (выручка, расходы, фикс, категории). Не заменяет
        бухгалтера, но помогает сформулировать вопросы к цифрам.
      </CEOHint>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Добавьте ключ OpenAI в настройках, если чат не отвечает.
      </p>
      {scrollArea}
      {error && <p className="mt-2 text-sm text-[var(--accent-danger)]">{error}</p>}
      {inputRow}
    </>
  );

  if (variant === "page") {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={className}>
        <Card className="flex min-h-[70vh] flex-col p-5">{body}</Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={className}>
      <Card className="flex h-[min(560px,70vh)] min-h-0 flex-col p-5">{body}</Card>
    </motion.div>
  );
}
