"use client";

import { useAuth } from "@/components/AuthProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import { useData } from "@/components/DataProvider";
import { useUser } from "@/components/UserProvider";
import { CURRENCIES } from "@/lib/currency";
import { downloadFile } from "@/lib/csv";

export default function SettingsPage() {
  const { user } = useAuth();
  const { base, setBase, hide, setHide } = useCurrency();
  const all = useData();
  const { data } = useUser();

  function exportJson() {
    const { holdings, accounts, txns, goals, recurring, snapshots, rules } = all;
    downloadFile(
      `networth-backup-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify({ settings: data, holdings, accounts, transactions: txns, goals, recurring, snapshots, rules }, null, 2),
      "application/json"
    );
  }

  return (
    <div className="max-w-xl space-y-5">
      <h1 className="font-serif text-3xl font-semibold">Settings</h1>
      <div className="card space-y-4">
        <div>
          <p className="label">Signed in as</p>
          <p className="text-sm">{user?.email}</p>
        </div>
        <div>
          <label className="label" htmlFor="cur">Display currency</label>
          <select id="cur" className="input" value={base} onChange={(e) => setBase(e.target.value)}>
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={hide} onChange={(e) => setHide(e.target.checked)} /> Hide amounts on this device
        </label>
      </div>
      <div className="card space-y-3">
        <h2 className="font-medium">Back up your data</h2>
        <p className="text-sm text-black/60">Download everything you&apos;ve entered as a single file.</p>
        <button className="btn" onClick={exportJson}>Download backup (JSON)</button>
      </div>
    </div>
  );
}
