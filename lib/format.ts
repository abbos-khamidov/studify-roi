const SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  UZS: "soʻm",
};

export function formatCurrency(amount: number, currency: string): string {
  const sym = SYMBOLS[currency] ?? currency + " ";
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: abs >= 1000 && currency === "UZS" ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(amount);
  if (currency === "USD" || currency === "EUR") {
    return `${sym}${formatted}`;
  }
  return `${formatted} ${sym}`;
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}
