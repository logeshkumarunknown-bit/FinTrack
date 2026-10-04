"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useCurrency } from "@/components/CurrencyProvider";
import { useData } from "@/components/DataProvider";
import { useUser } from "@/components/UserProvider";
import { MoneyTabs } from "@/components/Tabs";
import { excludedFor } from "@/lib/categories";
import { listMonths, monthEnd, monthKey, monthLabel, monthStart, shiftMonth, today } from "@/lib/dates";
import { summarize } from "@/lib/finance";

const COLORS = ["#3b6e4f", "#c08a2e", "#4a6fa5", "#b4472f", "#7c5ba6", "#2f8f9d", "#8a8a5c", "#a65b7c", "#5c5c5c", "#6aa84f"];
type Range = "month" | "last" | "12m" | "ytd" | "custom";

export default function InsightsPage() {
  const { txns } = useData();
  const { data: userDoc } = useUser();
  const { toBase, fmt, hide } = useCurrency();
  const [range, setRange] = useState<Range>("month");
  const [cFrom, setCFrom] = useState(monthStart(monthKey(today())));
  const [cTo, setCTo] = useState(today());

  const cur = monthKey(today());
  const [from, to] =
    range === "month" ? [monthStart(cur), monthEnd(cur)]
    : range === "last" ? [monthStart(shiftMonth(cur, -1)), monthEnd(shiftMonth(cur, -1))]
    : range === "12m" ? [monthStart(shiftMonth(cur, -11)), monthEnd(cur)]
    : range === "ytd" ? [`${cur.slice(0, 4)}-01-01`, monthEnd(cur)]
    : [cFrom, cTo];

  const excluded = excludedFor(userDoc);
  const s = useMemo(() => summarize(txns, from, to, excluded, toBase), [txns, from, to, excluded, toBase]);
  const lifetime = useMemo(() => summarize(txns, "0000-01-01", "9999-12-31", excluded, toBase), [txns, excluded, toBase]);

  const cats = Object.entries(s.byCategory).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const months = from.slice(0, 7) <= to.slice(0, 7) ? listMonths(from.slice(0, 7), to.slice(0, 7)).slice(-24) : [];
  const monthly = months.map((m) => {
    const x = summarize(txns, monthStart(m), monthEnd(m), excluded, toBase);
    return { month: monthLabel(m), Income: Math.round(x.income), Expenses: Math.round(x.expense) };
  });

  const ranges: [Range, string][] = [["month", "This month"], ["last", "Last month"], ["12m", "12 months"], ["ytd", "Year to date"], ["custom", "Custom"]];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Money</h1>
        <p className="text-sm text-black/60">{from} to {to}</p>
      </div>
      <MoneyTabs />
      <div className="flex flex-wrap items-center gap-1">
        {ranges.map(([k, l]) => (
          <button key={k} onClick={() => setRange(k)}
            className={`rounded-lg px-3 py-1.5 text-sm ${range === k ? "bg-brand-soft font-medium text-brand-dark" : "hover:bg-black/5"}`}>{l}</button>
        ))}
        {range === "custom" && (
          <>
            <input type="date" className="input w-40" value={cFrom} onChange={(e) => setCFrom(e.target.value)} />
            <input type="date" className="input w-40" value={cTo} onChange={(e) => setCTo(e.target.value)} />
          </>
        )}
      </div>
      {s.skipped > 0 && <p className="text-xs text-loss">{s.skipped} transaction(s) skipped because no exchange rate was available.</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card"><p className="text-xs uppercase text-black/50">Income</p><p className="mt-1 text-2xl font-semibold text-brand-dark">{fmt(s.income)}</p></div>
        <div className="card"><p className="text-xs uppercase text-black/50">Expenses</p><p className="mt-1 text-2xl font-semibold text-loss">{fmt(s.expense)}</p></div>
        <div className="card"><p className="text-xs uppercase text-black/50">Invested</p><p className="mt-1 text-2xl font-semibold">{fmt(s.invested)}</p></div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-2 font-medium">Spending by category</h2>
          {hide ? <p className="py-16 text-center text-sm text-black/50">Hidden</p>
            : cats.length === 0 ? <p className="py-16 text-center text-sm text-black/50">No expenses in this period.</p> : (
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={cats} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                    {cats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="card">
          <h2 className="mb-2 font-medium">Income vs expenses by month</h2>
          {hide ? <p className="py-16 text-center text-sm text-black/50">Hidden</p>
            : monthly.length === 0 ? <p className="py-16 text-center text-sm text-black/50">Nothing to show.</p> : (
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0001" />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis fontSize={11} width={70} tickFormatter={(v: number) => fmt(v)} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="Income" fill="#3b6e4f" />
                  <Bar dataKey="Expenses" fill="#b4472f" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-medium">Category totals</h2>
          <ul className="divide-y divide-black/5 text-sm">
            {cats.map((c) => (
              <li key={c.name} className="flex justify-between py-2"><span>{c.name}</span><span>{fmt(c.value)}</span></li>
            ))}
            {cats.length === 0 && <li className="py-2 text-black/50">None</li>}
          </ul>
        </div>
        <div className="card">
          <h2 className="mb-3 font-medium">All time</h2>
          <ul className="divide-y divide-black/5 text-sm">
            <li className="flex justify-between py-2"><span>Income</span><span>{fmt(lifetime.income)}</span></li>
            <li className="flex justify-between py-2"><span>Expenses</span><span>{fmt(lifetime.expense)}</span></li>
            <li className="flex justify-between py-2"><span>Invested</span><span>{fmt(lifetime.invested)}</span></li>
            <li className="flex justify-between py-2 font-medium"><span>Saved (income − expenses)</span><span>{fmt(lifetime.income - lifetime.expense)}</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
