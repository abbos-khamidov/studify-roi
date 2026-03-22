"use client";

import { format } from "date-fns";
import { useEffect, useState } from "react";
import { notifyFinanceDataChanged } from "@/lib/finance-invalidate";

type Cat = { id: number; name: string; type: string };

export function TransactionForm({
  categories,
  defaultType,
  onCreated,
}: {
  categories: Cat[];
  defaultType: "income" | "expense";
  onCreated: () => void;
}) {
  const [type, setType] = useState<"income" | "expense">(defaultType);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [recurring, setRecurring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setType(defaultType);
    setCategoryId("");
  }, [defaultType]);

  const filtered = categories.filter((c) => c.type === type);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const a = Number(amount);
    if (!Number.isFinite(a) || a <= 0) {
      setErr("Укажите сумму");
      return;
    }
    if (!categoryId) {
      setErr("Выберите категорию");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount: a,
          description: description || null,
          category_id: Number(categoryId),
          date,
          is_recurring: recurring,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setErr(d.error || "Ошибка");
        return;
      }
      setAmount("");
      setDescription("");
      setRecurring(false);
      onCreated();
      notifyFinanceDataChanged();
    } catch {
      setErr("Сеть");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex h-full flex-col space-y-4 rounded-card border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
      <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">Новая операция</h3>
      <div className="flex gap-2">
        {(["income", "expense"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setType(t);
              setCategoryId("");
            }}
            className={`rounded-pill px-4 py-2 text-sm font-medium transition ${
              type === t
                ? "bg-[var(--accent-primary)] text-white"
                : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
            }`}
          >
            {t === "income" ? "Доход" : "Расход"}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs text-[var(--text-muted)]">Сумма</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2 text-[var(--text-primary)]"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-[var(--text-muted)]">Дата</label>
          <input
            type="date"
            className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2 text-[var(--text-primary)]"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-[var(--text-muted)]">Категория</label>
        <select
          className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2 text-[var(--text-primary)]"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">—</option>
          {filtered.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs text-[var(--text-muted)]">Описание</label>
        <input
          className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2 text-[var(--text-primary)]"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
        <input
          type="checkbox"
          checked={recurring}
          onChange={(e) => setRecurring(e.target.checked)}
        />
        Повторяющаяся
      </label>
      {err && <p className="text-sm text-[var(--accent-danger)]">{err}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-pill bg-[var(--accent-primary)] py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 sm:w-auto sm:px-8"
      >
        {loading ? "Сохранение…" : "Добавить"}
      </button>
    </form>
  );
}
