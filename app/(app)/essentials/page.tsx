"use client";

import { useState } from "react";
import { useCurrency } from "@/components/CurrencyProvider";
import { useData } from "@/components/DataProvider";
import { useNetWorth } from "@/components/useNetWorth";
import { useUser } from "@/components/UserProvider";
import { EssentialsTabs } from "@/components/Tabs";
import { healthScore } from "@/lib/finance";
import type { Profile } from "@/lib/types";

const num = (s: string) => (s.trim() === "" ? null : Number(s));
const str = (n: number | null | undefined) => (n == null ? "" : String(n));

export default function EssentialsPage() {
  const { data, saveUser } = useUser();
  const { holdings } = useData();
  const { base, conv } = useCurrency();
  const { net, accountsTotal } = useNetWorth();
  const p = data.profile ?? {};
  const [f, setF] = useState({
    age: str(p.age), dependents: str(p.dependents), monthly_income: str(p.monthly_income),
    monthly_expense: str(p.monthly_expense), term_cover: str(p.term_cover), health_cover: str(p.health_cover),
  });
  const [msg, setMsg] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const profile: Profile = {
      age: num(f.age), dependents: num(f.dependents), monthly_income: num(f.monthly_income),
      monthly_expense: num(f.monthly_expense), term_cover: num(f.term_cover), health_cover: num(f.health_cover),
    };
    try {
      await saveUser({ profile });
      setMsg("Saved.");
    } catch (e2) {
      setMsg((e2 as Error).message);
    }
  }

  // The profile is in INR, so convert wealth into INR for the score.
  const cashHoldings = holdings
    .filter((h) => h.kind === "asset" && h.category === "Cash & Savings")
    .reduce((s, h) => s + conv(Number(h.amount), h.currency, "INR"), 0);
  const netInr = conv(net, base, "INR");
  const liquidInr = cashHoldings + conv(accountsTotal, base, "INR");
  const ready = Number.isFinite(netInr) && Number.isFinite(liquidInr);
  const result = ready ? healthScore({ profile: p, netWorth: netInr, liquid: liquidInr }) : null;

  const tone = (s: number | null) => (s == null ? "bg-black/10" : s >= 7 ? "bg-brand" : s >= 4 ? "bg-[#c08a2e]" : "bg-loss");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Essentials</h1>
        <p className="text-sm text-black/60">A simple health check of your money. Amounts here are in ₹.</p>
      </div>
      <EssentialsTabs />

      <div className="card">
        <p className="text-xs uppercase text-black/50">Financial health score</p>
        {result == null ? (
          <p className="mt-1 text-sm text-black/60">Waiting for exchange rates…</p>
        ) : result.overall == null ? (
          <p className="mt-1 text-sm text-black/60">Fill in your profile below to see your score.</p>
        ) : (
          <p className="mt-1 text-4xl font-semibold">{result.overall.toFixed(1)}<span className="text-lg text-black/40"> / 10</span></p>
        )}
        {result && (
          <ul className="mt-4 space-y-3">
            {result.parts.map((x) => (
              <li key={x.key}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{x.label}</span>
                  <span>{x.score == null ? "—" : `${x.score.toFixed(1)} / 10`}</span>
                </div>
                <div className="mt-1 h-1.5 rounded bg-black/10">
                  <div className={`h-1.5 rounded ${tone(x.score)}`} style={{ width: `${(x.score ?? 0) * 10}%` }} />
                </div>
                <p className="mt-1 text-xs text-black/50">{x.detail}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-black/40">
          These are simple rules of thumb (6 months emergency fund, 30% savings rate, 25× annual expenses, basic cover levels), not financial advice.
        </p>
      </div>

      <form onSubmit={save} className="card grid gap-4 sm:grid-cols-2">
        <h2 className="font-medium sm:col-span-2">Financial profile</h2>
        {([
          ["age", "Age"], ["dependents", "Dependents"], ["monthly_income", "Monthly income (₹)"],
          ["monthly_expense", "Monthly expenses (₹)"], ["term_cover", "Term life cover (₹)"], ["health_cover", "Health cover (₹)"],
        ] as const).map(([k, label]) => (
          <div key={k}>
            <label className="label">{label}</label>
            <input className="input" type="number" min="0" step="any" value={f[k]}
              onChange={(e) => setF({ ...f, [k]: e.target.value })} />
          </div>
        ))}
        <div className="flex items-center gap-3 sm:col-span-2">
          <button className="btn">Save profile</button>
          {msg && <span className="text-sm text-brand-dark">{msg}</span>}
        </div>
      </form>
    </div>
  );
}
