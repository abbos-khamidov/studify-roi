"use client";

import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/format";
import { Plus, Trash2 } from "lucide-react";

type Fixed = {
  id: number;
  name: string;
  amount: number;
  category_id: number | null;
  frequency: string;
  is_active: number;
};

type Cat = { id: number; name: string };

export function FixedCostsPanel({
  currency,
  expenseCategories,
}: {
  currency: string;
  expenseCategories: Cat[];
}) {
  const [items, setItems] = useState<Fixed[]>([]);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/fixed-costs");
    setItems(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addFixed(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/fixed-costs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        amount: Number(fd.get("amount")),
        category_id: fd.get("category_id") ? Number(fd.get("category_id")) : null,
        frequency: fd.get("frequency"),
      }),
    });
    if (res.ok) {
      setOpen(false);
      (e.target as HTMLFormElement).reset();
      load();
    }
  }

  async function toggleActive(f: Fixed) {
    await fetch(`/api/fixed-costs/${f.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: f.is_active ? 0 : 1 }),
    });
    load();
  }

  async function confirmDelete() {
    if (deleteId == null) return;
    await fetch(`/api/fixed-costs/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    load();
  }

  const freqLabel: Record<string, string> = {
    monthly: "мес.",
    quarterly: "кв.",
    yearly: "год",
  };

  return (
    <div className="rounded-card border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">
            Фиксированные расходы
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            Учитываются в аналитике как ежемесячный эквивалент
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-pill bg-[var(--accent-primary)] px-4 py-2 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" />
          Добавить
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-[var(--text-secondary)]">
            <tr>
              <th className="p-2">Название</th>
              <th className="p-2">Сумма</th>
              <th className="p-2">Частота</th>
              <th className="p-2">Активен</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-[var(--text-muted)]">
                  Пока пусто
                </td>
              </tr>
            ) : (
              items.map((f) => (
                <tr key={f.id} className="border-t border-[var(--border)]">
                  <td className="p-2 font-medium text-[var(--text-primary)]">{f.name}</td>
                  <td className="p-2 font-mono-data">{formatCurrency(f.amount, currency)}</td>
                  <td className="p-2 text-[var(--text-secondary)]">
                    {freqLabel[f.frequency] ?? f.frequency}
                  </td>
                  <td className="p-2">
                    <button
                      type="button"
                      onClick={() => toggleActive(f)}
                      className={`rounded-pill px-3 py-1 text-xs ${
                        f.is_active
                          ? "bg-[var(--accent-success)]/15 text-[var(--accent-success)]"
                          : "bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
                      }`}
                    >
                      {f.is_active ? "Да" : "Нет"}
                    </button>
                  </td>
                  <td className="p-2 text-right">
                    <button
                      type="button"
                      className="inline-flex rounded-lg p-2 text-[var(--accent-danger)] hover:bg-[var(--bg-tertiary)]"
                      onClick={() => setDeleteId(f.id)}
                      aria-label="Удалить"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Новый фиксированный расход">
        <form onSubmit={addFixed} className="space-y-3">
          <div>
            <label className="text-xs text-[var(--text-muted)]">Название</label>
            <input
              name="name"
              required
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)]">Сумма</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              required
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)]">Частота</label>
            <select
              name="frequency"
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2"
              defaultValue="monthly"
            >
              <option value="monthly">Ежемесячно</option>
              <option value="quarterly">Ежеквартально</option>
              <option value="yearly">Ежегодно</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)]">Категория (опц.)</label>
            <select
              name="category_id"
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2"
            >
              <option value="">—</option>
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="rounded-pill border px-4 py-2 text-sm" onClick={() => setOpen(false)}>
              Отмена
            </button>
            <button type="submit" className="rounded-pill bg-[var(--accent-primary)] px-4 py-2 text-sm text-white">
              Сохранить
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={deleteId != null} onClose={() => setDeleteId(null)} title="Удалить?">
        <p className="text-sm text-[var(--text-secondary)]">Удалить фиксированный расход?</p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-pill border px-4 py-2 text-sm" onClick={() => setDeleteId(null)}>
            Отмена
          </button>
          <button
            type="button"
            className="rounded-pill bg-[var(--accent-danger)] px-4 py-2 text-sm text-white"
            onClick={confirmDelete}
          >
            Удалить
          </button>
        </div>
      </Modal>
    </div>
  );
}
