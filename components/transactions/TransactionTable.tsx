"use client";

import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/format";
import { Pencil, Trash2 } from "lucide-react";

type Row = {
  id: number;
  type: string;
  amount: number;
  description: string | null;
  category_id: number | null;
  category_name: string | null;
  date: string;
  is_recurring: number;
};

type Cat = { id: number; name: string; type: string };

export function TransactionTable({
  currency,
  categories,
  tabType,
}: {
  currency: string;
  categories: Cat[];
  tabType: "income" | "expense";
}) {
  const [items, setItems] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState("date");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [filterCat, setFilterCat] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<Row | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      type: tabType,
      page: String(page),
      limit: "20",
      sort,
      order,
    });
    if (filterCat) params.set("category_id", filterCat);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/transactions?${params}`);
    const data = await res.json();
    setItems(data.items || []);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }, [tabType, page, sort, order, filterCat, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  function toggleSort(col: string) {
    if (sort === col) setOrder(order === "asc" ? "desc" : "asc");
    else {
      setSort(col);
      setOrder("desc");
    }
    setPage(1);
  }

  async function confirmDelete() {
    if (deleteId == null) return;
    await fetch(`/api/transactions/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    load();
  }

  async function saveEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editRow) return;
    const fd = new FormData(e.currentTarget);
    const amount = Number(fd.get("amount"));
    const res = await fetch(`/api/transactions/${editRow.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        description: fd.get("description") || null,
        category_id: fd.get("category_id") ? Number(fd.get("category_id")) : null,
        date: fd.get("date"),
        is_recurring: fd.get("recurring") === "on" ? 1 : 0,
      }),
    });
    if (res.ok) {
      setEditRow(null);
      load();
    }
  }

  const catOptions = categories.filter((c) => c.type === tabType);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <select
          className="rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2 text-sm"
          value={filterCat}
          onChange={(e) => {
            setFilterCat(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Все категории</option>
          {catOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          title="С даты"
          aria-label="С даты"
          className="rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2 text-sm"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            setPage(1);
          }}
        />
        <input
          type="date"
          title="По дату"
          aria-label="По дату"
          className="rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2 text-sm"
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="overflow-x-auto rounded-card border border-[var(--border)]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
            <tr>
              {[
                ["date", "Дата"],
                ["type", "Тип"],
                ["category_name", "Категория"],
                ["description", "Описание"],
                ["amount", "Сумма"],
              ].map(([key, label]) => (
                <th key={key} className="p-3 font-medium">
                  <button type="button" className="hover:text-[var(--accent-primary)]" onClick={() => toggleSort(key)}>
                    {label}
                    {sort === key ? (order === "asc" ? " ↑" : " ↓") : ""}
                  </button>
                </th>
              ))}
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-[var(--text-muted)]">
                  Загрузка…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-[var(--text-muted)]">
                  Нет записей
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr key={r.id} className="border-t border-[var(--border)]">
                  <td className="p-3 font-mono-data text-[var(--text-primary)]">
                    {format(new Date(r.date + "T12:00:00"), "dd.MM.yyyy")}
                  </td>
                  <td className="p-3">
                    {r.type === "income" ? (
                      <span className="text-[var(--accent-success)]">Доход</span>
                    ) : (
                      <span className="text-[var(--accent-danger)]">Расход</span>
                    )}
                  </td>
                  <td className="p-3">{r.category_name ?? "—"}</td>
                  <td className="p-3 text-[var(--text-secondary)]">{r.description ?? "—"}</td>
                  <td className="p-3 font-mono-data font-medium text-[var(--text-primary)]">
                    {formatCurrency(r.amount, currency)}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      className="mr-2 inline-flex rounded-lg p-2 hover:bg-[var(--bg-tertiary)]"
                      onClick={() => setEditRow(r)}
                      aria-label="Редактировать"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex rounded-lg p-2 text-[var(--accent-danger)] hover:bg-[var(--bg-tertiary)]"
                      onClick={() => setDeleteId(r.id)}
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

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          className="rounded-pill border border-[var(--border)] px-4 py-2 disabled:opacity-40"
        >
          Назад
        </button>
        <span className="text-[var(--text-muted)]">
          Стр. {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-pill border border-[var(--border)] px-4 py-2 disabled:opacity-40"
        >
          Вперёд
        </button>
      </div>

      <Modal open={deleteId != null} onClose={() => setDeleteId(null)} title="Удалить?">
        <p className="text-sm text-[var(--text-secondary)]">Запись будет удалена без восстановления.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-pill border border-[var(--border)] px-4 py-2 text-sm"
            onClick={() => setDeleteId(null)}
          >
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

      <Modal open={editRow != null} onClose={() => setEditRow(null)} title="Редактирование">
        {editRow && (
          <form onSubmit={saveEdit} className="space-y-3">
            <div>
              <label className="text-xs text-[var(--text-muted)]">Сумма</label>
              <input
                name="amount"
                type="number"
                step="0.01"
                defaultValue={editRow.amount}
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)]">Дата</label>
              <input
                name="date"
                type="date"
                defaultValue={editRow.date}
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)]">Категория</label>
              <select
                name="category_id"
                defaultValue={editRow.category_id ?? ""}
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2"
              >
                <option value="">—</option>
                {catOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)]">Описание</label>
              <input
                name="description"
                defaultValue={editRow.description ?? ""}
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="recurring" defaultChecked={!!editRow.is_recurring} />
              Повторяющаяся
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="rounded-pill border px-4 py-2 text-sm" onClick={() => setEditRow(null)}>
                Отмена
              </button>
              <button type="submit" className="rounded-pill bg-[var(--accent-primary)] px-4 py-2 text-sm text-white">
                Сохранить
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
