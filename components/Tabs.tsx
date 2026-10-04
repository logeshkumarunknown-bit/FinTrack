"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Tabs({ tabs }: { tabs: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-black/10">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${
            path === t.href ? "border-brand text-brand-dark" : "border-transparent text-black/60 hover:text-black"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

export const WealthTabs = () => (
  <Tabs tabs={[
    { href: "/assets", label: "Assets" },
    { href: "/liabilities", label: "Liabilities" },
    { href: "/snapshots", label: "Snapshots" },
    { href: "/allocation", label: "Allocation" },
  ]} />
);

export const MoneyTabs = () => (
  <Tabs tabs={[
    { href: "/transactions", label: "Transactions" },
    { href: "/accounts", label: "Accounts" },
    { href: "/budget", label: "Budget" },
    { href: "/insights", label: "Insights" },
    { href: "/money-settings", label: "Settings" },
  ]} />
);

export const EssentialsTabs = () => (
  <Tabs tabs={[
    { href: "/essentials", label: "Financial health" },
    { href: "/goals", label: "Goals" },
  ]} />
);
