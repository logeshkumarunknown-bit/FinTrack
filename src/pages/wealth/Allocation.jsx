import { useState } from 'react';
import { AlertTriangle, Lightbulb, Pencil } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Card, Button, Tabs, Modal, Field, inputClass } from '../../components/UI';
import { formatINR } from '../../lib/format';
import { allocationByType, totalAssets } from '../../lib/calc';
import { ASSET_TYPES } from '../../lib/initialState';

const COLORS = {
  Equity: 'var(--color-slate)',
  Debt: 'var(--color-forest)',
  'Real Estate': 'var(--color-clay)',
  Commodities: 'var(--color-gold)',
  'Cash & Savings': 'var(--color-ink)',
  Crypto: '#8B5CF6',
  Alternatives: '#0EA5E9',
  Other: 'var(--color-ink-faint)',
};

export default function Allocation() {
  const { state, dispatch } = useStore();
  const hidden = state.settings.hideBalances;
  const [subTab, setSubTab] = useState('asset');
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(state.targetAllocation);

  const { map, total } = allocationByType(state.assets);
  const target = state.targetAllocation;

  const gaps = Object.entries(target).map(([type, pct]) => {
    const actualVal = map[type] || 0;
    const actualPct = total > 0 ? (actualVal / total) * 100 : 0;
    const targetVal = (pct / 100) * total;
    const gap = actualPct - pct;
    return { type, actualPct, actualVal, targetPct: pct, targetVal, gap };
  });

  const offCategories = gaps.filter(g => Math.abs(g.gap) > 5).length;
  const heavyType = Object.entries(map).sort((a, b) => b[1] - a[1])[0];
  const heavyPct = heavyType && total > 0 ? (heavyType[1] / total) * 100 : 0;
  const missing = Object.keys(target).filter(t => !map[t]);
  const biggestGap = [...gaps].sort((a, b) => a.gap - b.gap)[0];

  function saveTarget(e) {
    e.preventDefault();
    const sum = Object.values(form).reduce((s, v) => s + Number(v || 0), 0);
    if (sum !== 100) { alert('Target allocation must add up to 100%'); return; }
    dispatch({ type: 'SET_TARGET_ALLOCATION', payload: Object.fromEntries(Object.entries(form).map(([k, v]) => [k, Number(v)])) });
    setEditOpen(false);
  }

  return (
    <div>
      <div className="pt-6 pb-5">
        <h1 className="font-display text-[28px] text-[var(--color-ink)]">Allocation</h1>
        <p className="text-[13.5px] text-[var(--color-ink-soft)] mt-1">Asset allocation &amp; rebalancing</p>
      </div>

      <Tabs
        tabs={[{ value: 'asset', label: 'Asset Allocation' }, { value: 'geo', label: 'Geography' }, { value: 'sip', label: 'Monthly SIP Plan' }]}
        active={subTab} onChange={setSubTab}
      />

      {subTab !== 'asset' ? (
        <Card className="mt-5 p-10 text-center text-[13.5px] text-[var(--color-ink-soft)]">
          {subTab === 'geo' ? 'Tag assets by country to see a geography breakdown here.' : 'Set a monthly SIP amount per category once you have a target allocation.'}
        </Card>
      ) : (
        <>
          <Card className="mt-5 p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-semibold text-[var(--color-ink)]">Target Allocation <span className="ml-1 text-[11px] font-medium text-[var(--color-ink-faint)] bg-black/[0.04] px-1.5 py-0.5 rounded">Default</span></span>
              <button onClick={() => { setForm(target); setEditOpen(true); }} className="text-[13px] text-[var(--color-forest)] font-medium flex items-center gap-1"><Pencil size={13} /> Edit</button>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden flex w-full">
              {Object.entries(target).map(([type, pct]) => (
                <div key={type} style={{ width: `${pct}%`, background: COLORS[type] }} />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
              {Object.entries(target).map(([type, pct]) => (
                <span key={type} className="flex items-center gap-1.5 text-[12.5px] text-[var(--color-ink-soft)]">
                  <span className="w-2 h-2 rounded-full" style={{ background: COLORS[type] }} /> {type} {pct}%
                </span>
              ))}
            </div>
          </Card>

          <div className="grid lg:grid-cols-3 gap-4 mt-4">
            <Card className="lg:col-span-2 p-6">
              <div className="text-[15px] font-semibold text-[var(--color-ink)] mb-4">Current Allocation</div>
              {offCategories > 0 && (
                <div className="flex items-center gap-2 bg-black/[0.03] rounded-lg px-3.5 py-2.5 text-[13px] text-[var(--color-ink)] mb-5">
                  <AlertTriangle size={15} className="text-[var(--color-clay)]" />
                  Needs rebalancing. {offCategories} categor{offCategories !== 1 ? 'ies' : 'y'} {offCategories !== 1 ? 'are' : 'is'} off by over 5%.
                </div>
              )}

              {total === 0 ? (
                <p className="text-[13.5px] text-[var(--color-ink-soft)]">Add assets to see your current allocation.</p>
              ) : (
                <div className="flex items-center gap-8 flex-wrap">
                  <Donut map={map} total={total} />
                  <div className="flex flex-col gap-2">
                    {Object.entries(map).map(([type, val]) => (
                      <span key={type} className="flex items-center gap-2 text-[13.5px]">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[type] }} />
                        {type} <span className="text-[var(--color-ink-soft)]">{((val / total) * 100).toFixed(0)}%</span>
                        <span className="text-[var(--color-ink-faint)]">{formatINR(val, { compact: true, hidden })}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-7 pt-5 border-t border-[var(--color-line)]">
                <div className="text-[13px] font-semibold text-[var(--color-ink)] mb-3">Target vs Actual</div>
                <div className="grid grid-cols-6 gap-2 text-[10.5px] font-semibold text-[var(--color-ink-faint)] pb-2 tracking-wide">
                  <span>CATEGORY</span><span className="text-right">ACTUAL</span><span className="text-right">CUR VAL</span><span className="text-right">TARGET</span><span className="text-right">GAP</span><span className="text-right">ACTION</span>
                </div>
                {gaps.map(g => (
                  <div key={g.type} className="grid grid-cols-6 gap-2 items-center py-2.5 border-t border-[var(--color-line)] text-[13px]">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: COLORS[g.type] }} />{g.type}</span>
                    <span className="text-right font-mono-num">{g.actualPct.toFixed(0)}%</span>
                    <span className="text-right font-mono-num text-[var(--color-ink-soft)]">{formatINR(g.actualVal, { compact: true, hidden })}</span>
                    <span className="text-right font-mono-num text-[var(--color-ink-soft)]">{g.targetPct}%</span>
                    <span className={`text-right font-mono-num ${g.gap > 5 ? 'text-[var(--color-clay)]' : g.gap < -5 ? 'text-[var(--color-clay)]' : 'text-[var(--color-forest)]'}`}>{g.gap >= 0 ? '+' : ''}{g.gap.toFixed(0)}%</span>
                    <span className="text-right text-[12px] font-medium">
                      {g.gap > 5 ? <span className="text-[var(--color-clay)]">Reduce {formatINR(Math.abs(g.actualVal - g.targetVal), { compact: true, hidden })}</span>
                        : g.gap < -5 ? <span className="text-[var(--color-forest)]">Add {formatINR(Math.abs(g.actualVal - g.targetVal), { compact: true, hidden })}</span>
                        : <span className="text-[var(--color-ink-faint)]">On target</span>}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 h-fit">
              <div className="text-[15px] font-semibold text-[var(--color-ink)] mb-4">Insights</div>
              <div className="flex flex-col gap-3">
                {heavyType && heavyPct >= 60 && (
                  <Insight icon={AlertTriangle} tone="clay" title={`Heavy ${heavyType[0]} tilt`} text={`${heavyPct.toFixed(0)}% in one category. High concentration increases risk during downturns.`} />
                )}
                {missing.length > 0 && (
                  <Insight icon={AlertTriangle} tone="clay" title={`No ${missing.join(' & ')}`} text="You've set targets but have nothing allocated here yet." />
                )}
                <Insight icon={Lightbulb} tone="forest" title="Next investment" text="Route your next SIP or lump-sum to your most under-allocated category for the biggest impact on balance." />
              </div>
            </Card>
          </div>
        </>
      )}

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Target Allocation">
        <form onSubmit={saveTarget} className="flex flex-col gap-3.5">
          {ASSET_TYPES.filter(t => ['Equity', 'Debt', 'Real Estate', 'Commodities', 'Cash & Savings'].includes(t)).map(type => (
            <Field key={type} label={type}>
              <input
                className={inputClass} inputMode="numeric"
                value={form[type] ?? ''}
                onChange={e => setForm(f => ({ ...f, [type]: e.target.value }))}
              />
            </Field>
          ))}
          <p className="text-[11.5px] text-[var(--color-ink-faint)]">Must add up to 100%.</p>
          <div className="flex items-center justify-end gap-2.5 mt-1">
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit">Save Target</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Donut({ map, total }) {
  const entries = Object.entries(map);
  let acc = 0;
  const r = 52, cx = 60, cy = 60, sw = 16;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0">
      <svg width="120" height="120" viewBox="0 0 120 120">
        {entries.map(([type, val]) => {
          const frac = val / total;
          const dash = frac * circumference;
          const offset = circumference * (1 - acc);
          acc += frac;
          return (
            <circle
              key={type} cx={cx} cy={cy} r={r} fill="none" stroke={COLORS[type]} strokeWidth={sw}
              strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[11px] text-[var(--color-ink-faint)]">Total</span>
      </div>
    </div>
  );
}

function Insight({ icon: Icon, tone, title, text }) {
  const bg = tone === 'clay' ? 'bg-[var(--color-clay-soft)]' : 'bg-[var(--color-forest-soft)]';
  const color = tone === 'clay' ? 'text-[var(--color-clay)]' : 'text-[var(--color-forest)]';
  return (
    <div className={`rounded-lg px-3.5 py-3 ${bg}`}>
      <div className={`flex items-center gap-2 text-[13px] font-medium ${color}`}><Icon size={14} /> {title}</div>
      <p className="text-[12.5px] text-[var(--color-ink-soft)] mt-1 leading-snug">{text}</p>
    </div>
  );
}
