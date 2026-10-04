"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useCurrency } from "@/components/CurrencyProvider";
import { useData } from "@/components/DataProvider";
import { useNetWorth } from "@/components/useNetWorth";
import { useUser } from "@/components/UserProvider";
import { excludedFor } from "@/lib/categories";
import { monthEnd, monthKey, monthLabel, monthStart, today } from "@/lib/dates";
import { summarize } from "@/lib/finance";

const COLORS = ["#3b6e4f", "#c08a2e", "#4a6fa5", "#b4472f", "#7c5ba6", "#2f8f9d", "#8a8a5c", "#a65b7c", "#5c5c5c", "#6aa84f"];

export default function Dashboard() {
  const { base, toBase, fmt, hide, ratesError } = useCurrency();
  const { holdings, accounts, txns, snapshots, loading, error } = useData();
  const { data: userDoc } = useUser();
  const { assets: totalAssets, liabilities: totalLiabs, net: netWorth, ratesReady, takeSnapshot, accountsTotal } = useNetWorth();
  const [msg, setMsg] = useState<string | null>(null);

  const assets = holdings.filter((h) => h.kind === "asset");
  const byCategory = Object.entries(
    assets.reduce<Record<string, number>>((acc, h) => {
      acc[h.category] = (acc[h.category] ?? 0) + toBase(Number(h.amount), h.currency);
      return acc;
    }, accountsTotal > 0 ? { "Bank accounts": accountsTotal } : {})
  ).map(([name, value]) => ({ name, value })).filter((d) => Number.isFinite(d.value) && d.value > 0);

  const byCurrency = Object.entries(
    holdings.reduce<Record<string, number>>((acc, h) => {
      const v = toBase(Number(h.amount), h.currency) * (h.kind === "asset" ? 1 : -1);
      acc[h.currency] = (acc[h.currency] ?? 0) + v;
      return acc;
    }, {})
  ).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

  const history = snapshots.filter((s) => s.base_currency === base).map((s) => ({ date: s.taken_on, netWorth: Number(s.net_worth) }));
  const otherCurrencySnaps = snapshots.length - history.length;

  const cur = monthKey(today());
  const month = summarize(txns, monthStart(cur), monthEnd(cur), excludedFor(userDoc), toBase);

  if (loading) return <p className="text-sm text-black/60">Loading…</p>;

  const empty = holdings.length === 0 && accounts.length === 0;
  const steps = [
    { done: holdings.some((h) => h.kind === "asset"), label: "Add your first asset", href: "/assets?new=1" },
    { done: accounts.length > 0, label: "Add a bank account", href: "/accounts?new=1" },
    { done: txns.length > 0, label: "Record a transaction", href: "/transactions?new=expense" },
  ];
  const showChecklist = steps.some((s) => !s.done);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-black/50">Net worth</p>
          <h1 className="font-serif text-4xl font-semibold">{ratesReady || empty ? fmt(netWorth) : "…"}</h1>
        </div>
        <button className="btn" disabled={empty} onClick={async () => setMsg(await takeSnapshot())}>Take snapshot</button>
      </div>

      {error && <p className="rounded-lg bg-loss/10 p-3 text-sm text-loss">{error}</p>}
      {ratesError && (
        <p className="rounded-lg bg-loss/10 p-3 text-sm text-loss">
          Couldn&apos;t load exchange rates, so amounts in other currencies show as “—”. Refresh to retry.
        </p>
      )}
      {msg && <p className="rounded-lg bg-brand-soft p-3 text-sm text-brand-dark">{msg}</p>}

      {showChecklist && (
        <div className="card">
          <h2 className="font-serif text-xl font-semibold">Welcome — let&apos;s get started</h2>
          <p className="text-sm text-black/60">{steps.filter((s) => s.done).length} of {steps.length} steps done</p>
          <ul className="mt-3 space-y-2">
            {steps.map((s) => (
              <li key={s.label} className="flex items-center gap-2 text-sm">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${s.done ? "bg-brand text-white" : "border border-black/20"}`}>{s.done ? "✓" : ""}</span>
                {s.done ? <span className="text-black/50 line-through">{s.label}</span> : <Link href={s.href} className="text-brand underline">{s.label}</Link>}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-black/50">Have a spreadsheet? <Link href="/import" className="underline">Import it as CSV</Link>.</p>
        </div>
      )}

      {!empty && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card"><p className="text-xs uppercase text-black/50">Total assets</p><p className="mt-1 text-2xl font-semibold text-brand-dark">{fmt(totalAssets)}</p></div>
            <div className="card"><p className="text-xs uppercase text-black/50">Total liabilities</p><p className="mt-1 text-2xl font-semibold text-loss">{fmt(totalLiabs)}</p></div>
            <div className="card"><p className="text-xs uppercase text-black/50">{monthLabel(cur)} income</p><p className="mt-1 text-2xl font-semibold">{fmt(month.income)}</p></div>
            <div className="card"><p className="text-xs uppercase text-black/50">{monthLabel(cur)} expenses</p><p className="mt-1 text-2xl font-semibold">{fmt(month.expense)}</p></div>
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
                <p className="mt-2 text-xs text-black/50">{otherCurrencySnaps} older snapshot(s) were saved in a different display currency and are not shown.</p>
              )}
            </div>
          </div>

          {byCurrency.length > 0 && (
            <div className="card">
              <h2 className="mb-3 font-medium">Currency exposure (net, in {base})</h2>
              <ul className="divide-y divide-black/5 text-sm">
                {byCurrency.map(([c, v]) => (
                  <li key={c} className="flex justify-between py-2">
                    <span className="font-medium">{c}</span>
                    <span className={v < 0 ? "text-loss" : ""}>{fmt(v)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
