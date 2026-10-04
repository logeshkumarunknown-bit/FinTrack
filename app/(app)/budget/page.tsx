"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import { useData } from "@/components/DataProvider";
import { useUser } from "@/components/UserProvider";
import { MoneyTabs } from "@/components/Tabs";
import { categoriesFor, excludedFor } from "@/lib/categories";
import { setItem } from "@/lib/db";
import { monthEnd, monthKey, monthLabel, monthStart, shiftMonth, today } from "@/lib/dates";
import { summarize } from "@/lib/finance";

async function loadBudget(uid: string, month: string): Promise<Record<string, number> | null> {
  const s = await getDoc(doc(getDb(), "users", uid, "budgets", month));
  return s.exists() ? ((s.data().items as Record<string, number>) ?? {}) : null;
}

export default function BudgetPage() {
  const { user } = useAuth();
  const uid = user!.uid;
  const { txns } = useData();
  const { data: userDoc } = useUser();
  const { base, fmt, toBase } = useCurrency();
  const [month, setMonth] = useState(monthKey(today()));
  const [items, setItems] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const excluded = excludedFor(userDoc);
  const cats = categoriesFor("expense", userDoc).filter((c) => !excluded.includes(c));
  const spent = summarize(txns, monthStart(month), monthEnd(month), excluded, toBase).byCategory;

  useEffect(() => {
    setLoaded(false);
    setMsg(null);
    loadBudget(uid, month)
      .then((b) => { setItems(b ?? {}); setErr(null); })
      .catch((e) => setErr((e as Error).message))
      .finally(() => setLoaded(true));
  }, [uid, month]);

  async function persist(next: Record<string, number>) {
    setItems(next);
    try {
      await setItem(uid, "budgets", month, { items: next });
      setErr(null);
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  function setAmount(cat: string, v: string) {
    const next = { ...items };
    if (v === "" || Number(v) <= 0) delete next[cat];
    else next[cat] = Number(v);
    setItems(next);
  }

  async function copyLast() {
    try {
      const prev = await loadBudget(uid, shiftMonth(month, -1));
      if (!prev || Object.keys(prev).length === 0) return setMsg("Last month has no budget to copy.");
      await persist(prev);
      setMsg("Copied last month's budget.");
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  async function suggest() {
    const totals: Record<string, number> = {};
    for (let i = 1; i <= 3; i++) {
      const m = shiftMonth(month, -i);
      const s = summarize(txns, monthStart(m), monthEnd(m), excluded, toBase).byCategory;
      for (const [c, v] of Object.entries(s)) totals[c] = (totals[c] ?? 0) + v;
    }
    const next: Record<string, number> = {};
    for (const [c, v] of Object.entries(totals)) {
      const avg = Math.round(v / 3 / 100) * 100;
      if (avg > 0) next[c] = avg;
    }
    if (Object.keys(next).length === 0) return setMsg("No spending in the last 3 months to base a suggestion on.");
    await persist(next);
    setMsg("Suggested from your average spending over the last 3 months. Adjust as you like.");
  }

  const planned = Object.entries(items).reduce((s, [, v]) => s + v, 0);
  const totalSpent = Object.values(spent).reduce((s, v) => s + v, 0);
  const allCats = Array.from(new Set([...cats, ...Object.keys(spent), ...Object.keys(items)])).filter((c) => !excluded.includes(c));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Money</h1>
          <p className="text-sm text-black/60">
            Planned {fmt(planned)} · Spent {fmt(totalSpent)} · {planned >= totalSpent ? "Left" : "Over by"} {fmt(Math.abs(planned - totalSpent))}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button className="btn-ghost px-3" onClick={() => setMonth(shiftMonth(month, -1))}>‹</button>
          <span className="w-24 text-center text-sm font-medium">{monthLabel(month)}</span>
          <button className="btn-ghost px-3" onClick={() => setMonth(shiftMonth(month, 1))}>›</button>
        </div>
      </div>
      <MoneyTabs />
      {err && <p className="rounded-lg bg-loss/10 p-3 text-sm text-loss">{err}</p>}
      {msg && <p className="rounded-lg bg-brand-soft p-3 text-sm text-brand-dark">{msg}</p>}

      <div className="flex flex-wrap gap-2">
        <button className="btn-ghost" onClick={suggest}>Suggest from last 3 months</button>
        <button className="btn-ghost" onClick={copyLast}>Copy last month</button>
        <button className="btn" onClick={() => persist(items).then(() => setMsg("Budget saved."))}>Save budget</button>
      </div>
      <p className="text-xs text-black/50">Amounts are in {base}. Categories excluded from spending (see Money → Settings) are not listed.</p>

      <div className="card overflow-x-auto p-0">
        {!loaded ? (
          <p className="p-5 text-sm text-black/60">Loading…</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase text-black/50">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Planned</th>
                <th className="px-4 py-3 text-right">Spent</th>
                <th className="px-4 py-3 text-right">Left</th>
              </tr>
            </thead>
            <tbody>
              {allCats.map((c) => {
                const p = items[c] ?? 0;
                const s = spent[c] ?? 0;
                const pct = p > 0 ? Math.min(100, (s / p) * 100) : 0;
                return (
                  <tr key={c} className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-3">
                      <span className="font-medium">{c}</span>
                      {p > 0 && (
                        <div className="mt-1 h-1.5 w-32 rounded bg-black/10">
                          <div className={`h-1.5 rounded ${s > p ? "bg-loss" : "bg-brand"}`} style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <input className="input w-32" type="number" min="0" step="1" value={items[c] ?? ""}
                        onChange={(e) => setAmount(c, e.target.value)} />
                    </td>
                    <td className="px-4 py-3 text-right">{fmt(s)}</td>
                    <td className={`px-4 py-3 text-right ${p - s < 0 ? "text-loss" : ""}`}>{p > 0 ? fmt(p - s) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
