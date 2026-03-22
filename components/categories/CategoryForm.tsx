"use client";

import { useState } from "react";
import clsx from "clsx";
import { notifyFinanceDataChanged } from "@/lib/finance-invalidate";

const PRESETS = [
  "#F97316",
  "#EA580C",
  "#16A34A",
  "#DC2626",
  "#0EA5E9",
  "#8B5CF6",
  "#EC4899",
  "#EAB308",
  "#14B8A6",
  "#64748B",
];

export function CategoryForm({
  type,
  onDone,
}: {
  type: "income" | "expense";
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(() => (type === "income" ? "#16A34A" : "#DC2626"));
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isIncome = type === "income";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), type, color }),
      });
      if (!res.ok) {
        const d = await res.json();
        setErr(d.error || "Ошибка");
        return;
      }
      setName("");
      notifyFinanceDataChanged();
      onDone();
    } catch {
      setErr("Сеть");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className={clsx(
        "flex h-full flex-col space-y-4 rounded-card border-2 bg-[var(--bg-secondary)] p-5",
        isIncome
          ? "border-[var(--accent-success)]/50"
          : "border-[var(--accent-danger)]/50"
      )}
    >
      <div>
        <span
          className={clsx(
            "inline-block rounded-pill px-3 py-1 text-xs font-bold uppercase tracking-wide text-white",
            isIncome ? "bg-[var(--accent-success)]" : "bg-[var(--accent-danger)]"
          )}
        >
          {isIncome ? "Доход" : "Расход"}
        </span>
        <h3 className="mt-3 font-display text-lg font-bold text-[var(--text-primary)]">
          {isIncome ? "Новая категория дохода" : "Новая категория расхода"}
        </h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {isIncome
            ? "Например: продажи курсов, консультации, подписки."
            : "Например: реклама, зарплата, налоги (переменная часть)."}
        </p>
      </div>
      <div>
        <label className="text-xs text-[var(--text-muted)]">Название</label>
        <input
          className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={isIncome ? "Название статьи дохода" : "Название статьи расхода"}
        />
      </div>
      <div>
        <p className="text-xs text-[var(--text-muted)]">Цвет на графиках</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={clsx(
                "h-8 w-8 rounded-full border-2",
                color === c ? "border-[var(--text-primary)]" : "border-transparent"
              )}
              style={{ background: c }}
              aria-label={`Цвет ${c}`}
            />
          ))}
        </div>
        <input
          type="color"
          className="mt-3 h-10 w-full cursor-pointer rounded-lg border border-[var(--border)]"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </div>
      {err && <p className="text-sm text-[var(--accent-danger)]">{err}</p>}
      <button
        type="submit"
        disabled={loading}
        className={clsx(
          "mt-auto rounded-pill px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50",
          isIncome ? "bg-[var(--accent-success)]" : "bg-[var(--accent-danger)]"
        )}
      >
        {loading ? "…" : "Создать"}
      </button>
    </form>
  );
}
