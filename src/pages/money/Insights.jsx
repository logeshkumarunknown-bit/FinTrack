import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Briefcase } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Card, Pill } from '../../components/UI';
import { formatINR, monthLabel } from '../../lib/format';
import { sumByType } from '../../lib/calc';

const RANGES = ['This Month', 'Last Month', '3M', '6M', '12M', 'YTD', 'Custom'];

export default function Insights() {
  const { state } = useStore();
  const hidden = state.settings.hideBalances;
  const [range, setRange] = useState('This Month');

  const income = sumByType(state.transactions, 'income');
  const expense = sumByType(state.transactions, 'expense');
  const invested = state.assets.reduce((s, a) => s + (Number(a.qty) || 0) * (Number(a.avgCost) || 0), 0);

  const byCategory = useMemo(() => {
    const map = {};
    state.transactions.filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] || 0) + Number(t.amount || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [state.transactions]);

  return (
    <div>
      <div className="pt-6 pb-5">
        <h1 className="font-display text-[28px] text-[var(--color-ink)]">Money Insights</h1>
        <p className="text-[13.5px] text-[var(--color-ink-soft)] mt-1">{monthLabel()}</p>
      </div>

      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        {RANGES.map(r => <Pill key={r} active={range === r} onClick={() => setRange(r)}>{r}</Pill>)}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={TrendingUp} tone="forest" label="Total Income" value={income} />
        <StatCard icon={TrendingDown} tone="clay" label="Total Expenses" value={expense} />
        <StatCard icon={Briefcase} tone="slate" label="Total Invested" value={invested} />
      </div>

      <Card className="mt-4 p-6">
        {byCategory.length === 0 ? (
          <p className="text-[13.5px] text-[var(--color-ink-soft)] text-center py-8">No transactions yet — add income or expenses to see insights here.</p>
        ) : (
          <div>
            <div className="text-[15px] font-semibold text-[var(--color-ink)] mb-4">Spending by category</div>
            <div className="flex flex-col gap-3">
              {byCategory.map(([cat, val]) => {
                const pct = expense > 0 ? (val / expense) * 100 : 0;
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-[13px] mb-1">
                      <span className="text-[var(--color-ink)]">{cat}</span>
                      <span className="font-mono-num text-[var(--color-ink-soft)]">{formatINR(val, { hidden })}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
                      <div className="h-full bg-[var(--color-clay)] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, tone, label, value }) {
  const bg = tone === 'forest' ? 'bg-[var(--color-forest-soft)]' : tone === 'clay' ? 'bg-[var(--color-clay-soft)]' : 'bg-[var(--color-slate-soft)]';
  const color = tone === 'forest' ? 'text-[var(--color-forest)]' : tone === 'clay' ? 'text-[var(--color-clay)]' : 'text-[var(--color-slate)]';
  const { state } = useStore();
  return (
    <Card className="p-5 flex items-center gap-4">
      <span className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
        <Icon size={18} className={color} />
      </span>
      <div>
        <div className="text-[12px] text-[var(--color-ink-soft)]">{label}</div>
        <div className="font-mono-num text-[19px] text-[var(--color-ink)] mt-0.5">{formatINR(value, { hidden: state.settings.hideBalances })}</div>
        <div className="text-[11px] text-[var(--color-ink-faint)] mt-0.5">{formatINR(0)}/mo</div>
      </div>
    </Card>
  );
}
