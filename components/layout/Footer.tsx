export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-sm text-[var(--text-muted)]">
        <span>
          При поддержке{" "}
          <a
            href="https://aisolution.uz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent-primary)] transition hover:text-[var(--accent-primary-hover)]"
          >
            AI Solution
          </a>
        </span>
        <span>© {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
