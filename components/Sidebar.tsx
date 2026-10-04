"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut as fbSignOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { CURRENCIES } from "@/lib/currency";
import { useCurrency } from "./CurrencyProvider";

const groups: { title?: string; links: { href: string; label: string; match: string[] }[] }[] = [
  { links: [{ href: "/dashboard", label: "Overview", match: ["/dashboard"] }] },
  { links: [
    { href: "/assets", label: "Wealth", match: ["/assets", "/liabilities", "/snapshots", "/allocation"] },
    { href: "/transactions", label: "Money", match: ["/transactions", "/accounts", "/budget", "/insights", "/money-settings"] },
    { href: "/essentials", label: "Essentials", match: ["/essentials", "/goals"] },
  ] },
  { title: "Tools", links: [
    { href: "/import", label: "Import", match: ["/import"] },
    { href: "/calculators", label: "Calculators", match: ["/calculators"] },
    { href: "/settings", label: "Settings", match: ["/settings"] },
  ] },
];

const addItems = [
  { label: "Asset", href: "/assets?new=1" },
  { label: "Liability", href: "/liabilities?new=1" },
  { label: "Expense", href: "/transactions?new=expense" },
  { label: "Income", href: "/transactions?new=income" },
  { label: "Account", href: "/accounts?new=1" },
];

export default function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  const { base, setBase, hide, setHide, ratesError, updated } = useCurrency();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await fbSignOut(getFirebaseAuth());
    router.push("/login");
  }

  return (
    <aside className="flex w-full flex-col gap-5 border-b border-black/10 bg-white p-4 md:min-h-screen md:w-60 md:border-b-0 md:border-r">
      <div className="font-serif text-2xl font-semibold">NetWorth</div>

      <div className="relative">
        <button className="btn w-full" onClick={() => setOpen(!open)}>+ Add</button>
        {open && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-black/10 bg-white py-1 shadow-lg">
            {addItems.map((a) => (
              <Link key={a.label} href={a.href} onClick={() => setOpen(false)}
                className="block px-3 py-2 text-sm hover:bg-black/5">{a.label}</Link>
            ))}
          </div>
        )}
      </div>

      <nav className="flex flex-wrap gap-x-2 gap-y-1 md:flex-col md:gap-0">
        {groups.map((g, gi) => (
          <div key={gi} className="flex gap-1 md:mb-3 md:flex-col">
            {g.title && <p className="hidden px-3 pb-1 text-xs font-medium uppercase text-black/40 md:block">{g.title}</p>}
            {g.links.map((l) => (
              <Link key={l.href} href={l.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  l.match.some((m) => path.startsWith(m)) ? "bg-brand-soft text-brand-dark" : "hover:bg-black/5"
                }`}>
                {l.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="mt-auto space-y-3">
        <div>
          <label className="label" htmlFor="base">Display currency</label>
          <select id="base" className="input" value={base} onChange={(e) => setBase(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-black/50">
            {ratesError ? "Exchange rates unavailable" : updated ? `Rates: ${updated.slice(0, 16)}` : "Loading rates…"}
          </p>
        </div>
        <button className="btn-ghost w-full" onClick={() => setHide(!hide)}>
          {hide ? "Show amounts" : "Hide amounts"}
        </button>
        <button className="btn-ghost w-full" onClick={signOut}>Sign out</button>
      </div>
    </aside>
  );
}
