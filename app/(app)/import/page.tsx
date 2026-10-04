"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import { useData } from "@/components/DataProvider";
import { CURRENCIES } from "@/lib/currency";
import { downloadFile, parseCSV, toObjects } from "@/lib/csv";
import { addMany, updateItem } from "@/lib/db";
import { ASSET_CATEGORIES, LIABILITY_CATEGORIES } from "@/lib/types";

type Mode = "holdings" | "transactions";

const TEMPLATES: Record<Mode, string> = {
  holdings:
    "type,name,category,currency,amount,interest_rate,notes\n" +
    "asset,HDFC Savings,Cash & Savings,INR,150000,3.5,\n" +
    "liability,Home Loan - SBI,Home Loan,INR,2500000,8.5,\n",
  transactions:
    "date,type,amount,currency,category,account,note\n" +
    "2026-10-01,expense,450,INR,Food & Dining,HDFC Savings,Lunch\n" +
    "2026-10-01,income,85000,INR,Salary,HDFC Savings,October salary\n",
};

interface Parsed {
  rows: Record<string, unknown>[];
  errors: string[];
}

const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

export default function ImportPage() {
  const { user } = useAuth();
  const uid = user!.uid;
  const { holdings, accounts, reload } = useData();
  const { base } = useCurrency();
  const [mode, setMode] = useState<Mode>("holdings");
  const [update, setUpdate] = useState(false);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function parse(text: string) {
    const objs = toObjects(parseCSV(text));
    const rows: Record<string, unknown>[] = [];
    const errors: string[] = [];
    if (objs.length === 0) errors.push("No data rows found. The first row must be the column names.");
    objs.forEach((o, i) => {
      const line = i + 2;
      const amount = Number(o.amount?.replace(/,/g, ""));
      if (!(amount >= 0) || o.amount === "") return errors.push(`Row ${line}: amount "${o.amount}" is not a valid number.`);
      const cur = (o.currency || base).toUpperCase();
      if (!(CURRENCIES as readonly string[]).includes(cur)) return errors.push(`Row ${line}: currency "${cur}" is not supported.`);
      if (mode === "holdings") {
        const kind = (o.type || "").toLowerCase();
        if (kind !== "asset" && kind !== "liability") return errors.push(`Row ${line}: type must be "asset" or "liability".`);
        if (!o.name) return errors.push(`Row ${line}: name is missing.`);
        const cats = kind === "asset" ? ASSET_CATEGORIES : LIABILITY_CATEGORIES;
        const category = cats.find((c) => c.toLowerCase() === (o.category || "").toLowerCase()) ?? "Other";
        rows.push({
          kind, name: o.name, category, currency: cur, amount,
          interest_rate: o.interest_rate ? Number(o.interest_rate) : null, notes: o.notes || null,
        });
      } else {
        const type = (o.type || "").toLowerCase();
        if (type !== "expense" && type !== "income") return errors.push(`Row ${line}: type must be "expense" or "income".`);
        if (!isDate(o.date || "")) return errors.push(`Row ${line}: date must look like 2026-10-01.`);
        if (amount <= 0) return errors.push(`Row ${line}: amount must be above zero.`);
        const acc = accounts.find((a) => a.name.toLowerCase() === (o.account || "").toLowerCase());
        rows.push({
          type, date: o.date, amount, currency: acc ? acc.currency : cur,
          category: o.category || (type === "income" ? "Other Income" : "Other"),
          account_id: acc?.id ?? null, note: o.note || null,
        });
      }
    });
    setParsed({ rows, errors });
    setMsg(null);
  }

  async function onFile(f: File | undefined) {
    if (!f) return;
    parse(await f.text());
  }

  async function run() {
    if (!parsed || parsed.rows.length === 0) return;
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "holdings" && update) {
        const fresh: object[] = [];
        let updated = 0;
        for (const r of parsed.rows) {
          const hit = holdings.find((h) => h.kind === r.kind && h.name.toLowerCase() === String(r.name).toLowerCase());
          if (hit) { await updateItem(uid, "holdings", hit.id, r); updated++; } else fresh.push(r);
        }
        await addMany(uid, "holdings", fresh);
        setMsg(`Updated ${updated} and added ${fresh.length}.`);
      } else {
        await addMany(uid, mode === "holdings" ? "holdings" : "transactions", parsed.rows);
        setMsg(`Imported ${parsed.rows.length} row(s).`);
      }
      setParsed(null);
      await reload();
    } catch (e) {
      setMsg((e as Error).message);
    }
    setBusy(false);
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Import</h1>
        <p className="text-sm text-black/60">Bring in data from a CSV file (export from Excel or Google Sheets as CSV).</p>
      </div>
      <div className="flex gap-1">
        {([["holdings", "Assets & liabilities"], ["transactions", "Transactions"]] as [Mode, string][]).map(([k, l]) => (
          <button key={k} onClick={() => { setMode(k); setParsed(null); setMsg(null); }}
            className={`rounded-lg px-3 py-1.5 text-sm ${mode === k ? "bg-brand-soft font-medium text-brand-dark" : "hover:bg-black/5"}`}>{l}</button>
        ))}
      </div>

      <div className="card space-y-3">
        <p className="text-sm">
          Required columns: <code className="text-xs">{TEMPLATES[mode].split("\n")[0]}</code>
        </p>
        {mode === "transactions" && <p className="text-xs text-black/50">The account column must match an existing account name, otherwise the transaction is imported without an account.</p>}
        <button className="btn-ghost" onClick={() => downloadFile(`${mode}-template.csv`, TEMPLATES[mode])}>Download template</button>
        <input type="file" accept=".csv,text/csv" className="block text-sm" onChange={(e) => onFile(e.target.files?.[0])} />
        {mode === "holdings" && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={update} onChange={(e) => setUpdate(e.target.checked)} />
            Update existing items with the same name instead of adding duplicates
          </label>
        )}
      </div>

      {msg && <p className="rounded-lg bg-brand-soft p-3 text-sm text-brand-dark">{msg}</p>}

      {parsed && (
        <div className="card space-y-3">
          <p className="text-sm font-medium">{parsed.rows.length} valid row(s), {parsed.errors.length} problem(s)</p>
          {parsed.errors.length > 0 && (
            <ul className="max-h-40 overflow-auto rounded-lg bg-loss/10 p-3 text-xs text-loss">
              {parsed.errors.slice(0, 50).map((e) => <li key={e}>{e}</li>)}
            </ul>
          )}
          {parsed.rows.length > 0 && (
            <div className="max-h-60 overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-black/50">
                  <tr>{Object.keys(parsed.rows[0]).map((k) => <th key={k} className="px-2 py-1">{k}</th>)}</tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 20).map((r, i) => (
                    <tr key={i} className="border-t border-black/5">
                      {Object.keys(parsed.rows[0]).map((k) => <td key={k} className="px-2 py-1">{String(r[k] ?? "")}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-xs text-black/50">Rows with problems are skipped. Showing up to 20 rows.</p>
          <button className="btn" disabled={busy || parsed.rows.length === 0} onClick={run}>
            {busy ? "Importing…" : `Import ${parsed.rows.length} row(s)`}
          </button>
        </div>
      )}
    </div>
  );
}
