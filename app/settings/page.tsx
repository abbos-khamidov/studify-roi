"use client";

import { useEffect, useState } from "react";
import { useCurrency } from "@/components/currency-provider";
import { notifyFinanceDataChanged } from "@/lib/finance-invalidate";
import { Modal } from "@/components/ui/Modal";

export default function SettingsPage() {
  const { refresh } = useCurrency();
  const [openaiKey, setOpenaiKey] = useState("");
  const [currency, setCurrency] = useState("UZS");
  const [companyName, setCompanyName] = useState("Studify");
  const [target, setTarget] = useState("");
  const [masked, setMasked] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        setCurrency(s.currency === "EUR" ? "EUR" : "UZS");
        setCompanyName(s.company_name || "Studify");
        setTarget(String(s.monthly_revenue_target ?? ""));
        setMasked(s.openai_key_masked || "");
        setHasKey(!!s.has_openai_key);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const body: Record<string, unknown> = {
        currency,
        company_name: companyName,
        monthly_revenue_target: Number(target) || 0,
      };
      if (openaiKey.trim()) body.openai_key = openaiKey.trim();
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const s = await res.json();
      if (!res.ok) {
        setMsg(s.error || "Ошибка");
        return;
      }
      setOpenaiKey("");
      setMasked(s.openai_key_masked || "");
      setHasKey(!!s.has_openai_key);
      setMsg("Сохранено");
      notifyFinanceDataChanged();
      await refresh();
    } catch {
      setMsg("Сеть");
    } finally {
      setSaving(false);
    }
  }

  async function exportJson() {
    const res = await fetch("/api/export");
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `studify-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function resetAll() {
    await fetch("/api/settings/reset", { method: "POST" });
    setResetOpen(false);
    window.location.reload();
  }

  if (loading) {
    return <p className="text-[var(--text-muted)]">Загрузка…</p>;
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">Настройки</h2>
        <p className="mt-1 text-[var(--text-secondary)]">Ключ AI, валюта и цели</p>
      </div>

      <div className="space-y-4 rounded-card border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
        <div>
          <label className="text-xs text-[var(--text-muted)]">Ключ OpenAI API</label>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {hasKey ? `Текущий: ${masked}` : "Не задан"}
          </p>
          <input
            type="password"
            autoComplete="off"
            placeholder={hasKey ? "Новый ключ (оставьте пустым чтобы не менять)" : "sk-…"}
            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2 text-[var(--text-primary)]"
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-[var(--text-muted)]">Валюта</label>
          <select
            className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="UZS">UZS (сум)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-[var(--text-muted)]">Название компании</label>
          <input
            className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-[var(--text-muted)]">Цель по выручке (в месяц)</label>
          <input
            type="number"
            step="0.01"
            className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>
        {msg && <p className="text-sm text-[var(--accent-success)]">{msg}</p>}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="w-full rounded-pill bg-[var(--accent-primary)] py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Сохранение…" : "Сохранить"}
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={exportJson}
          className="rounded-pill border border-[var(--border)] px-5 py-2.5 text-sm font-medium"
        >
          Экспорт JSON
        </button>
        <button
          type="button"
          onClick={() => setResetOpen(true)}
          className="rounded-pill border border-[var(--accent-danger)] px-5 py-2.5 text-sm font-medium text-[var(--accent-danger)]"
        >
          Очистить все данные
        </button>
      </div>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Очистить всё?">
        <p className="text-sm text-[var(--text-secondary)]">
          Будут удалены транзакции, категории и фиксированные расходы. Настройки сбросятся. Это необратимо.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-pill border px-4 py-2 text-sm" onClick={() => setResetOpen(false)}>
            Отмена
          </button>
          <button
            type="button"
            className="rounded-pill bg-[var(--accent-danger)] px-4 py-2 text-sm text-white"
            onClick={resetAll}
          >
            Очистить
          </button>
        </div>
      </Modal>
    </div>
  );
}
