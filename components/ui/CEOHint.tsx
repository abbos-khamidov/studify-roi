"use client";

/** Короткое пояснение для владельца: зачем блок и как читать цифры. */
export function CEOHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)]/60 px-3 py-2 text-xs leading-relaxed text-[var(--text-secondary)]">
      <span className="font-semibold text-[var(--text-primary)]">Для CEO: </span>
      {children}
    </p>
  );
}
