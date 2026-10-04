"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import { useData } from "@/components/DataProvider";
import { useUser } from "@/components/UserProvider";
import { MoneyTabs } from "@/components/Tabs";
import { DEFAULT_EXPENSE, DEFAULT_INCOME, categoriesFor, excludedFor } from "@/lib/categories";
import { addItem, removeItem, updateItem } from "@/lib/db";

export default function MoneySettingsPage() {
  const { user } = useAuth();
  const uid = user!.uid;
  const { recurring, rules, reload } = useData();
  const { data, saveUser } = useUser();
  const { fmt } = useCurrency();
  const [err, setErr] = useState<string | null>(null);
  const [newCat, setNewCat] = useState("");
  const [catType, setCatType] = useState<"expense" | "income">("expense");
  const [kw, setKw] = useState("");
  const [kwCat, setKwCat] = useState(DEFAULT_EXPENSE[0]);

  const run = async (fn: () => Promise<unknown>) => {
    try { setErr(null); await fn(); } catch (e) { setErr((e as Error).message); }
  };

  const excluded = excludedFor(data);
  const hidden = data.hiddenCategories ?? [];
  const allExpense = [...DEFAULT_EXPENSE, ...(data.customExpense ?? [])];
  const allIncome = [...DEFAULT_INCOME, ...(data.customIncome ?? [])];
  const ruleCats = categoriesFor("expense", data).concat(categoriesFor("income", data));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Money</h1>
        <p className="text-sm text-black/60">Recurring payments, categories and rules.</p>
      </div>
      <MoneyTabs />
      {err && <p className="rounded-lg bg-loss/10 p-3 text-sm text-loss">{err}</p>}

      <section className="card">
        <h2 className="mb-1 font-medium">Recurring payments</h2>
        <p className="mb-3 text-xs text-black/50">Create one by adding a transaction with “Repeat”. Due items are added automatically when you open the app.</p>
        {recurring.length === 0 ? <p className="text-sm text-black/50">None yet.</p> : (
          <ul className="divide-y divide-black/5 text-sm">
            {recurring.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  <span className="font-medium">{r.category}</span>{r.note ? ` · ${r.note}` : ""}
                  <span className="block text-xs text-black/50">{r.frequency} · next {r.next_date} · {r.type === "income" ? "+" : "−"}{fmt(Number(r.amount), r.currency)}</span>
                </span>
                <span className="whitespace-nowrap">
                  <button className="mr-3 text-brand underline"
                    onClick={() => run(async () => { await updateItem(uid, "recurring", r.id, { active: !r.active }); await reload(); })}>
                    {r.active ? "Pause" : "Resume"}
                  </button>
                  <button className="text-loss underline"
                    onClick={() => run(async () => { if (confirm("Delete this recurring payment? Past transactions stay.")) { await removeItem(uid, "recurring", r.id); await reload(); } })}>
                    Delete
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card space-y-3">
        <h2 className="font-medium">Categories</h2>
        <div className="flex flex-wrap gap-2">
          <select className="input w-32" value={catType} onChange={(e) => setCatType(e.target.value as "expense" | "income")}>
            <option value="expense">Expense</option><option value="income">Income</option>
          </select>
          <input className="input max-w-xs" placeholder="New category name" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
          <button className="btn" onClick={() => run(async () => {
            const name = newCat.trim();
            if (!name) return;
            const key = catType === "expense" ? "customExpense" : "customIncome";
            const list = (catType === "expense" ? allExpense : allIncome);
            if (list.some((c) => c.toLowerCase() === name.toLowerCase())) throw new Error("That category already exists.");
            await saveUser({ [key]: [...(data[key] ?? []), name] });
            setNewCat("");
          })}>Add</button>
        </div>
        <p className="text-xs text-black/50">Tick a category to show it in forms. Untick to hide it (past transactions are kept).</p>
        {([["Expense", allExpense, data.customExpense ?? [], "customExpense"], ["Income", allIncome, data.customIncome ?? [], "customIncome"]] as const).map(([title, list, custom, key]) => (
          <div key={title}>
            <p className="mb-1 text-xs font-medium uppercase text-black/50">{title}</p>
            <div className="flex flex-wrap gap-2">
              {list.map((c) => {
                const on = !hidden.includes(c);
                return (
                  <label key={c} className="flex items-center gap-1 rounded-full border border-black/10 px-3 py-1 text-sm">
                    <input type="checkbox" checked={on}
                      onChange={() => run(() => saveUser({ hiddenCategories: on ? [...hidden, c] : hidden.filter((x) => x !== c) }))} />
                    {c}
                    {custom.includes(c) && (
                      <button className="ml-1 text-loss" title="Remove custom category"
                        onClick={() => run(() => saveUser({ [key]: custom.filter((x) => x !== c) }))}>×</button>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="card space-y-3">
        <h2 className="font-medium">Budget & insights exclusions</h2>
        <p className="text-xs text-black/50">Ticked categories are NOT counted as spending (e.g. investments and card bill payments, which would double count).</p>
        <div className="flex flex-wrap gap-2">
          {allExpense.map((c) => (
            <label key={c} className="flex items-center gap-1 rounded-full border border-black/10 px-3 py-1 text-sm">
              <input type="checkbox" checked={excluded.includes(c)}
                onChange={() => run(() => saveUser({ excluded: excluded.includes(c) ? excluded.filter((x) => x !== c) : [...excluded, c] }))} />
              {c}
            </label>
          ))}
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="font-medium">Categorisation rules</h2>
        <p className="text-xs text-black/50">When a note contains the keyword, the category is picked for you while adding a transaction.</p>
        <div className="flex flex-wrap gap-2">
          <input className="input max-w-xs" placeholder="Keyword, e.g. swiggy" value={kw} onChange={(e) => setKw(e.target.value)} />
          <select className="input w-56" value={kwCat} onChange={(e) => setKwCat(e.target.value)}>
            {ruleCats.map((c) => <option key={c}>{c}</option>)}
          </select>
          <button className="btn" onClick={() => run(async () => {
            if (!kw.trim()) return;
            await addItem(uid, "rules", { keyword: kw.trim(), category: kwCat });
            setKw("");
            await reload();
          })}>Add rule</button>
        </div>
        <ul className="divide-y divide-black/5 text-sm">
          {rules.map((r) => (
            <li key={r.id} className="flex justify-between py-2">
              <span>“{r.keyword}” → <span className="font-medium">{r.category}</span></span>
              <button className="text-loss underline" onClick={() => run(async () => { await removeItem(uid, "rules", r.id); await reload(); })}>Delete</button>
            </li>
          ))}
          {rules.length === 0 && <li className="py-2 text-black/50">No rules yet.</li>}
        </ul>
      </section>
    </div>
  );
}
