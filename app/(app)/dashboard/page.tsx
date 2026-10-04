"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { collection, doc, getDocs, orderBy, query, setDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import type { Holding, Snapshot } from "@/lib/types";
import { useCurrency } from "@/components/CurrencyProvider";

const COLORS = ["#3b6e4f", "#c08a2e", "#4a6fa5", "#b4472f", "#7c5ba6", "#2f8f9d", "#8a8a5c", "#a65b7c", "#5c5c5c", "#6aa84f"];

export default function Dashboard() {
  const { user } = useAuth();
  const uid = user!.uid; // layout guarantees a signed-in user
  const { base, toBase, fmt, hide, rates, ratesError } = useCurrency();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [snaps, setSnaps] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const db = getDb();
      const [h, sn] = await Promise.all([
        getDocs(collection(db, "users", uid, "holdings")),
        getDocs(query(collection(db, "users", uid, "snapshots"), orderBy("taken_on", "asc"))),
      ]);
      setHoldings(h.docs.map((d) => ({ ...(d.data() as Omit<Holding, "id">), id: d.id })));
      setSnaps(sn.docs.map((d) => ({ ...(d.data() as Omit<Snapshot, "id">), id: d.id })));
    } catch (e) {
      setMsg((e as Error).message);
    }
    setLoading(false);
  }, [uid]);

  useEffect(() => { load(); }, [load]);

  const ratesReady = Object.keys(rates).length > 0;
  const assets = holdings.filter((h) => h.kind === "asset");
  const liabs = holdings.filter((h) => h.kind === "liability");
  const sum = (list: Holding[]) => list.reduce((s, h) => s + toBase(Number(h.amount), h.currency), 0);
  const totalAssets = sum(assets);
  const totalLiabs = sum(liabs);
  const netWorth = totalAssets - totalLiabs;

  const byCategory = Object.entries(
    assets.reduce<Record<string, number>>((acc, h) => {
      acc[h.category] = (acc[h.category] ?? 0) + toBase(Number(h.amount), h.currency);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value })).filter((d) => Number.isFinite(d.value) && d.value > 0);

  const byCurrency = Object.entries(
    holdings.reduce<Record<string, number>>((acc, h) => {
      const v = toBase(Number(h.amount), h.currency) * (h.kind === "asset" ? 1 : -1);
      acc[h.currency] = (acc[h.currency] ?? 0) + v;
      return acc;
    }, {})
  ).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

  async function takeSnapshot() {
    if (!ratesReady || !Number.isFinite(netWorth)) return setMsg("Exchange rates are not available yet, so a snapshot can't be saved.");
    const today = new Date().toLocaleDateString("en-CA"); // local date, YYYY-MM-DD
    try {
      await setDoc(doc(getDb(), "users", uid, "snapshots", today), {
        taken_on: today,
        base_currency: base,
        total_assets: totalAssets,
        total_liabilities: totalLiabs,
        net_worth: netWorth,
      });
      setMsg("Snapshot saved for today.");
      load();
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  // Only plot snapshots taken in the current display currency, so values are comparable.
  const history = snaps
    .filter((s) => s.base_currency === base)
    .map((s) => ({ date: s.taken_on, netWorth: Number(s.net_worth) }));
  const otherCurrencySnaps = snaps.length - history.length;

  if (loading) return <p className="text-sm text-black/60">Loading…</p>;

  const empty = holdings.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-black/50">Net worth</p>
          <h1 className="font-serif text-4xl font-semibold">{ratesReady || empty ? fmt(netWorth) : "…"}</h1>
        </div>
        <button className="btn" onClick={takeSnapshot} disabled={empty}>Take snapshot</button>
      </div>

      {ratesError && (
        <p className="rounded-lg bg-loss/10 p-3 text-sm text-loss">
          Couldn&apos;t load exchange rates, so amounts in other currencies show as “—”. Refresh to retry.
        </p>
      )}
      {msg && <p className="rounded-lg bg-brand-soft p-3 text-sm text-brand-dark">{msg}</p>}

      {empty ? (
        <div className="card space-y-3 text-center">
          <h2 className="font-serif text-xl font-semibold">Know your net worth, then watch it grow.</h2>
          <p className="text-sm text-black/60">Add what you own and owe, in any currency, then take your first snapshot.</p>
          <div className="flex justify-center gap-2">
            <Link href="/assets" className="btn">Add asset</Link>
            <Link href="/liabilities" className="btn-ghost">Add liability</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card">
              <p className="text-xs uppercase text-black/50">Total assets</p>
              <p className="mt-1 text-2xl font-semibold text-brand-dark">{fmt(totalAssets)}</p>
            </div>
            <div className="card">
              <p className="text-xs uppercase text-black/50">Total liabilities</p>
              <p className="mt-1 text-2xl font-semibold text-loss">{fmt(totalLiabs)}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card">
              <h2 className="mb-2 font-medium">Allocation</h2>
              {hide ? (
                <p className="py-16 text-center text-sm text-black/50">Hidden</p>
              ) : byCategory.length === 0 ? (
                <p className="py-16 text-center text-sm text-black/50">No assets to chart yet.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85}>
                        {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="mb-2 font-medium">Net worth over time</h2>
              {hide ? (
                <p className="py-16 text-center text-sm text-black/50">Hidden</p>
              ) : history.length < 2 ? (
                <p className="py-16 text-center text-sm text-black/50">
                  Take a snapshot on different days to build your chart ({history.length} so far in {base}).
                </p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer>
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#0001" />
                      <XAxis dataKey="date" fontSize={11} />
                      <YAxis fontSize={11} width={70} tickFormatter={(v: number) => fmt(v)} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Line type="monotone" dataKey="netWorth" stroke="#3b6e4f" strokeWidth={2} dot />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              {otherCurrencySnaps > 0 && (
                <p className="mt-2 text-xs text-black/50">
                  {otherCurrencySnaps} older snapshot(s) were saved in a different display currency and are not shown.
                </p>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="mb-3 font-medium">Currency exposure (net, in {base})</h2>
            <ul className="divide-y divide-black/5 text-sm">
              {byCurrency.map(([cur, v]) => (
                <li key={cur} className="flex justify-between py-2">
                  <span className="font-medium">{cur}</span>
                  <span className={v < 0 ? "text-loss" : ""}>{fmt(v)}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
