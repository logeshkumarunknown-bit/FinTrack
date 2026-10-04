"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import { addPeriod, today } from "@/lib/dates";
import { loadAll, setItem, updateItem } from "@/lib/db";
import type { Account, Goal, Holding, Recurring, Rule, Snapshot, Txn } from "@/lib/types";

interface Ctx {
  holdings: Holding[];
  accounts: Account[];
  txns: Txn[];
  goals: Goal[];
  recurring: Recurring[];
  snapshots: Snapshot[];
  rules: Rule[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const DataContext = createContext<Ctx | null>(null);

export function useData() {
  const c = useContext(DataContext);
  if (!c) throw new Error("useData must be used inside DataProvider");
  return c;
}

const byNew = <T extends { created_at?: number }>(a: T, b: T) => (b.created_at ?? 0) - (a.created_at ?? 0);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const uid = user!.uid;
  const [state, setState] = useState<Omit<Ctx, "loading" | "error" | "reload">>({
    holdings: [], accounts: [], txns: [], goals: [], recurring: [], snapshots: [], rules: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const generating = useRef(false);

  const fetchAll = useCallback(async () => {
    const [holdings, accounts, txns, goals, recurring, snapshots, rules] = await Promise.all([
      loadAll<Holding>(uid, "holdings"),
      loadAll<Account>(uid, "accounts"),
      loadAll<Txn>(uid, "transactions"),
      loadAll<Goal>(uid, "goals"),
      loadAll<Recurring>(uid, "recurring"),
      loadAll<Snapshot>(uid, "snapshots"),
      loadAll<Rule>(uid, "rules"),
    ]);
    holdings.sort(byNew);
    accounts.sort(byNew);
    txns.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : byNew(a, b)));
    goals.sort(byNew);
    recurring.sort(byNew);
    rules.sort(byNew);
    snapshots.sort((a, b) => (a.taken_on < b.taken_on ? -1 : 1));
    return { holdings, accounts, txns, goals, recurring, snapshots, rules };
  }, [uid]);

  /** Create transactions for recurring payments that have come due. Ids are deterministic, so it is safe to repeat. */
  const generateDue = useCallback(
    async (list: Recurring[]) => {
      const t = today();
      let created = false;
      for (const r of list) {
        if (!r.active || !r.next_date || r.next_date > t) continue;
        let next = r.next_date;
        let n = 0;
        while (next <= t && n < 60) {
          await setItem(uid, "transactions", `${r.id}_${next}`, {
            type: r.type, date: next, amount: r.amount, currency: r.currency, category: r.category,
            account_id: r.account_id, note: r.note, recurring_id: r.id, created_at: Date.now(),
          });
          next = addPeriod(next, r.frequency);
          n++;
          created = true;
        }
        await updateItem(uid, "recurring", r.id, { next_date: next });
      }
      return created;
    },
    [uid]
  );

  const reload = useCallback(async () => {
    try {
      setState(await fetchAll());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [fetchAll]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let data = await fetchAll();
        if (!generating.current) {
          generating.current = true;
          try {
            if (await generateDue(data.recurring)) data = await fetchAll();
          } finally {
            generating.current = false;
          }
        }
        if (!cancelled) setState(data);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [fetchAll, generateDue]);

  return <DataContext.Provider value={{ ...state, loading, error, reload }}>{children}</DataContext.Provider>;
}
