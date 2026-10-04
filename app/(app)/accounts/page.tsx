"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import { useData } from "@/components/DataProvider";
import { useNetWorth } from "@/components/useNetWorth";
import { useNewParam } from "@/components/useNewParam";
import { MoneyTabs } from "@/components/Tabs";
import { CURRENCIES } from "@/lib/currency";
import { addItem, removeItem, updateItem } from "@/lib/db";
import { ACCOUNT_TYPES } from "@/lib/types";

interface Form {
  id?: string;
  name: string;
  type: string;
  currency: string;
  opening_balance: string;
}

export default function AccountsPage() {
  const { user } = useAuth();
  const uid = user!.uid;
  const { reload, loading, error: dataError, txns } = useData();
  const { base, fmt } = useCurrency();
  const { balances, accountsTotal } = useNetWorth();
  const newParam = useNewParam();
  const blank = (): Form => ({ name: "", type: ACCOUNT_TYPES[0], currency: base, opening_balance: "0" });
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      name: form.name.trim(), type: form.type, currency: form.currency,
      opening_balance: Number(form.opening_balance) || 0,
    };
    try {
      if (form.id) await updateItem(uid, "accounts", form.id, row);
      else await addItem(uid, "accounts", row);
      setForm(null);
      await reload();
    } catch (e) {
      setError((e as Error).message);
    }
    setSaving(false);
  }

  async function remove(id: string, name: string) {
    const used = txns.filter((t) => t.account_id === id || t.to_account_id === id).length;
    const warn = used ? `\n\n${used} transaction(s) use this account. They will stay but show no account.` : "";
    if (!confirm(`Delete account "${name}"?${warn}`)) return;
    try {
      await removeItem(uid, "accounts", id);
      await reload();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Money</h1>
          <p className="text-sm text-black/60">
            {balances.length} account(s) · Total {fmt(accountsTotal)} (counted in your net worth)
          </p>
        </div>
        <button className="btn" onClick={() => setForm(blank())}>+ Add account</button>
      </div>
      <MoneyTabs />
      {(error || dataError) && <p className="rounded-lg bg-loss/10 p-3 text-sm text-loss">{error ?? dataError}</p>}

      {form && (
        <form onSubmit={save} className="card grid gap-4 sm:grid-cols-2">
          <h2 className="font-medium sm:col-span-2">{form.id ? "Edit" : "New"} account</h2>
          <div className="sm:col-span-2">
            <label className="label">Name</label>
            <input className="input" required autoFocus value={form.name} placeholder="e.g. HDFC Savings, Wallet"
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {ACCOUNT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Currency</label>
            <select className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Opening balance (negative for a credit card you owe on)</label>
            <input className="input" type="number" step="0.01" value={form.opening_balance}
              onChange={(e) => setForm({ ...form, opening_balance: e.target.value })} />
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
        ) : balances.length === 0 ? (
          <p className="p-8 text-center text-sm text-black/60">
            No accounts yet. Add your bank accounts, cards and wallets to track balances from your transactions.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase text-black/50">
              <tr>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Balance</th>
                <th className="px-4 py-3 text-right">In {base}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {balances.map(({ account: a, balance, inBase }) => (
                <tr key={a.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 font-medium">{a.name}</td>
                  <td className="px-4 py-3 text-black/60">{a.type}</td>
                  <td className="px-4 py-3 text-right">{fmt(balance, a.currency)}</td>
                  <td className="px-4 py-3 text-right">{fmt(inBase)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button className="mr-3 text-brand underline" onClick={() => setForm({
                      id: a.id, name: a.name, type: a.type, currency: a.currency,
                      opening_balance: String(a.opening_balance),
                    })}>Edit</button>
                    <button className="text-loss underline" onClick={() => remove(a.id, a.name)}>Delete</button>
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
