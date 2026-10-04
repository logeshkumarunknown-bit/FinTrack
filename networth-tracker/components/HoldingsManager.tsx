"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { CURRENCIES } from "@/lib/currency";
import { ASSET_CATEGORIES, LIABILITY_CATEGORIES, type Holding, type Kind } from "@/lib/types";
import { useCurrency } from "./CurrencyProvider";

interface FormState {
  id?: string;
  name: string;
  category: string;
  currency: string;
  amount: string;
  interest_rate: string;
  notes: string;
}

export default function HoldingsManager({ kind }: { kind: Kind }) {
  const { user } = useAuth();
  const uid = user!.uid; // this component only renders for a signed-in user
  const { base, fmt, toBase } = useCurrency();
  const categories = kind === "asset" ? ASSET_CATEGORIES : LIABILITY_CATEGORIES;
  const noun = kind === "asset" ? "asset" : "liability";

  const blank = useCallback(
    (): FormState => ({
      name: "", category: categories[0], currency: base, amount: "", interest_rate: "", notes: "",
    }),
    [categories, base]
  );

  const [items, setItems] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const snap = await getDocs(
        query(collection(getDb(), "users", uid, "holdings"), where("kind", "==", kind))
      );
      const rows = snap.docs.map((d) => ({ ...(d.data() as Omit<Holding, "id">), id: d.id }));
      rows.sort((x, y) => (y.created_at ?? 0) - (x.created_at ?? 0));
      setItems(rows);
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  }, [uid, kind]);

  useEffect(() => { load(); }, [load]);

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
    };
    try {
      if (form.id) await updateDoc(doc(getDb(), "users", uid, "holdings", form.id), row);
      else await addDoc(collection(getDb(), "users", uid, "holdings"), { ...row, created_at: Date.now() });
    } catch (e) {
      setSaving(false);
      return setError((e as Error).message);
    }
    setSaving(false);
    setForm(null);
    load();
  }

  async function remove(h: Holding) {
    if (!confirm(`Delete "${h.name}"?`)) return;
    try {
      await deleteDoc(doc(getDb(), "users", uid, "holdings", h.id));
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const total = items.reduce((s, h) => s + toBase(Number(h.amount), h.currency), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold capitalize">{noun === "asset" ? "Assets" : "Liabilities"}</h1>
          <p className="text-sm text-black/60">
            {items.length} {items.length === 1 ? noun : noun === "asset" ? "assets" : "liabilities"} · Total {fmt(total)}
          </p>
        </div>
        <button className="btn" onClick={() => setForm(blank())}>+ Add {noun}</button>
      </div>

      {error && <p className="rounded-lg bg-loss/10 p-3 text-sm text-loss">{error}</p>}

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
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">In {base}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((h) => (
                <tr key={h.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 font-medium">{h.name}</td>
                  <td className="px-4 py-3 text-black/60">{h.category}</td>
                  <td className="px-4 py-3 text-right">{fmt(Number(h.amount), h.currency)}</td>
                  <td className="px-4 py-3 text-right">{fmt(toBase(Number(h.amount), h.currency))}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button className="mr-3 text-brand underline"
                      onClick={() => setForm({
                        id: h.id, name: h.name, category: h.category, currency: h.currency,
                        amount: String(h.amount),
                        interest_rate: h.interest_rate == null ? "" : String(h.interest_rate),
                        notes: h.notes ?? "",
                      })}>Edit</button>
                    <button className="text-loss underline" onClick={() => remove(h)}>Delete</button>
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
