"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type CurrencyCode = "USD" | "UZS" | "EUR";

type CurrencyContextValue = {
  currency: CurrencyCode;
  setNavbarCurrency: (c: "USD" | "UZS") => Promise<void>;
  saving: boolean;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function normalizeCurrency(v: string | undefined): CurrencyCode {
  if (v === "UZS" || v === "EUR") return v;
  return "USD";
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => setCurrency(normalizeCurrency(s.currency)))
      .catch(() => {});
  }, []);

  const setNavbarCurrency = useCallback(async (c: "USD" | "UZS") => {
    if (c === currency) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency: c }),
      });
      if (res.ok) {
        const s = await res.json();
        setCurrency(normalizeCurrency(s.currency));
      }
    } finally {
      setSaving(false);
    }
  }, [currency]);

  const value = useMemo(
    () => ({ currency, setNavbarCurrency, saving }),
    [currency, setNavbarCurrency, saving]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return ctx;
}
