"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import { useData } from "@/components/DataProvider";
import { useNetWorth } from "@/components/useNetWorth";
import { EssentialsTabs } from "@/components/Tabs";
import { CURRENCIES } from "@/lib/currency";
import { addItem, removeItem, updateItem } from "@/lib/db";
import { monthsBetween, parseDate, today, ymd } from "@/lib/dates";

const TEMPLATES = ["Emergency fund", "Buy a home", "Retirement", "Child's education", "Vacation", "New car", "Wedding"];

interface Form {
  id?: string;
  name: string;
  target_amount: string;
  currency: string;
  target_date: string;
  track: "networth" | "linked";
  linked_ids: string[];
}

export default function GoalsPage() {
  const { user } = useAuth();
  const uid = user!.uid;
  const { goals, holdings, reload, error: dataError } = useData();
  const { base, conv, fmt } = useCurrency();
  const { net, balances } = useNetWorth();
  const [form, setForm] = useState<Form | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const blank = (name = ""): Form => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 5);
    return { name, target_amount: "", currency: base, target_date: ymd(d), track: "networth", linked_ids: [] };
  };

  const assets = holdings.filter((h) => h.kind === "asset");

  function current(g: { track: string; linked_ids: string[]; currency: string }): number {
    if (g.track === "networth") return conv(net, base, g.currency);
    let sum = 0;
    for (const id of g.linked_ids) {
      if (id.startsWith("h:")) {
        const h = assets.find((x) => x.id === id.slice(2));
        if (h) sum += conv(Number(h.amount), h.currency, g.currency);
      } else {
        const b = balances.find((x) => x.account.id === id.slice(2));
        if (b) sum += conv(b.balance, b.account.currency, g.currency);
      }
    }
    return sum;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const target = Number(form.target_amount);
    if (!(target > 0)) return setErr("Enter a target amount.");
    const row = {
      name: form.name.trim(), target_amount: target, currency: form.currency, target_date: form.target_date,
      track: form.track, linked_ids: form.track === "linked" ? form.linked_ids : [],
    };
    try {
      if (form.id) await updateItem(uid, "goals", form.id, row);
      else await addItem(uid, "goals", row);
      setForm(null);
      setErr(null);
      await reload();
    } catch (e2) {
      setErr((e2 as Error).message);
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete goal "${name}"?`)) return;
    try {
      await removeItem(uid, "goals", id);
      await reload();
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  const toggle = (id: string) => form && setForm({
    ...form,
    linked_ids: form.linked_ids.includes(id) ? form.linked_ids.filter((x) => x !== id) : [...form.linked_ids, id],
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Essentials</h1>
          <p className="text-sm text-black/60">Set targets and see how much you need to save each month.</p>
        </div>
        <button className="btn" onClick={() => setForm(blank())}>+ Add goal</button>
      </div>
      <EssentialsTabs />
      {(err || dataError) && <p className="rounded-lg bg-loss/10 p-3 text-sm text-loss">{err ?? dataError}</p>}

      {!form && goals.length === 0 && (
        <div className="card">
          <p className="mb-3 text-sm text-black/60">Start from a template:</p>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => <button key={t} className="btn-ghost" onClick={() => setForm(blank(t))}>{t}</button>)}
          </div>
        </div>
      )}

      {form && (
        <form onSubmit={save} className="card grid gap-4 sm:grid-cols-2">
          <h2 className="font-medium sm:col-span-2">{form.id ? "Edit" : "New"} goal</h2>
          <div className="sm:col-span-2">
            <label className="label">Name</label>
            <input className="input" required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Target amount</label>
            <input className="input" type="number" min="0" step="any" required value={form.target_amount}
              onChange={(e) => setForm({ ...form, target_amount: e.target.value })} />
          </div>
          <div>
            <label className="label">Currency</label>
            <select className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Target date</label>
            <input className="input" type="date" required value={form.target_date}
              onChange={(e) => setForm({ ...form, target_date: e.target.value })} />
          </div>
          <div>
            <label className="label">Track progress using</label>
            <select className="input" value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value as Form["track"] })}>
              <option value="networth">My total net worth</option>
              <option value="linked">Specific assets / accounts</option>
            </select>
          </div>
          {form.track === "linked" && (
            <div className="sm:col-span-2">
              <label className="label">Linked items</label>
              <div className="flex flex-wrap gap-2">
                {assets.map((h) => (
                  <label key={h.id} className="flex items-center gap-1 rounded-full border border-black/10 px-3 py-1 text-sm">
                    <input type="checkbox" checked={form.linked_ids.includes(`h:${h.id}`)} onChange={() => toggle(`h:${h.id}`)} />{h.name}
                  </label>
                ))}
                {balances.map(({ account: a }) => (
                  <label key={a.id} className="flex items-center gap-1 rounded-full border border-black/10 px-3 py-1 text-sm">
                    <input type="checkbox" checked={form.linked_ids.includes(`a:${a.id}`)} onChange={() => toggle(`a:${a.id}`)} />{a.name}
                  </label>
                ))}
                {assets.length + balances.length === 0 && <p className="text-sm text-black/50">Add assets or accounts first.</p>}
              </div>
            </div>
          )}
          <div className="flex gap-2 sm:col-span-2">
            <button className="btn">Save</button>
            <button type="button" className="btn-ghost" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((g) => {
          const cur = current(g);
          const ok = Number.isFinite(cur);
          const pct = ok ? Math.max(0, Math.min(100, (cur / g.target_amount) * 100)) : 0;
          const months = monthsBetween(parseDate(today()), parseDate(g.target_date));
          const gap = g.target_amount - (ok ? cur : 0);
          return (
            <div key={g.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{g.name}</h3>
                  <p className="text-xs text-black/50">By {g.target_date} · {g.track === "networth" ? "net worth" : `${g.linked_ids.length} linked item(s)`}</p>
                </div>
                <span className="text-sm font-medium">{ok ? `${pct.toFixed(0)}%` : "—"}</span>
              </div>
              <div className="mt-3 h-2 rounded bg-black/10"><div className="h-2 rounded bg-brand" style={{ width: `${pct}%` }} /></div>
              <p className="mt-2 text-sm">{ok ? fmt(cur, g.currency) : "—"} of {fmt(g.target_amount, g.currency)}</p>
              <p className="mt-1 text-xs text-black/60">
                {!ok ? "Waiting for exchange rates."
                  : gap <= 0 ? "Goal reached 🎉"
                  : months <= 0 ? "Target date has passed."
                  : `Save about ${fmt(gap / months, g.currency)} per month (ignores returns).`}
              </p>
              <div className="mt-3 flex gap-3 text-sm">
                <button className="text-brand underline" onClick={() => setForm({
                  id: g.id, name: g.name, target_amount: String(g.target_amount), currency: g.currency,
                  target_date: g.target_date, track: g.track, linked_ids: g.linked_ids ?? [],
                })}>Edit</button>
                <button className="text-loss underline" onClick={() => remove(g.id, g.name)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
