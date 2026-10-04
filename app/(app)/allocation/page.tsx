"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useCurrency } from "@/components/CurrencyProvider";
import { useData } from "@/components/DataProvider";
import { useNetWorth } from "@/components/useNetWorth";
import { WealthTabs } from "@/components/Tabs";

const COLORS = ["#3b6e4f", "#c08a2e", "#4a6fa5", "#b4472f", "#7c5ba6", "#2f8f9d", "#8a8a5c", "#a65b7c", "#5c5c5c", "#6aa84f"];

export default function AllocationPage() {
  const { holdings } = useData();
  const { base, toBase, fmt, hide } = useCurrency();
  const { accountsTotal, assets } = useNetWorth();

  const map: Record<string, number> = {};
  for (const h of holdings) {
    if (h.kind !== "asset") continue;
    const v = toBase(Number(h.amount), h.currency);
    if (Number.isFinite(v)) map[h.category] = (map[h.category] ?? 0) + v;
  }
  if (Number.isFinite(accountsTotal) && accountsTotal > 0) map["Bank accounts"] = accountsTotal;
  const rows = Object.entries(map).map(([name, value]) => ({ name, value })).filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);
  const total = rows.reduce((s, r) => s + r.value, 0);

  const cur: Record<string, number> = {};
  for (const h of holdings) {
    if (h.kind !== "asset") continue;
    const v = toBase(Number(h.amount), h.currency);
    if (Number.isFinite(v)) cur[h.currency] = (cur[h.currency] ?? 0) + v;
  }
  const curRows = Object.entries(cur).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Wealth</h1>
        <p className="text-sm text-black/60">Where your assets are, in {base}. Total {fmt(assets)}</p>
      </div>
      <WealthTabs />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-2 font-medium">By category</h2>
          {hide ? (
            <p className="py-16 text-center text-sm text-black/50">Hidden</p>
          ) : rows.length === 0 ? (
            <p className="py-16 text-center text-sm text-black/50">Add assets to see your allocation.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={rows} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95}>
                    {rows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="card">
          <h2 className="mb-3 font-medium">Breakdown</h2>
          <ul className="divide-y divide-black/5 text-sm">
            {rows.map((r) => (
              <li key={r.name} className="flex justify-between py-2">
                <span>{r.name}</span>
                <span>{fmt(r.value)} <span className="text-black/50">· {total ? ((r.value / total) * 100).toFixed(1) : 0}%</span></span>
              </li>
            ))}
          </ul>
          {curRows.length > 0 && (
            <>
              <h2 className="mb-2 mt-5 font-medium">By currency</h2>
              <ul className="divide-y divide-black/5 text-sm">
                {curRows.map(([c, v]) => (
                  <li key={c} className="flex justify-between py-2"><span>{c}</span><span>{fmt(v)}</span></li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
