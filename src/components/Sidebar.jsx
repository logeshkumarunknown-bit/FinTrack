import { NavLink } from 'react-router-dom';
import {
  LayoutGrid, TrendingUp, Wallet, Target, Upload, Calculator, Sparkles,
  Settings, Smartphone, MessageSquarePlus, ChevronRight,
} from 'lucide-react';

const nav = [
  { to: '/app/overview', label: 'Overview', icon: LayoutGrid },
  { to: '/app/wealth', label: 'Wealth', icon: TrendingUp },
  { to: '/app/money', label: 'Money', icon: Wallet },
  { to: '/app/essentials', label: 'Essentials', icon: Target },
];

const tools = [
  { to: '/app/import', label: 'Import', icon: Upload },
  { to: '/app/calculators', label: 'Calculators', icon: Calculator },
  { to: '/app/whats-new', label: "What's New", icon: Sparkles },
  { to: '/app/settings', label: 'Settings', icon: Settings },
  { to: '/app/install', label: 'Install App', icon: Smartphone },
  { to: '/app/feedback', label: 'Feedback', icon: MessageSquarePlus },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed md:sticky top-0 z-40 h-screen w-[220px] shrink-0 bg-[var(--color-cream-soft)] border-r border-[var(--color-line)] flex flex-col transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="px-6 pt-7 pb-6">
          <span className="font-display text-[22px] tracking-tight text-[var(--color-ink)]">FinBoom</span>
        </div>

        <nav className="px-3 flex flex-col gap-0.5">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] transition-colors ${
                  isActive
                    ? 'bg-[var(--color-forest-soft)] text-[var(--color-forest)] font-medium'
                    : 'text-[var(--color-ink-soft)] hover:bg-black/[0.03] hover:text-[var(--color-ink)]'
                }`
              }
            >
              <Icon size={17} strokeWidth={1.8} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-8 px-6">
          <div className="text-[10px] font-semibold tracking-[0.12em] text-[var(--color-ink-faint)]">TOOLS</div>
        </div>
        <nav className="px-3 mt-2 flex flex-col gap-0.5">
          {tools.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] transition-colors ${
                  isActive
                    ? 'text-[var(--color-forest)] font-medium'
                    : 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'
                }`
              }
            >
              <Icon size={16} strokeWidth={1.8} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto p-3">
          <div className="rounded-xl bg-[var(--color-forest-soft)] p-3.5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[13px] font-semibold text-[var(--color-forest)]">Upgrade to Pro</div>
                <div className="text-[12px] text-[var(--color-ink-soft)] mt-0.5 leading-snug">Unlock unlimited assets &amp; more</div>
              </div>
              <ChevronRight size={16} className="text-[var(--color-forest)] mt-0.5 shrink-0" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
