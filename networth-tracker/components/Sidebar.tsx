"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut as fbSignOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { CURRENCIES } from "@/lib/currency";
import { useCurrency } from "./CurrencyProvider";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/assets", label: "Assets" },
  { href: "/liabilities", label: "Liabilities" },
];

export default function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  const { base, setBase, hide, setHide, ratesError, updated } = useCurrency();

  async function signOut() {
    await fbSignOut(getFirebaseAuth());
    router.push("/login");
  }

  return (
    <aside className="flex w-full flex-col gap-6 border-b border-black/10 bg-white p-4 md:min-h-screen md:w-60 md:border-b-0 md:border-r">
      <div className="font-serif text-2xl font-semibold">NetWorth</div>

      <nav className="flex gap-2 md:flex-col">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              path.startsWith(l.href) ? "bg-brand-soft text-brand-dark" : "hover:bg-black/5"
            }`}
          >
            {l.label}
          </Link>
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
