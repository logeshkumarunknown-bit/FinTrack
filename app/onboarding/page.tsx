"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useUser } from "@/components/UserProvider";
import { CURRENCIES } from "@/lib/currency";
import { addItem } from "@/lib/db";
import { ASSET_CATEGORIES } from "@/lib/types";

interface Row { name: string; category: string; amount: string }

export default function Onboarding() {
  const { user, loading } = useAuth();
  const { data, loading: userLoading, loadError, saveUser } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [currency, setCurrency] = useState("INR");
  const [income, setIncome] = useState("");
  const [expense, setExpense] = useState("");
  const [dependents, setDependents] = useState("");
  const [rows, setRows] = useState<Row[]>([{ name: "", category: ASSET_CATEGORIES[0], amount: "" }]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (data.baseCurrency) setCurrency(data.baseCurrency);
  }, [data.baseCurrency]);

  if (loading || !user || userLoading) return <p className="p-8 text-sm text-black/60">Loading…</p>;
  if (loadError) return <p className="m-8 rounded-lg bg-loss/10 p-4 text-sm text-loss">Couldn&apos;t load your data: {loadError}</p>;

  const n = (s: string) => (s.trim() === "" ? null : Number(s));

  async function finish(skip: boolean) {
    setBusy(true);
    setErr(null);
    try {
      if (!skip) {
        for (const r of rows) {
          const amt = Number(r.amount);
          if (r.name.trim() && amt > 0) {
            await addItem(user!.uid, "holdings", {
              kind: "asset", name: r.name.trim(), category: r.category, currency, amount: amt,
              interest_rate: null, notes: null,
            });
          }
        }
        await saveUser({
          baseCurrency: currency,
          profile: { monthly_income: n(income), monthly_expense: n(expense), dependents: n(dependents) },
          onboarded: true,
        });
      } else {
        await saveUser({ onboarded: true });
      }
      router.replace("/dashboard");
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  const steps = ["Welcome", "About you", "Your assets", "Done"];

  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <span className="font-serif text-2xl font-semibold">NetWorth</span>
        <button className="text-sm text-black/50 underline" disabled={busy} onClick={() => finish(true)}>Skip setup</button>
      </div>
      <div className="mb-6 flex gap-1">
        {steps.map((s, i) => <div key={s} className={`h-1.5 flex-1 rounded ${i <= step ? "bg-brand" : "bg-black/10"}`} />)}
      </div>
      {err && <p className="mb-4 rounded-lg bg-loss/10 p-3 text-sm text-loss">{err}</p>}

      <div className="card space-y-4">
        {step === 0 && (
          <>
            <h1 className="font-serif text-2xl font-semibold">Welcome 👋</h1>
            <p className="text-sm text-black/60">Let&apos;s set up your money dashboard in a minute. Which currency do you want to see totals in?</p>
            <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <p className="text-xs text-black/50">You can change this any time, and each item keeps its own currency.</p>
          </>
        )}
        {step === 1 && (
          <>
            <h1 className="font-serif text-2xl font-semibold">About you</h1>
            <p className="text-sm text-black/60">Used for your financial health score. All optional, in ₹.</p>
            <div><label className="label">Monthly income</label><input className="input" type="number" min="0" value={income} onChange={(e) => setIncome(e.target.value)} /></div>
            <div><label className="label">Monthly expenses</label><input className="input" type="number" min="0" value={expense} onChange={(e) => setExpense(e.target.value)} /></div>
            <div><label className="label">People who depend on your income</label><input className="input" type="number" min="0" value={dependents} onChange={(e) => setDependents(e.target.value)} /></div>
          </>
        )}
        {step === 2 && (
          <>
            <h1 className="font-serif text-2xl font-semibold">Add a few assets</h1>
            <p className="text-sm text-black/60">Amounts are in {currency}. You can add more (and loans) later.</p>
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-5 gap-2">
                <input className="input col-span-2" placeholder="Name" value={r.name}
                  onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                <select className="input col-span-2" value={r.category}
                  onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, category: e.target.value } : x)))}>
                  {ASSET_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <input className="input" type="number" min="0" placeholder="Value" value={r.amount}
                  onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} />
              </div>
            ))}
            <button className="btn-ghost" onClick={() => setRows([...rows, { name: "", category: ASSET_CATEGORIES[0], amount: "" }])}>+ Another</button>
          </>
        )}
        {step === 3 && (
          <>
            <h1 className="font-serif text-2xl font-semibold">All set 🎉</h1>
            <p className="text-sm text-black/60">Next you&apos;ll see your dashboard, with a short checklist to help you get going.</p>
          </>
        )}

        <div className="flex justify-between pt-2">
          <button className="btn-ghost" disabled={step === 0 || busy} onClick={() => setStep(step - 1)}>Back</button>
          {step < 3 ? (
            <button className="btn" onClick={() => setStep(step + 1)}>Next</button>
          ) : (
            <button className="btn" disabled={busy} onClick={() => finish(false)}>{busy ? "Saving…" : "Go to dashboard"}</button>
          )}
        </div>
      </div>
    </div>
  );
}
