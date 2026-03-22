const SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  UZS: "soʻm",
};

/** Postgres NUMERIC / JSON иногда отдаёт строку — приводим к числу. */
export function asNumber(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/**
 * Парсинг суммы из поля ввода: пробелы, 2 500 000, 2.500.000 (тысячи), 2500000.
 */
export function parseMoneyInput(raw: string): number | null {
  let s = raw.trim().replace(/[\s\u00a0\u202f']/g, "");
  if (!s) return null;
  const neg = s.startsWith("-");
  if (neg) s = s.slice(1);
  const dotCount = (s.match(/\./g) ?? []).length;
  const commaCount = (s.match(/,/g) ?? []).length;
  if (dotCount >= 1 && commaCount >= 1) {
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    if (lastDot > lastComma) {
      s = s.replace(/,/g, "");
    } else {
      s = s.replace(/\./g, "").replace(",", ".");
    }
    const n = Number(s);
    if (!Number.isFinite(n)) return null;
    return neg ? -n : n;
  }
  if (dotCount > 1 || commaCount > 1) {
    const n = Number(s.replace(/[.,]/g, ""));
    if (!Number.isFinite(n)) return null;
    return neg ? -n : n;
  }
  // Одна запятая или точка: десятичный разделитель
  if (commaCount === 1 && dotCount === 0) {
    const [a, b] = s.split(",");
    if (b.length <= 2) {
      const n = Number(`${a.replace(/\./g, "")}.${b}`);
      if (!Number.isFinite(n)) return null;
      return neg ? -n : n;
    }
  }
  s = s.replace(/,/g, "");
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return neg ? -n : n;
}

export function formatCurrency(amount: unknown, currency: string): string {
  const n = asNumber(amount);
  const sym = SYMBOLS[currency] ?? currency + " ";
  const abs = Math.abs(n);

  if (currency === "UZS" && abs >= 1_000_000) {
    const compact = new Intl.NumberFormat("ru-RU", {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    }).format(n);
    return `${compact} ${sym}`;
  }

  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: abs >= 1000 && currency === "UZS" ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(n);
  if (currency === "USD" || currency === "EUR") {
    return `${sym}${formatted}`;
  }
  return `${formatted} ${sym}`;
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}
