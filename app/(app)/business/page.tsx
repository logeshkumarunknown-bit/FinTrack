"use client";

import { useState } from "react";
import Link from "next/link";
import { useCurrency } from "@/components/CurrencyProvider";
import { bizTotals, useBusiness } from "@/components/useBusiness";
import { CURRENCIES } from "@/lib/currency";
import { addItem, removeItem, updateItem } from "@/lib/db";

export default function BusinessPage() {
  const { uid, businesses, entries, liabilities, loading, error, reload } = useBusiness();
  const { base, fmt } = useCurrency();
  const [tab, setTab] = useState<"active" | "forecast">("active");
  const [form, setForm] = useState<{ id?: string; name: string; currency: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [pct, setPct] = useState("");

  const list = businesses.filter((b) => (tab === "forecast") === !!b.forecast);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    try {
      if (form.id) await updateItem(uid, "businesses", form.id, { name: form.name.trim(), currency: form.currency });
      else await addItem(uid, "businesses", {
        name: form.name.trim(), currency: form.currency, forecast: tab === "forecast", daywise: true, years: [new Date().getFullYear()],
      });
      setForm(null);
      await reload();
    } catch (x) { setErr((x as Error).message); }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete "${name}" and ALL its entries and liabilities? This cannot be undone.`)) return;
    try {
      for (const e of entries.filter((x) => x.business_id === id)) await removeItem(uid, "business_entries", e.id);
      for (const l of liabilities.filter((x) => x.business_id === id)) await removeItem(uid, "business_liabilities", l.id);
      await removeItem(uid, "businesses", id);
      await reload();
    } catch (x) { setErr((x as Error).message); }
  }

  const a = Number(amount), p = Number(pct);
  const calcOk = amount !== "" && pct !== "" && Number.isFinite(a) && Number.isFinite(p);
  const part = (a * p) / 100;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Business</h1>
          <p className="text-sm text-black/60">Track income and expenses for each business, year by year. Kept separate from your net worth.</p>
        </div>
        <button className="btn" onClick={() => setForm({ name: "", currency: base })}>+ New Business</button>
      </div>

      <div className="flex gap-1">
        {([["active", "Active Business"], ["forecast", "Forecast Business"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`rounded-lg px-3 py-1.5 text-sm ${tab === k ? "bg-brand-soft font-medium text-brand-dark" : "hover:bg-black/5"}`}>{l}</button>
        ))}
      </div>
      {(err || error) && <p className="rounded-lg bg-loss/10 p-3 text-sm text-loss">{err ?? error}</p>}

      {form && (
        <form onSubmit={save} className="card grid gap-4 sm:grid-cols-2">
          <h2 className="font-medium sm:col-span-2">{form.id ? "Edit" : "New"} business</h2>
          <div>
            <label className="label">Name</label>
            <input className="input" required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Currency</label>
            <select className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <button className="btn">Save</button>
            <button type="button" className="btn-ghost" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? <p className="text-sm text-black/60">Loading…</p> : list.length === 0 ? (
        <div className="card text-center text-sm text-black/60">
          {tab === "active" ? "No businesses yet. Click “+ New Business”." : "No forecast businesses. Use “Move to forecast” on a business to plan one."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((b) => {
            const mine = entries.filter((e) => e.business_id === b.id);
            const t = bizTotals(mine);
            const pending = liabilities.filter((l) => l.business_id === b.id && !l.paid).reduce((s, l) => s + Number(l.amount), 0);
            const years = new Set(mine.map((e) => e.date.slice(0, 4)));
            return (
              <div key={b.id} className="card border-t-4 border-t-brand">
                <div className="flex items-start justify-between">
                  <Link href={`/business/${b.id}`} className="font-serif text-xl font-semibold hover:underline">{b.name}</Link>
                  <span className="whitespace-nowrap text-xs">
                    <button className="mr-2 text-brand underline" onClick={() => updateItem(uid, "businesses", b.id, { forecast: !b.forecast }).then(reload).catch((x) => setErr(x.message))}>
                      {b.forecast ? "Make active" : "Move to forecast"}
                    </button>
                    <button className="mr-2 text-brand underline" onClick={() => setForm({ id: b.id, name: b.name, currency: b.currency })}>Edit</button>
                    <button className="text-loss underline" onClick={() => remove(b.id, b.name)}>Delete</button>
                  </span>
                </div>
                <p className="mb-3 text-xs text-black/50">{years.size === 0 ? "No data yet" : `${years.size} year${years.size > 1 ? "s" : ""} of data`}</p>
                <Link href={`/business/${b.id}`} className="block space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-black/60">Gross</span><span className="font-medium text-brand-dark">{fmt(t.gross, b.currency)}</span></div>
                  <div className="flex justify-between"><span className="text-black/60">Net</span><span className="font-medium">{fmt(t.net, b.currency)}</span></div>
                  {pending > 0 && (
                    <>
                      <div className="flex justify-between border-t border-black/5 pt-1"><span className="text-[#c08a2e]">Liabilities (pending)</span><span className="text-[#c08a2e]">{fmt(pending, b.currency)}</span></div>
                      <div className="flex justify-between font-semibold"><span>Final Net</span><span className={t.net - pending < 0 ? "text-loss" : ""}>{fmt(t.net - pending, b.currency)}</span></div>
                    </>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      )}

      <div className="card">
        <h2 className="mb-3 font-medium">Percentage Calculator</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className="label">Amount</label><input className="input" type="number" step="any" placeholder="e.g. 50000" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          <div><label className="label">Percentage (%)</label><input className="input" type="number" step="any" placeholder="e.g. 18" value={pct} onChange={(e) => setPct(e.target.value)} /></div>
          <div className="rounded-lg bg-black/5 p-3 text-sm">
            {!calcOk ? <span className="text-black/50">Enter values to calculate</span> : (
              <ul className="space-y-1">
                <li className="flex justify-between"><span>{pct}% of amount</span><b>{part.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</b></li>
                <li className="flex justify-between"><span>Amount + {pct}%</span><b>{(a + part).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</b></li>
                <li className="flex justify-between"><span>Amount − {pct}%</span><b>{(a - part).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</b></li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
