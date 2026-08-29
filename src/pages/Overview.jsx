import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Plus, Scale, ArrowLeftRight, TrendingUp, Target } from 'lucide-react';
import { useStore } from '../lib/store';
import { Card, Pill, Badge } from '../components/UI';
import { formatINR, formatPercent } from '../lib/format';
import { totalAssets, totalLiabilities, netWorth, allocationByType, txForMonth, sumByType } from '../lib/calc';

export default function Overview() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const hidden = state.settings.hideBalances;
  const [range, setRange] = useState('30D');
  const [expanded, setExpanded] = useState('wealth');

  const assetsTotal = totalAssets(state.assets);
  const liabTotal = totalLiabilities(state.liabilities);
  const nw = netWorth(state.assets, state.liabilities);
  const { map } = allocationByType(state.assets);

  const monthTx = useMemo(() => txForMonth(state.transactions), [state.transactions]);
  const income = sumByType(monthTx, 'income');
  const expense = sumByType(monthTx, 'expense');
  const cashflow = income - expense;

  const hasSnapshots = state.netWorthSnapshots.length > 0;
  const hasTx = state.transactions.length > 0;

  function toggle(key) {
    setExpanded(e => e === key ? null : key);
  }

  return (
    <div>
      <div className="flex justify-end pt-6 pb-4">
        <button
          onClick={() => navigate('/app/wealth?add=1')}
          className="inline-flex items-center gap-1.5 bg-[var(--color-paper)] border border-[var(--color-line)] rounded-lg px-3.5 py-2 text-[13.5px] font-medium hover:bg-black/[0.02]"
        >
          <Plus size={15} /> Add
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-[0.1em] text-[var(--color-ink-faint)]">NET WORTH · ₹ INR</span>
            <span className="text-[11px] font-semibold text-[var(--color-gold)] bg-[var(--color-gold-soft)] px-2 py-0.5 rounded-full">Pro</span>
          </div>
          <div className="font-display text-[38px] mt-3 text-[var(--color-ink)]">{formatINR(nw, { compact: true, hidden })}</div>
          <div className="mt-6">
            {hasSnapshots ? (
              <span className="text-[13px] text-[var(--color-ink-soft)]">Tracked over {state.netWorthSnapshots.length} snapshot{state.netWorthSnapshots.length > 1 ? 's' : ''}</span>
            ) : (
              <button onClick={() => navigate('/app/wealth?tab=networth')} className="text-[13px] text-[var(--color-forest)] font-medium hover:underline">
                Take your first snapshot →
              </button>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-[0.1em] text-[var(--color-ink-faint)]">CASHFLOW</span>
            <div className="flex items-center gap-1">
              {['7D', '30D', '90D'].map(r => (
                <Pill key={r} active={range === r} onClick={() => setRange(r)}>{r}</Pill>
              ))}
            </div>
          </div>
          {hasTx ? (
            <div className="mt-3">
              <div className="font-display text-[38px] text-[var(--color-ink)]">{formatINR(cashflow, { compact: true, hidden })}</div>
              <div className="flex gap-4 mt-2 text-[13px]">
                <span className="text-[var(--color-forest)]">+{formatINR(income, { compact: true, hidden })} in</span>
                <span className="text-[var(--color-clay)]">-{formatINR(expense, { compact: true, hidden })} out</span>
              </div>
            </div>
          ) : (
            <div className="mt-10 text-center">
              <p className="text-[13.5px] text-[var(--color-ink-soft)]">No income or spending logged in this window.</p>
              <p className="mt-2 text-[13px]">
                <button onClick={() => navigate('/app/money?add=income')} className="text-[var(--color-forest)] font-medium hover:underline">Add income →</button>
                <span className="mx-2 text-[var(--color-ink-faint)]">·</span>
                <button onClick={() => navigate('/app/money?add=expense')} className="text-[var(--color-forest)] font-medium hover:underline">Add expense →</button>
              </p>
            </div>
          )}
        </Card>
      </div>

      <div className="flex flex-col gap-3 mt-4">
        <Row
          icon={Scale} label="Wealth" value={formatINR(assetsTotal - liabTotal, { compact: true, hidden })}
          open={expanded === 'wealth'} onClick={() => toggle('wealth')}
        >
          {Object.keys(map).length === 0 ? (
            <EmptyRow text="No assets added yet." cta="Add an asset" onClick={() => navigate('/app/wealth')} />
          ) : (
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 pt-1">
              {Object.entries(map).map(([type, val]) => (
                <div key={type} className="flex items-center justify-between text-[13.5px] py-1">
                  <span className="text-[var(--color-ink-soft)]">{type}</span>
                  <span className="font-mono-num text-[var(--color-ink)]">{formatINR(val, { compact: true, hidden })}</span>
                </div>
              ))}
              {liabTotal > 0 && (
                <div className="flex items-center justify-between text-[13.5px] py-1">
                  <span className="text-[var(--color-clay)]">Liabilities</span>
                  <span className="font-mono-num text-[var(--color-clay)]">-{formatINR(liabTotal, { compact: true, hidden })}</span>
                </div>
              )}
            </div>
          )}
        </Row>

        <Row
          icon={ArrowLeftRight} label="Cashflow" value={formatINR(0, { compact: true, hidden })} tag="YTD"
          open={expanded === 'cashflow'} onClick={() => toggle('cashflow')}
        >
          {hasTx ? (
            <div className="pt-1 text-[13.5px] text-[var(--color-ink-soft)]">
              {monthTx.length} transaction{monthTx.length !== 1 ? 's' : ''} logged this month.
            </div>
          ) : (
            <EmptyRow text="No expenses recorded yet." cta="Add a transaction" onClick={() => navigate('/app/money')} />
          )}
        </Row>

        <Row
          icon={TrendingUp} label="Investments" value={`+${formatINR(0, { compact: true, hidden })}`} tag="0.0%"
          open={expanded === 'investments'} onClick={() => toggle('investments')}
        >
          {state.assets.length === 0 ? (
            <EmptyRow text="No investments tracked yet." cta="Add an asset" onClick={() => navigate('/app/wealth')} />
          ) : (
            <div className="pt-1 text-[13.5px] text-[var(--color-ink-soft)]">
              {state.assets.length} holding{state.assets.length !== 1 ? 's' : ''} worth {formatINR(assetsTotal, { compact: true, hidden })} invested. No price changes logged since purchase.
            </div>
          )}
        </Row>

        <Row
          icon={Target} label="Goals" badge={state.goals.length}
          open={expanded === 'goals'} onClick={() => toggle('goals')}
        >
          {state.goals.length === 0 ? (
            <EmptyRow text="No goals set yet." cta="Create a goal" onClick={() => navigate('/app/essentials?tab=goals')} />
          ) : (
            <div className="pt-1 flex flex-col gap-2">
              {state.goals.map(g => (
                <div key={g.id} className="flex items-center justify-between text-[13.5px]">
                  <span className="text-[var(--color-ink)]">{g.name}</span>
                  <span className="font-mono-num text-[var(--color-ink-soft)]">{formatINR(g.targetAmount, { compact: true, hidden })}</span>
                </div>
              ))}
            </div>
          )}
        </Row>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value, tag, badge, open, onClick, children }) {
  return (
    <Card className="overflow-hidden">
      <button onClick={onClick} className="w-full flex items-center justify-between px-6 py-4 text-left">
        <span className="flex items-center gap-2.5">
          <ChevronDown size={15} className={`text-[var(--color-ink-faint)] transition-transform ${open ? 'rotate-0' : '-rotate-90'}`} />
          <Icon size={16} className="text-[var(--color-ink-soft)]" />
          <span className="text-[14.5px] font-medium text-[var(--color-ink)]">{label}</span>
          {typeof badge === 'number' && (
            <span className="text-[11px] bg-black/[0.05] text-[var(--color-ink-soft)] rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{badge}</span>
          )}
        </span>
        <span className="flex items-center gap-2">
          {value && <span className="font-mono-num text-[14.5px] text-[var(--color-ink)]">{value}</span>}
          {tag && <Badge tone="neutral">{tag}</Badge>}
        </span>
      </button>
      {open && <div className="px-6 pb-5 border-t border-[var(--color-line)] pt-3">{children}</div>}
    </Card>
  );
}

function EmptyRow({ text, cta, onClick }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[13.5px] text-[var(--color-ink-soft)]">{text}</span>
      <button onClick={onClick} className="text-[13px] text-[var(--color-forest)] font-medium hover:underline">{cta} →</button>
    </div>
  );
}
