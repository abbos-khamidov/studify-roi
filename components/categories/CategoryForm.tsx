"use client";

import { useState } from "react";

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
  const [color, setColor] = useState(PRESETS[0]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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
      onDone();
    } catch {
      setErr("Сеть");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-card border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
      <h3 className="font-display font-bold text-[var(--text-primary)]">Новая категория</h3>
      <div>
        <label className="text-xs text-[var(--text-muted)]">Название</label>
        <input
          className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <p className="text-xs text-[var(--text-muted)]">Цвет</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`h-8 w-8 rounded-full border-2 ${
                color === c ? "border-[var(--text-primary)]" : "border-transparent"
              }`}
              style={{ background: c }}
              aria-label={c}
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
        className="rounded-pill bg-[var(--accent-primary)] px-6 py-2 text-sm text-white disabled:opacity-50"
      >
        {loading ? "…" : "Создать"}
      </button>
    </form>
  );
}
