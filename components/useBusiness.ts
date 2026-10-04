"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { loadAll } from "@/lib/db";
import type { BizEntry, BizLiability, Business } from "@/lib/types";

export function useBusiness() {
  const { user } = useAuth();
  const uid = user!.uid;
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [entries, setEntries] = useState<BizEntry[]>([]);
  const [liabilities, setLiabilities] = useState<BizLiability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const [b, e, l] = await Promise.all([
        loadAll<Business>(uid, "businesses"),
        loadAll<BizEntry>(uid, "business_entries"),
        loadAll<BizLiability>(uid, "business_liabilities"),
      ]);
      b.sort((x, y) => (x.created_at ?? 0) - (y.created_at ?? 0));
      e.sort((x, y) => (x.date < y.date ? 1 : x.date > y.date ? -1 : 0));
      l.sort((x, y) => (y.created_at ?? 0) - (x.created_at ?? 0));
      setBusinesses(b);
      setEntries(e);
      setLiabilities(l);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
    setLoading(false);
  }, [uid]);

  useEffect(() => { reload(); }, [reload]);

  return { uid, businesses, entries, liabilities, loading, error, reload };
}

export function bizTotals(entries: BizEntry[]) {
  const gross = entries.filter((e) => e.type === "income").reduce((s, e) => s + Number(e.amount), 0);
  const expense = entries.filter((e) => e.type === "expense").reduce((s, e) => s + Number(e.amount), 0);
  return { gross, expense, net: gross - expense };
}
