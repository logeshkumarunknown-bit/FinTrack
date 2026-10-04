"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import { useData } from "@/components/DataProvider";
import { useUser } from "@/components/UserProvider";
import { useNewParam } from "@/components/useNewParam";
import { MoneyTabs } from "@/components/Tabs";
import { CURRENCIES } from "@/lib/currency";
import { categoriesFor, excludedFor } from "@/lib/categories";
import { addItem, removeItem, updateItem } from "@/lib/db";
import { addPeriod, monthEnd, monthKey, monthLabel, monthStart, shiftMonth, today } from "@/lib/dates";
import { summarize } from "@/lib/finance";
import type { Frequency, TxnType } from "@/lib/types";

interface Form {
  id?: string;
  type: TxnType;
  date: string;
  amount: string;
  currency: string;
  category: string;
  account_id: string;
  to_account_id: string;
  note: string;
  repeat: "" | Frequency;
}

type Filter = "all" | TxnType;

export default function TransactionsPage() {
  const { user } = useAuth();
  const uid = user!.uid;
  const { txns, accounts, rules, reload, loading, error: dataError } = useData();
  const { data: userDoc } = useUser();
  const { base, fmt, toBase } = useCurrency();
  const newParam = useNewParam();

  const [month, setMonth] = useState(monthKey(today()));
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catTouched, setCatTouched] = useState(false);

  const blank = (type: TxnType): Form => ({
    type, date: today(), amount: "", currency: accounts[0]?.currency ?? base,
    category: type === "income" ? categoriesFor("income", userDoc)[0] : categoriesFor("expense", userDoc)[0],
    account_id: accounts[0]?.id ?? "", to_account_id: "", note: "", repeat: "",
  });

  useEffect(() => {
    if (newParam === "expense" || newParam === "income" || newParam === "transfer") {
      setForm(blank(newParam));
      setCatTouched(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newParam]);

  const accName = (id?: string | null) => accounts.find((a) => a.id === id)?.name ?? "";
  const q = search.trim().toLowerCase();
  const inMonth = txns.filter((t) => t.date >= monthStart(month) && t.date <= monthEnd(month));
  const shown = inMonth.filter((t) => (filter === "all" || t.type === filter) &&
    (!q || `${t.note ?? ""} ${t.category} ${accName(t.account_id)}`.toLowerCase().includes(q)));
  const sum = summarize(txns, monthStart(month), monthEnd(month), excludedFor(userDoc), toBase);

  function setNote(note: string) {
    if (!form) return;
    let category = form.category;
    if (!catTouched && form.type !== "transfer") {
      const low = note.toLowerCase();
      const hit = rules.find((r) => r.keyword && low.includes(r.keyword.toLowerCase()));
      if (hit) category = hit.category;
    }
    setForm({ ...form, note, category });
  }

  function pickAccount(id: string) {
    if (!form) return;
    const a = accounts.find((x) => x.id === id);
    setForm({ ...form, account_id: id, currency: a ? a.currency : form.currency });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const amount = Number(form.amount);
    if (!(amount > 0)) return setError("Enter an amount greater than zero.");
    if (form.type === "transfer") {
      if (!form.account_id || !form.to_account_id) return setError("Pick both accounts for a transfer.");
      if (form.account_id === form.to_account_id) return setError("Pick two different accounts.");
    }
    setSaving(true);
    setError(null);
    const row = {
      type: form.type, date: form.date, amount, currency: form.currency,
      category: form.type === "transfer" ? "Transfer" : form.category,
      account_id: form.account_id || null,
      to_account_id: form.type === "transfer" ? form.to_account_id : null,
      note: form.note.trim() || null,
    };
    try {
      if (form.id) await updateItem(uid, "transactions", form.id, row);
      else {
        await addItem(uid, "transactions", row);
        if (form.repeat && form.type !== "transfer") {
          await addItem(uid, "recurring", {
            type: form.type, amount, currency: form.currency, category: row.category,
            account_id: row.account_id, note: row.note, frequency: form.repeat,
            next_date: addPeriod(form.date, form.repeat), active: true,
          });
        }
      }
      setForm(null);
      await reload();
    } catch (e) {
      setError((e as Error).message);
    }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this transaction?")) return;
    try {
      await removeItem(uid, "transactions", id);
      await reload();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const cats = form && form.type !== "transfer" ? categoriesFor(form.type, userDoc) : [];
  if (form && form.type !== "transfer" && form.category && !cats.includes(form.category)) cats.push(form.category);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Money</h1>
          <p className="text-sm text-black/60">
            {monthLabel(month)}: income {fmt(sum.income)} · expenses {fmt(sum.expense)}
            {sum.skipped > 0 && ` · ${sum.skipped} not counted (no exchange rate)`}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={() => { setForm(blank("expense")); setCatTouched(false); }}>+ Expense</button>
          <button className="btn-ghost" onClick={() => { setForm(blank("income")); setCatTouched(false); }}>+ Income</button>
          <button className="btn-ghost" onClick={() => setForm(blank("transfer"))}>+ Transfer</button>
        </div>
      </div>
      <MoneyTabs />

      {(error || dataError) && <p className="rounded-lg bg-loss/10 p-3 text-sm text-loss">{error ?? dataError}</p>}

      {form && (
        <form onSubmit={save} className="card grid gap-4 sm:grid-cols-2">
          <h2 className="font-medium capitalize sm:col-span-2">{form.id ? "Edit" : "New"} {form.type}</h2>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" required value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="label">Amount</label>
            <input className="input" type="number" min="0" step="0.01" required autoFocus value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <label className="label">{form.type === "transfer" ? "From account" : "Account (optional)"}</label>
            <select className="input" value={form.account_id} onChange={(e) => pickAccount(e.target.value)}>
              <option value="">{form.type === "transfer" ? "Select…" : "None"}</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
            </select>
          </div>
          {form.type === "transfer" ? (
            <div>
              <label className="label">To account</label>
              <select className="input" value={form.to_account_id}
                onChange={(e) => setForm({ ...form, to_account_id: e.target.value })}>
                <option value="">Select…</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category}
                onChange={(e) => { setCatTouched(true); setForm({ ...form, category: e.target.value }); }}>
                {cats.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Currency</label>
            <select className="input" value={form.currency} disabled={!!form.account_id}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            {form.account_id && <p className="mt-1 text-xs text-black/50">Uses the account&apos;s currency.</p>}
          </div>
          <div>
            <label className="label">Note (optional)</label>
            <input className="input" value={form.note} onChange={(e) => setNote(e.target.value)} />
          </div>
          {!form.id && form.type !== "transfer" && (
            <div>
              <label className="label">Repeat</label>
              <select className="input" value={form.repeat}
                onChange={(e) => setForm({ ...form, repeat: e.target.value as Form["repeat"] })}>
                <option value="">Does not repeat</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          )}
          <div className="flex gap-2 sm:col-span-2">
            <button className="btn" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            <button type="button" className="btn-ghost" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button className="btn-ghost px-3" onClick={() => setMonth(shiftMonth(month, -1))}>‹</button>
          <span className="w-24 text-center text-sm font-medium">{monthLabel(month)}</span>
          <button className="btn-ghost px-3" onClick={() => setMonth(shiftMonth(month, 1))}>›</button>
        </div>
        <div className="flex gap-1">
          {(["all", "expense", "income", "transfer"] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm capitalize ${filter === f ? "bg-brand-soft font-medium text-brand-dark" : "hover:bg-black/5"}`}>
              {f}
            </button>
          ))}
        </div>
        <input className="input max-w-xs" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-x-auto p-0">
        {loading ? (
          <p className="p-5 text-sm text-black/60">Loading…</p>
        ) : shown.length === 0 ? (
          <p className="p-8 text-center text-sm text-black/60">No transactions for this view.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase text-black/50">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {shown.map((t) => (
                <tr key={t.id} className="border-b border-black/5 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3">{t.date}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{t.category}</span>
                    {t.recurring_id && <span className="ml-2 rounded bg-black/5 px-1.5 text-xs">repeat</span>}
                    {t.note && <span className="block text-xs text-black/50">{t.note}</span>}
                  </td>
                  <td className="px-4 py-3 text-black/60">
                    {t.type === "transfer" ? `${accName(t.account_id)} → ${accName(t.to_account_id)}` : accName(t.account_id) || "—"}
                  </td>
                  <td className={`whitespace-nowrap px-4 py-3 text-right font-medium ${t.type === "income" ? "text-brand-dark" : t.type === "expense" ? "text-loss" : ""}`}>
                    {t.type === "income" ? "+" : t.type === "expense" ? "−" : ""}{fmt(Number(t.amount), t.currency)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button className="mr-3 text-brand underline" onClick={() => {
                      setCatTouched(true);
                      setForm({
                        id: t.id, type: t.type, date: t.date, amount: String(t.amount), currency: t.currency,
                        category: t.category, account_id: t.account_id ?? "", to_account_id: t.to_account_id ?? "",
                        note: t.note ?? "", repeat: "",
                      });
                    }}>Edit</button>
                    <button className="text-loss underline" onClick={() => remove(t.id)}>Delete</button>
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
