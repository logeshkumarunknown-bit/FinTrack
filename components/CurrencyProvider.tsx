"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useUser } from "./UserProvider";
import { convert, formatMoney, type Rates } from "@/lib/currency";

interface Ctx {
  base: string;
  setBase: (c: string) => void;
  rates: Rates;
  ratesError: boolean;
  updated: string | null;
  hide: boolean;
  setHide: (v: boolean) => void;
  /** Convert from `cur` into the base currency. */
  toBase: (amount: number, cur: string) => number;
  /** Convert between any two currencies. */
  conv: (amount: number, from: string, to: string) => number;
  /** Format an amount in the given currency (defaults to base). */
  fmt: (amount: number, cur?: string) => string;
}

const CurrencyContext = createContext<Ctx | null>(null);

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside CurrencyProvider");
  return ctx;
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { data, saveUser } = useUser();
  const base = data.baseCurrency ?? "INR";
  const [rates, setRates] = useState<Rates>({});
  const [ratesError, setRatesError] = useState(false);
  const [updated, setUpdated] = useState<string | null>(null);
  const [hide, setHideState] = useState(false);

  useEffect(() => {
    try {
      setHideState(localStorage.getItem("hide") === "1");
    } catch {}
    fetch("/api/rates")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setRates(d.rates);
        setUpdated(d.updated);
      })
      .catch(() => setRatesError(true));
  }, []);

  const setBase = useCallback(
    (c: string) => {
      saveUser({ baseCurrency: c }).catch(() => {});
    },
    [saveUser]
  );

  const setHide = useCallback((v: boolean) => {
    setHideState(v);
    try {
      localStorage.setItem("hide", v ? "1" : "0");
    } catch {}
  }, []);

  const value: Ctx = {
    base,
    setBase,
    rates,
    ratesError,
    updated,
    hide,
    setHide,
    toBase: (amount, cur) => convert(amount, cur, base, rates),
    conv: (amount, from, to) => convert(amount, from, to, rates),
    fmt: (amount, cur) => formatMoney(amount, cur ?? base, hide),
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}
