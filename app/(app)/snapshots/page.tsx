"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from "@/components/AuthProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import { useData } from "@/components/DataProvider";
import { useNetWorth } from "@/components/useNetWorth";
import { WealthTabs } from "@/components/Tabs";
import { removeItem } from "@/lib/db";

export default function SnapshotsPage() {
  const { user } = useAuth();
  const { snapshots, reload, holdings, accounts } = useData();
  const { base, fmt, hide } = useCurrency();
  const { takeSnapshot } = useNetWorth();
  const [msg, setMsg] = useState<string | null>(null);

  const same = snapshots.filter((s) => s.base_currency === base);
  const other = snapshots.length - same.length;
  const empty = holdings.length === 0 && accounts.length === 0;

  async function del(id: string) {
    if (!confirm("Delete this snapshot?")) return;
    try {
      await removeItem(user!.uid, "snapshots", id);
      await reload();
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Wealth</h1>
          <p className="text-sm text-black/60">A snapshot saves today&apos;s net worth so you can see progress over time.</p>
        </div>
        <button className="btn" disabled={empty} onClick={async () => setMsg(await takeSnapshot())}>Take snapshot</button>
      </div>
      <WealthTabs />
      {msg && <p className="rounded-lg bg-brand-soft p-3 text-sm text-brand-dark">{msg}</p>}

      <div className="card">
        <h2 className="mb-2 font-medium">Net worth over time ({base})</h2>
        {hide ? (
          <p className="py-16 text-center text-sm text-black/50">Hidden</p>
        ) : same.length < 2 ? (
          <p className="py-16 text-center text-sm text-black/50">
            Take snapshots on different days to build the chart ({same.length} so far in {base}).
          </p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={same.map((s) => ({ date: s.taken_on, nw: Number(s.net_worth) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0001" />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={11} width={70} tickFormatter={(v: number) => fmt(v)} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Line type="monotone" dataKey="nw" stroke="#3b6e4f" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {other > 0 && <p className="mt-2 text-xs text-black/50">{other} snapshot(s) in other currencies are listed below but not charted.</p>}
      </div>

      <div className="card overflow-x-auto p-0">
        {snapshots.length === 0 ? (
          <p className="p-8 text-center text-sm text-black/60">No snapshots yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase text-black/50">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Assets</th>
                <th className="px-4 py-3 text-right">Liabilities</th>
                <th className="px-4 py-3 text-right">Net worth</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {[...snapshots].reverse().map((s) => (
                <tr key={s.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3">{s.taken_on}</td>
                  <td className="px-4 py-3 text-right">{fmt(Number(s.total_assets), s.base_currency)}</td>
                  <td className="px-4 py-3 text-right">{fmt(Number(s.total_liabilities), s.base_currency)}</td>
                  <td className="px-4 py-3 text-right font-medium">{fmt(Number(s.net_worth), s.base_currency)}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-loss underline" onClick={() => del(s.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
