"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type CurrencyCode = "UZS" | "EUR";

type CurrencyContextValue = {
  currency: CurrencyCode;
  /** Перечитать валюту с сервера (после сохранения в настройках). */
  refresh: () => Promise<void>;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function normalizeCurrency(v: string | undefined): CurrencyCode {
  if (v === "EUR") return "EUR";
  return "UZS";
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyCode>("UZS");

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/settings");
      const s = await r.json();
      setCurrency(normalizeCurrency(s.currency));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => ({ currency, refresh }), [currency, refresh]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return ctx;
}
