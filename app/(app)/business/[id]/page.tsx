"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCurrency } from "@/components/CurrencyProvider";
import { bizTotals, useBusiness } from "@/components/useBusiness";
import { removeItem, updateItem } from "@/lib/db";

export default function BusinessDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { uid, businesses, entries, liabilities, loading, error, reload } = useBusiness();
  const { fmt } = useCurrency();
  const [err, setErr] = useState<string | null>(null);

  if (loading) return <p className="text-sm text-black/60">Loading…</p>;
  const b = businesses.find((x) => x.id === id);
  if (!b) return <p className="text-sm text-black/60">Business not found. <Link href="/business" className="underline">Back</Link></p>;

  const mine = entries.filter((e) => e.business_id === b.id);
  const years = Array.from(new Set([...(b.years ?? []), ...mine.map((e) => Number(e.date.slice(0, 4)))])).sort((x, y) => y - x);
  const pending = liabilities.filter((l) => l.business_id === b.id && !l.paid).reduce((s, l) => s + Number(l.amount), 0);

  const run = async (fn: () => Promise<unknown>) => {
    try { setErr(null); await fn(); await reload(); } catch (e) { setErr((e as Error).message); }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-black/60"><Link href="/business" className="underline">Business</Link> › {b.name}</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold">{b.name}</h1>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={() => run(() => updateItem(uid, "businesses", b.id, { daywise: !b.daywise }))}>
            Day-wise {b.daywise ? "ON" : "OFF"}
          </button>
          <Link href={`/business/${b.id}/liabilities`} className="btn-ghost">Liabilities{pending > 0 ? ` (${fmt(pending, b.currency)})` : ""}</Link>
          <button className="btn" onClick={() => {
            const y = Number(prompt("Which year? (e.g. 2026)"));
            if (!Number.isInteger(y) || y < 1990 || y > 2100) return;
            run(() => updateItem(uid, "businesses", b.id, { years: Array.from(new Set([...(b.years ?? []), y])) }));
          }}>+ Add Year</button>
        </div>
      </div>
      <p className="text-xs text-black/50">
        {b.daywise ? "Day-wise: record each income or expense on its own date." : "Monthly: record one total per entry, filed under the month."}
      </p>
      {(err || error) && <p className="rounded-lg bg-loss/10 p-3 text-sm text-loss">{err ?? error}</p>}

      {years.length === 0 ? <div className="card text-center text-sm text-black/60">No years yet. Click “+ Add Year”.</div> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {years.map((y) => {
            const ye = mine.filter((e) => e.date.startsWith(String(y)));
            const t = bizTotals(ye);
            const months = new Set(ye.map((e) => e.date.slice(0, 7))).size;
            return (
              <div key={y} className="card border-t-4 border-t-brand">
                <div className="flex items-start justify-between">
                  <Link href={`/business/${b.id}/${y}`} className="font-serif text-2xl font-semibold hover:underline">{y}</Link>
                  <button className="text-xs text-loss underline" onClick={() => {
                    if (!confirm(`Delete year ${y} and its ${ye.length} entries?`)) return;
                    run(async () => {
                      for (const e of ye) await removeItem(uid, "business_entries", e.id);
                      await updateItem(uid, "businesses", b.id, { years: (b.years ?? []).filter((v) => v !== y) });
                    });
                  }}>Delete</button>
                </div>
                <Link href={`/business/${b.id}/${y}`} className="mt-1 block text-sm">
                  <p className="text-xs text-black/50">{months} month{months === 1 ? "" : "s"} of data</p>
                  <p className="mt-2"><span className="text-brand-dark">Gross: {fmt(t.gross, b.currency)}</span> · <span>Net: {fmt(t.net, b.currency)}</span></p>
                </Link>
              </div>
            );
          })}
        </div>
      )}
      <button className="text-xs text-black/40 underline" onClick={() => router.push("/business")}>← Back to all businesses</button>
    </div>
  );
}
