"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCurrency } from "@/components/CurrencyProvider";
import { useBusiness } from "@/components/useBusiness";
import { addItem, removeItem, updateItem } from "@/lib/db";

export default function BusinessLiabilities() {
  const { id } = useParams<{ id: string }>();
  const { uid, businesses, liabilities, loading, error, reload } = useBusiness();
  const { fmt } = useCurrency();
  const [form, setForm] = useState<{ id?: string; name: string; amount: string; due_date: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (loading) return <p className="text-sm text-black/60">Loading…</p>;
  const b = businesses.find((x) => x.id === id);
  if (!b) return <p className="text-sm text-black/60">Business not found. <Link href="/business" className="underline">Back</Link></p>;

  const mine = liabilities.filter((l) => l.business_id === b.id);
  const pending = mine.filter((l) => !l.paid).reduce((s, l) => s + Number(l.amount), 0);

  const run = async (fn: () => Promise<unknown>) => {
    try { setErr(null); await fn(); await reload(); } catch (e) { setErr((e as Error).message); }
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const row = { business_id: b!.id, name: form.name.trim(), amount: Number(form.amount), due_date: form.due_date || null };
    await run(async () => {
      if (form.id) await updateItem(uid, "business_liabilities", form.id, row);
      else await addItem(uid, "business_liabilities", { ...row, paid: false });
      setForm(null);
    });
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-black/60">
        <Link href="/business" className="underline">Business</Link> › <Link href={`/business/${b.id}`} className="underline">{b.name}</Link> › Liabilities
      </p>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold">{b.name} liabilities</h1>
          <p className="text-sm text-black/60">Pending {fmt(pending, b.currency)} (subtracted from Final Net)</p>
        </div>
        <button className="btn" onClick={() => setForm({ name: "", amount: "", due_date: "" })}>+ Add liability</button>
      </div>
      {(err || error) && <p className="rounded-lg bg-loss/10 p-3 text-sm text-loss">{err ?? error}</p>}

      {form && (
        <form onSubmit={save} className="card grid gap-4 sm:grid-cols-3">
          <div><label className="label">Name</label><input className="input" required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Amount ({b.currency})</label><input className="input" type="number" min="0" step="any" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
          <div><label className="label">Due date (optional)</label><input className="input" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
          <div className="flex gap-2 sm:col-span-3">
            <button className="btn">Save</button>
            <button type="button" className="btn-ghost" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto p-0">
        {mine.length === 0 ? <p className="p-8 text-center text-sm text-black/60">No liabilities.</p> : (
          <table className="w-full text-left text-sm">
            <tbody>
              {mine.map((l) => (
                <tr key={l.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3">
                    <span className={`font-medium ${l.paid ? "text-black/40 line-through" : ""}`}>{l.name}</span>
                    {l.due_date && <span className="block text-xs text-black/50">Due {l.due_date}</span>}
                  </td>
                  <td className="px-4 py-3 text-right">{fmt(Number(l.amount), b.currency)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button className="mr-3 text-brand underline" onClick={() => run(() => updateItem(uid, "business_liabilities", l.id, { paid: !l.paid }))}>
                      {l.paid ? "Mark pending" : "Mark paid"}
                    </button>
                    <button className="mr-3 text-brand underline" onClick={() => setForm({ id: l.id, name: l.name, amount: String(l.amount), due_date: l.due_date ?? "" })}>Edit</button>
                    <button className="text-loss underline" onClick={() => confirm("Delete this liability?") && run(() => removeItem(uid, "business_liabilities", l.id))}>Delete</button>
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
