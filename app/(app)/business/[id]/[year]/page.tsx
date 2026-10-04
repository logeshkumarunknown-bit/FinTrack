"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCurrency } from "@/components/CurrencyProvider";
import { bizTotals, useBusiness } from "@/components/useBusiness";
import { addItem, removeItem, updateItem } from "@/lib/db";
import { monthLabel, today } from "@/lib/dates";

interface Form {
  id?: string;
  type: "income" | "expense";
  date: string;
  month: string; // "01".."12" when day-wise is off
  amount: string;
  category: string;
  note: string;
}

export default function BusinessYear() {
  const { id, year } = useParams<{ id: string; year: string }>();
  const { uid, businesses, entries, loading, error, reload } = useBusiness();
  const { fmt } = useCurrency();
  const now = new Date();
  const [sel, setSel] = useState<string>(String(now.getFullYear()) === year ? String(now.getMonth() + 1).padStart(2, "0") : "01");
  const [form, setForm] = useState<Form | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (loading) return <p className="text-sm text-black/60">Loading…</p>;
  const b = businesses.find((x) => x.id === id);
  if (!b) return <p className="text-sm text-black/60">Business not found. <Link href="/business" className="underline">Back</Link></p>;

  const ye = entries.filter((e) => e.business_id === b.id && e.date.startsWith(year));
  const yt = bizTotals(ye);
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const inSel = ye.filter((e) => e.date.slice(5, 7) === sel);
  const cats = Array.from(new Set(entries.filter((e) => e.business_id === b.id && e.category).map((e) => e.category as string)));

  const blank = (type: "income" | "expense"): Form => {
    const t = today();
    const date = t.startsWith(`${year}-${sel}`) ? t : `${year}-${sel}-01`;
    return { type, date, month: sel, amount: "", category: "", note: "" };
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const amount = Number(form.amount);
    if (!(amount > 0)) return setErr("Enter an amount above zero.");
    const date = b!.daywise ? form.date : `${year}-${form.month}-01`;
    if (!date.startsWith(year)) return setErr(`Date must be in ${year}.`);
    const row = { business_id: b!.id, type: form.type, date, amount, category: form.category.trim() || null, note: form.note.trim() || null };
    try {
      if (form.id) await updateItem(uid, "business_entries", form.id, row);
      else await addItem(uid, "business_entries", row);
      setSel(date.slice(5, 7));
      setForm(null);
      setErr(null);
      await reload();
    } catch (x) { setErr((x as Error).message); }
  }

  async function del(entryId: string) {
    if (!confirm("Delete this entry?")) return;
    try { await removeItem(uid, "business_entries", entryId); await reload(); } catch (x) { setErr((x as Error).message); }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-black/60">
        <Link href="/business" className="underline">Business</Link> › <Link href={`/business/${b.id}`} className="underline">{b.name}</Link> › {year}
      </p>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold">{b.name} · {year}</h1>
          <p className="text-sm text-black/60">Gross {fmt(yt.gross, b.currency)} · Expenses {fmt(yt.expense, b.currency)} · Net {fmt(yt.net, b.currency)}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={() => setForm(blank("income"))}>+ Income</button>
          <button className="btn-ghost" onClick={() => setForm(blank("expense"))}>+ Expense</button>
        </div>
      </div>
      {(err || error) && <p className="rounded-lg bg-loss/10 p-3 text-sm text-loss">{err ?? error}</p>}

      {form && (
        <form onSubmit={save} className="card grid gap-4 sm:grid-cols-2">
          <h2 className="font-medium capitalize sm:col-span-2">{form.id ? "Edit" : "New"} {form.type}</h2>
          {b.daywise ? (
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" required value={form.date} min={`${year}-01-01`} max={`${year}-12-31`}
                onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          ) : (
            <div>
              <label className="label">Month</label>
              <select className="input" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })}>
                {months.map((m) => <option key={m} value={m}>{monthLabel(`${year}-${m}`)}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Amount ({b.currency})</label>
            <input className="input" type="number" min="0" step="any" required autoFocus value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <label className="label">Category (optional)</label>
            <input className="input" list="bizcats" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <datalist id="bizcats">{cats.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <div>
            <label className="label">Note (optional)</label>
            <input className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <button className="btn">Save</button>
            <button type="button" className="btn-ghost" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {months.map((m) => {
          const t = bizTotals(ye.filter((e) => e.date.slice(5, 7) === m));
          return (
            <button key={m} onClick={() => setSel(m)}
              className={`rounded-xl border p-3 text-left ${sel === m ? "border-brand bg-brand-soft" : "border-black/10 bg-white hover:bg-black/5"}`}>
              <p className="text-xs font-medium">{monthLabel(`${year}-${m}`).split(" ")[0]}</p>
              <p className="mt-1 text-xs text-brand-dark">{fmt(t.gross, b.currency)}</p>
              <p className="text-xs text-black/60">Net {fmt(t.net, b.currency)}</p>
            </button>
          );
        })}
      </div>

      <div className="card overflow-x-auto p-0">
        <div className="border-b border-black/10 px-4 py-3 text-sm font-medium">{monthLabel(`${year}-${sel}`)}</div>
        {inSel.length === 0 ? <p className="p-8 text-center text-sm text-black/60">No entries this month.</p> : (
          <table className="w-full text-left text-sm">
            <tbody>
              {inSel.map((e) => (
                <tr key={e.id} className="border-b border-black/5 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3">{b.daywise ? e.date : "Monthly"}</td>
                  <td className="px-4 py-3"><span className="font-medium">{e.category ?? (e.type === "income" ? "Income" : "Expense")}</span>
                    {e.note && <span className="block text-xs text-black/50">{e.note}</span>}</td>
                  <td className={`whitespace-nowrap px-4 py-3 text-right font-medium ${e.type === "income" ? "text-brand-dark" : "text-loss"}`}>
                    {e.type === "income" ? "+" : "−"}{fmt(Number(e.amount), b.currency)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button className="mr-3 text-brand underline" onClick={() => setForm({
                      id: e.id, type: e.type, date: e.date, month: e.date.slice(5, 7), amount: String(e.amount), category: e.category ?? "", note: e.note ?? "",
                    })}>Edit</button>
                    <button className="text-loss underline" onClick={() => del(e.id)}>Delete</button>
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
