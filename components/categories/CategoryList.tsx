"use client";

import { useCallback, useEffect, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { Modal } from "@/components/ui/Modal";

type Row = {
  id: number;
  name: string;
  type: string;
  color: string;
  is_active: number;
  transaction_count: number;
  total_amount: number;
};

export function CategoryList({
  filter,
  currency,
  refreshKey = 0,
}: {
  filter: "all" | "income" | "expense";
  currency: string;
  refreshKey?: number;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Row | null>(null);
  const [deactivateId, setDeactivateId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const q =
      filter === "all"
        ? "?stats=1&include_inactive=1"
        : `?stats=1&type=${filter}&include_inactive=1`;
    const res = await fetch(`/api/categories${q}`);
    setRows(await res.json());
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  async function saveEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!edit) return;
    const fd = new FormData(e.currentTarget);
    await fetch(`/api/categories/${edit.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        color: fd.get("color"),
      }),
    });
    setEdit(null);
    load();
  }

  async function confirmDeactivate() {
    if (deactivateId == null) return;
    await fetch(`/api/categories/${deactivateId}`, { method: "DELETE" });
    setDeactivateId(null);
    load();
  }

  return (
    <div className="overflow-x-auto rounded-card border border-[var(--border)]">
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead className="bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
          <tr>
            <th className="p-3">Имя</th>
            <th className="p-3">Тип</th>
            <th className="p-3">Цвет</th>
            <th className="p-3">Транзакций</th>
            <th className="p-3">Сумма</th>
            <th className="p-3">Статус</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={7} className="p-6 text-center text-[var(--text-muted)]">
                Загрузка…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-6 text-center text-[var(--text-muted)]">
                Нет категорий — создайте первую.
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id} className="border-t border-[var(--border)]">
                <td className="p-3 font-medium text-[var(--text-primary)]">{r.name}</td>
                <td className="p-3">
                  {r.type === "income" ? (
                    <span className="text-[var(--accent-success)]">Доход</span>
                  ) : (
                    <span className="text-[var(--accent-danger)]">Расход</span>
                  )}
                </td>
                <td className="p-3">
                  <span
                    className="inline-block h-6 w-6 rounded-full border border-[var(--border)]"
                    style={{ background: r.color }}
                  />
                </td>
                <td className="p-3 font-mono-data">{r.transaction_count}</td>
                <td className="p-3 font-mono-data">{formatCurrency(r.total_amount, currency)}</td>
                <td className="p-3">
                  {r.is_active ? (
                    <span className="text-[var(--accent-success)]">Активна</span>
                  ) : (
                    <span className="text-[var(--text-muted)]">Выкл.</span>
                  )}
                </td>
                <td className="p-3 text-right">
                  {r.is_active ? (
                    <>
                      <button
                        type="button"
                        className="mr-2 text-[var(--accent-primary)] hover:underline"
                        onClick={() => setEdit(r)}
                      >
                        Изменить
                      </button>
                      <button
                        type="button"
                        className="text-[var(--accent-danger)] hover:underline"
                        onClick={() => setDeactivateId(r.id)}
                      >
                        Деактивировать
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="text-[var(--accent-primary)] hover:underline"
                      onClick={async () => {
                        await fetch(`/api/categories/${r.id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ is_active: 1 }),
                        });
                        load();
                      }}
                    >
                      Включить
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <Modal open={edit != null} onClose={() => setEdit(null)} title="Категория">
        {edit && (
          <form onSubmit={saveEdit} className="space-y-3">
            <div>
              <label className="text-xs text-[var(--text-muted)]">Название</label>
              <input
                name="name"
                defaultValue={edit.name}
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)]">Цвет</label>
              <input
                name="color"
                type="color"
                defaultValue={edit.color}
                className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-[var(--border)]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="rounded-pill border px-4 py-2 text-sm" onClick={() => setEdit(null)}>
                Отмена
              </button>
              <button type="submit" className="rounded-pill bg-[var(--accent-primary)] px-4 py-2 text-sm text-white">
                Сохранить
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={deactivateId != null} onClose={() => setDeactivateId(null)} title="Деактивировать?">
        <p className="text-sm text-[var(--text-secondary)]">
          Категория скроется из выбора, данные транзакций сохранятся.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-pill border px-4 py-2 text-sm" onClick={() => setDeactivateId(null)}>
            Отмена
          </button>
          <button
            type="button"
            className="rounded-pill bg-[var(--accent-danger)] px-4 py-2 text-sm text-white"
            onClick={confirmDeactivate}
          >
            Деактивировать
          </button>
        </div>
      </Modal>
    </div>
  );
}
