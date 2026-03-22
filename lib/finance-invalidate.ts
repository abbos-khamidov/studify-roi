/** Событие для мгновенного обновления дашборда после мутаций (транзакции, фиксы, категории). */
export const FINANCE_DATA_CHANGED_EVENT = "studify-finance-data-changed";

export function notifyFinanceDataChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FINANCE_DATA_CHANGED_EVENT));
}
