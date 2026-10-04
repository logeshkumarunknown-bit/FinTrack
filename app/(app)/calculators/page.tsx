"use client";

import { useState } from "react";
import { useCurrency } from "@/components/CurrencyProvider";
import { emi, inflate, lumpsumFV, sipFV } from "@/lib/finance";

type Tab = "sip" | "lumpsum" | "emi" | "inflation";

function Field({ label, value, onChange, step = "any" }: { label: string; value: string; onChange: (v: string) => void; step?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" type="number" min="0" step={step} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export default function CalculatorsPage() {
  const { fmt, base } = useCurrency();
  const [tab, setTab] = useState<Tab>("sip");
  const [v, setV] = useState({ amount: "10000", rate: "12", years: "10" });
  const set = (k: keyof typeof v) => (x: string) => setV({ ...v, [k]: x });
  const a = Number(v.amount), r = Number(v.rate), y = Number(v.years);
  const valid = a >= 0 && r >= 0 && y > 0 && [a, r, y].every(Number.isFinite);

  const tabs: [Tab, string][] = [["sip", "SIP"], ["lumpsum", "Lumpsum"], ["emi", "Loan EMI"], ["inflation", "Inflation"]];
  let rows: [string, string][] = [];
  if (valid) {
    if (tab === "sip") {
      const x = sipFV(a, r, y);
      rows = [["Total invested", fmt(x.invested)], ["Estimated returns", fmt(x.fv - x.invested)], ["Future value", fmt(x.fv)]];
    } else if (tab === "lumpsum") {
      const fv = lumpsumFV(a, r, y);
      rows = [["Invested", fmt(a)], ["Estimated returns", fmt(fv - a)], ["Future value", fmt(fv)]];
    } else if (tab === "emi") {
      const x = emi(a, r, y);
      rows = [["Monthly EMI", fmt(x.emi)], ["Total interest", fmt(x.interest)], ["Total payment", fmt(x.total)]];
    } else {
      const fv = inflate(a, r, y);
      rows = [["Today's amount", fmt(a)], [`Cost after ${y} years`, fmt(fv)], ["Purchasing power of today's amount then", fmt(a / (fv / a))]];
    }
  }

  const labels: Record<Tab, [string, string]> = {
    sip: ["Monthly investment", "Expected return % per year"],
    lumpsum: ["Amount invested", "Expected return % per year"],
    emi: ["Loan amount", "Interest rate % per year"],
    inflation: ["Amount today", "Inflation % per year"],
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Calculators</h1>
        <p className="text-sm text-black/60">Estimates only; results are shown in {base}. Real returns vary.</p>
      </div>
      <div className="flex gap-1">
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`rounded-lg px-3 py-1.5 text-sm ${tab === k ? "bg-brand-soft font-medium text-brand-dark" : "hover:bg-black/5"}`}>{l}</button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card space-y-4">
          <Field label={labels[tab][0]} value={v.amount} onChange={set("amount")} />
          <Field label={labels[tab][1]} value={v.rate} onChange={set("rate")} />
          <Field label="Years" value={v.years} onChange={set("years")} />
        </div>
        <div className="card">
          {!valid ? <p className="text-sm text-black/50">Enter valid numbers (years above zero).</p> : (
            <ul className="divide-y divide-black/5 text-sm">
              {rows.map(([k, val], i) => (
                <li key={k} className={`flex justify-between py-3 ${i === rows.length - 1 ? "text-lg font-semibold" : ""}`}><span>{k}</span><span>{val}</span></li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
