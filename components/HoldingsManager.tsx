"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { useData } from "./DataProvider";
import { useCurrency } from "./CurrencyProvider";
import { useNewParam } from "./useNewParam";
import { WealthTabs } from "./Tabs";
import { CURRENCIES } from "@/lib/currency";
import { addItem, removeItem, updateItem } from "@/lib/db";
import { ASSET_CATEGORIES, LIABILITY_CATEGORIES, type Kind } from "@/lib/types";

interface FormState {
  id?: string;
  name: string;
  category: string;
  currency: string;
  amount: string;
  interest_rate: string;
  notes: string;
  emi: string;
  start_date: string;
  due_date: string;
}

export default function HoldingsManager({ kind }: { kind: Kind }) {
  const { user } = useAuth();
  const uid = user!.uid;
  const { base, fmt, toBase } = useCurrency();
  const { holdings, loading, error: dataError, reload } = useData();
  const newParam = useNewParam();
  const categories = kind === "asset" ? ASSET_CATEGORIES : LIABILITY_CATEGORIES;
  const noun = kind === "asset" ? "asset" : "liability";
  const items = holdings.filter((h) => h.kind === kind);

  const blank = (): FormState => ({
    name: "", category: categories[0], currency: base, amount: "", interest_rate: "", notes: "",
    emi: "", start_date: "", due_date: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (newParam) setForm(blank());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newParam]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    const row = {
      kind,
      name: form.name.trim(),
      category: form.category,
      currency: form.currency,
      amount: Number(form.amount),
      interest_rate: form.interest_rate === "" ? null : Number(form.interest_rate),
      notes: form.notes.trim() || null,
      emi: kind === "liability" && form.emi !== "" ? Number(form.emi) : null,
      start_date: kind === "liability" && form.start_date ? form.start_date : null,
      due_date: kind === "liability" && form.due_date ? form.due_date : null,
    };
    try {
      if (form.id) await updateItem(uid, "holdings", form.id, row);
      else await addItem(uid, "holdings", row);
      setForm(null);
      await reload();
    } catch (e) {
      setError((e as Error).message);
    }
    setSaving(false);
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await removeItem(uid, "holdings", id);
      await reload();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const total = items.reduce((s, h) => s + toBase(Number(h.amount), h.currency), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Wealth</h1>
          <p className="text-sm text-black/60">
            {items.length} {items.length === 1 ? noun : noun === "asset" ? "assets" : "liabilities"} · Total {fmt(total)}
          </p>
        </div>
        <button className="btn" onClick={() => setForm(blank())}>+ Add {noun}</button>
      </div>

      <WealthTabs />

      {(error || dataError) && <p className="rounded-lg bg-loss/10 p-3 text-sm text-loss">{error ?? dataError}</p>}

      {form && (
        <form onSubmit={save} className="card grid gap-4 sm:grid-cols-2">
          <h2 className="font-medium sm:col-span-2">{form.id ? "Edit" : "New"} {noun}</h2>
          <div className="sm:col-span-2">
            <label className="label">Name</label>
            <input className="input" required value={form.name} autoFocus
              placeholder={kind === "asset" ? "e.g. HDFC Savings, Apple stock" : "e.g. Home Loan - SBI"}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Currency</label>
            <select className="input" value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{kind === "asset" ? "Current value" : "Outstanding amount"}</label>
            <input className="input" type="number" min="0" step="0.01" required value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <label className="label">Interest rate % (optional)</label>
            <input className="input" type="number" min="0" step="0.001" value={form.interest_rate}
              onChange={(e) => setForm({ ...form, interest_rate: e.target.value })} />
          </div>
          {kind === "liability" && (
            <>
              <div>
                <label className="label">Monthly EMI (optional)</label>
                <input className="input" type="number" min="0" step="0.01" value={form.emi}
                  onChange={(e) => setForm({ ...form, emi: e.target.value })} />
              </div>
              <div />
              <div>
                <label className="label">Start date (optional)</label>
                <input className="input" type="date" value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <label className="label">Due / end date (optional)</label>
                <input className="input" type="date" value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </>
          )}
          <div className="sm:col-span-2">
            <label className="label">Notes (optional)</label>
            <input className="input" value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <button className="btn" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            <button type="button" className="btn-ghost" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto p-0">
        {loading ? (
          <p className="p-5 text-sm text-black/60">Loading…</p>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-sm text-black/60">
            {kind === "asset"
              ? "No assets yet. Add investments, savings, property, gold or crypto."
              : "No liabilities. Add loans or credit card balances if you have any."}
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase text-black/50">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                {kind === "liability" && <th className="px-4 py-3 text-right">EMI</th>}
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">In {base}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((h) => (
                <tr key={h.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {h.name}
                    {h.due_date && <span className="block text-xs font-normal text-black/50">Due {h.due_date}</span>}
                  </td>
                  <td className="px-4 py-3 text-black/60">{h.category}</td>
                  {kind === "liability" && (
                    <td className="px-4 py-3 text-right">{h.emi ? fmt(Number(h.emi), h.currency) : "—"}</td>
                  )}
                  <td className="px-4 py-3 text-right">{fmt(Number(h.amount), h.currency)}</td>
                  <td className="px-4 py-3 text-right">{fmt(toBase(Number(h.amount), h.currency))}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button className="mr-3 text-brand underline"
                      onClick={() => setForm({
                        id: h.id, name: h.name, category: h.category, currency: h.currency,
                        amount: String(h.amount),
                        interest_rate: h.interest_rate == null ? "" : String(h.interest_rate),
                        notes: h.notes ?? "",
                        emi: h.emi == null ? "" : String(h.emi),
                        start_date: h.start_date ?? "",
                        due_date: h.due_date ?? "",
                      })}>Edit</button>
                    <button className="text-loss underline" onClick={() => remove(h.id, h.name)}>Delete</button>
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
