"use client";

import { useCallback, useMemo } from "react";
import { useAuth } from "./AuthProvider";
import { useCurrency } from "./CurrencyProvider";
import { useData } from "./DataProvider";
import { accountBalance } from "@/lib/finance";
import { setItem } from "@/lib/db";
import { today } from "@/lib/dates";

/** Net worth in the display currency. Account balances count as assets. */
export function useNetWorth() {
  const { user } = useAuth();
  const { holdings, accounts, txns, reload } = useData();
  const { base, toBase, conv, rates } = useCurrency();

  const calc = useMemo(() => {
    const balances = accounts.map((a) => {
      const bal = accountBalance(a, txns, conv);
      return { account: a, balance: bal, inBase: toBase(bal, a.currency) };
    });
    const accountsTotal = balances.reduce((s, b) => s + b.inBase, 0);
    const holdingAssets = holdings
      .filter((h) => h.kind === "asset")
      .reduce((s, h) => s + toBase(Number(h.amount), h.currency), 0);
    const liabilities = holdings
      .filter((h) => h.kind === "liability")
      .reduce((s, h) => s + toBase(Number(h.amount), h.currency), 0);
    const assets = holdingAssets + accountsTotal;
    return { balances, accountsTotal, assets, liabilities, net: assets - liabilities };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdings, accounts, txns, base, rates]);

  const ratesReady = Object.keys(rates).length > 0;

  const takeSnapshot = useCallback(async (): Promise<string> => {
    if (!user) return "Not signed in.";
    if (!ratesReady || !Number.isFinite(calc.net)) {
      return "Exchange rates are not available yet, so a snapshot can't be saved.";
    }
    const d = today();
    try {
      await setItem(user.uid, "snapshots", d, {
        taken_on: d,
        base_currency: base,
        total_assets: calc.assets,
        total_liabilities: calc.liabilities,
        net_worth: calc.net,
      });
      await reload();
      return "Snapshot saved for today.";
    } catch (e) {
      return (e as Error).message;
    }
  }, [user, ratesReady, calc, base, reload]);

  return { ...calc, ratesReady, takeSnapshot };
}
