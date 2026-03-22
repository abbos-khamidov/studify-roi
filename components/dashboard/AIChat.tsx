"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { Card } from "@/components/ui/Card";

type Msg = { role: "user" | "assistant"; content: string };

export function AIChat() {
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

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="flex h-[min(560px,70vh)] flex-col p-5">
        <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">
          AI-аналитик
        </h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Контекст: последние данные и фиксированные расходы. Добавьте ключ OpenAI в настройках.
        </p>
        <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-xl bg-[var(--bg-tertiary)]/60 p-3">
          {messages.length === 0 && (
            <p className="text-center text-sm text-[var(--text-muted)]">
              Спросите про расходы, маржу или план продаж.
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[95%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                m.role === "user"
                  ? "ml-auto bg-[var(--accent-primary)] text-white"
                  : "mr-auto border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
              }`}
            >
              {m.content}
            </div>
          ))}
          {loading && (
            <p className="text-sm text-[var(--text-muted)]">Думаю…</p>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-[var(--accent-danger)]">{error}</p>}
        <div className="mt-3 flex gap-2">
          <input
            className="flex-1 rounded-pill border border-[var(--border)] bg-[var(--bg-tertiary)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            placeholder="Сообщение…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
          />
          <button
            type="button"
            onClick={send}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-pill bg-[var(--accent-primary)] px-5 py-2.5 text-white transition hover:bg-[var(--accent-primary-hover)] disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </Card>
    </motion.div>
  );
}
