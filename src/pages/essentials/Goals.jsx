import { useState } from 'react';
import { Download, Plus, Target, Trash2 } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Card, EmptyState, Button, Field, inputClass, ProgressBar } from '../../components/UI';
import { formatINR, formatDate } from '../../lib/format';
import { netWorth } from '../../lib/calc';

const empty = { name: '', targetAmount: '', currency: 'INR', targetDate: '', trackBy: 'Net Worth (all assets)', notes: '' };

export default function Goals() {
  const { state, dispatch } = useStore();
  const hidden = state.settings.hideBalances;
  const [form, setForm] = useState(empty);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function submit(e) {
    e.preventDefault();
    if (!form.name || !form.targetAmount || !form.targetDate) return;
    dispatch({ type: 'ADD_GOAL', payload: { ...form, targetAmount: Number(form.targetAmount) } });
    setForm(empty);
  }

  const nw = netWorth(state.assets, state.liabilities);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 pt-6 pb-5 flex-wrap">
        <div>
          <h1 className="font-display text-[28px] text-[var(--color-ink)]">Goals</h1>
          <p className="text-[13.5px] text-[var(--color-ink-soft)] mt-1">{state.goals.length} active goal{state.goals.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary"><Download size={14} /> Export</Button>
        </div>
      </div>

      {state.goals.length === 0 ? (
        <Card className="mb-6">
          <EmptyState
            icon={Target}
            title="No goals yet"
            description="Set financial goals to track your progress toward milestones like retirement, home purchase, or emergency funds."
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {state.goals.map(g => {
            const progress = g.trackBy.startsWith('Net Worth') ? nw : 0;
            const pct = g.targetAmount > 0 ? Math.min(100, (progress / g.targetAmount) * 100) : 0;
            return (
              <Card key={g.id} className="p-5 group">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-[15px] text-[var(--color-ink)]">{g.name}</div>
                    <div className="text-[12px] text-[var(--color-ink-soft)] mt-0.5">Target {formatDate(g.targetDate)} · {g.trackBy}</div>
                  </div>
                  <button onClick={() => dispatch({ type: 'DELETE_GOAL', id: g.id })} className="opacity-0 group-hover:opacity-100 p-1 text-[var(--color-ink-soft)] hover:text-[var(--color-clay)] transition-opacity"><Trash2 size={14} /></button>
                </div>
                <div className="flex items-baseline justify-between mt-4">
                  <span className="font-mono-num text-[18px] text-[var(--color-ink)]">{formatINR(progress, { compact: true, hidden })}</span>
                  <span className="text-[12.5px] text-[var(--color-ink-soft)]">of {formatINR(g.targetAmount, { compact: true, hidden })}</span>
                </div>
                <div className="mt-2"><ProgressBar value={pct} /></div>
                {g.notes && <p className="text-[12.5px] text-[var(--color-ink-soft)] mt-3">{g.notes}</p>}
              </Card>
            );
          })}
        </div>
      )}

      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <span className="text-[15px] font-semibold text-[var(--color-ink)]">Create New Goal</span>
        </div>
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
          <Field label="Goal Name" required>
            <input className={inputClass} placeholder="Goal name" value={form.name} onChange={e => set('name', e.target.value)} />
          </Field>
          <Field label="Template">
            <select
              className={inputClass}
              onChange={e => {
                const v = e.target.value;
                if (v) set('name', v);
              }}
              defaultValue=""
            >
              <option value="">Select a template...</option>
              <option>Emergency Fund</option>
              <option>Retirement</option>
              <option>Home Purchase</option>
              <option>Child's Education</option>
              <option>Dream Vacation</option>
            </select>
          </Field>
          <Field label="Target Amount" required>
            <input className={inputClass} placeholder="Target amount" inputMode="decimal" value={form.targetAmount} onChange={e => set('targetAmount', e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Currency">
              <select className={inputClass} value={form.currency} onChange={e => set('currency', e.target.value)}>
                <option value="INR">₹ INR</option>
                <option value="USD">$ USD</option>
              </select>
            </Field>
            <Field label="Target Date" required>
              <input type="date" className={inputClass} value={form.targetDate} onChange={e => set('targetDate', e.target.value)} />
            </Field>
          </div>
          <Field label="Track Progress By">
            <select className={inputClass} value={form.trackBy} onChange={e => set('trackBy', e.target.value)}>
              <option>Net Worth (all assets)</option>
              <option>Specific Assets</option>
              <option>Cash Savings</option>
            </select>
          </Field>
          <Field label="Notes (optional)">
            <input className={inputClass} placeholder="Why this goal matters, milestones, plan..." value={form.notes} onChange={e => set('notes', e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit"><Plus size={15} /> Create Goal</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
