import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Copy, Trash2, Info } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Card, Button, inputClass } from '../../components/UI';
import { formatINR, monthLabel } from '../../lib/format';
import { EXPENSE_CATEGORIES } from '../../lib/initialState';
import { monthKey } from '../../lib/calc';

export default function Budget() {
  const { state, dispatch } = useStore();
  const hidden = state.settings.hideBalances;
  const [cursor, setCursor] = useState(new Date());
  const key = monthKey(cursor);
  const saved = state.budgets[key] || [];
  const [draft, setDraft] = useState(saved);

  const activeCategories = draft.length ? draft : saved;

  function addCategory(name) {
    if (activeCategories.find(c => c.category === name)) return;
    setDraft([...(draft.length ? draft : saved), { category: name, limit: '' }]);
  }
  function setLimit(name, val) {
    const base = draft.length ? draft : saved;
    setDraft(base.map(c => c.category === name ? { ...c, limit: val } : c));
  }
  function removeCategory(name) {
    const base = draft.length ? draft : saved;
    setDraft(base.filter(c => c.category !== name));
  }

  function save() {
    dispatch({ type: 'SET_BUDGET', month: key, categories: (draft.length || saved.length) ? (draft.length ? draft : saved) : [] });
  }

  function autoSuggest() {
    const income = Number(state.profile.monthlyIncome) || 0;
    const suggestions = [
      ['Housing & Rent', 0.3], ['Food & Dining', 0.1], ['Groceries', 0.1], ['Transport', 0.08],
      ['Utilities', 0.05], ['Entertainment', 0.05], ['Investment', 0.15],
    ];
    setDraft(suggestions.map(([category, pct]) => ({ category, limit: Math.round(income * pct) || 0 })));
  }

  function copyLastMonth() {
    const prev = new Date(cursor);
    prev.setMonth(prev.getMonth() - 1);
    const prevData = state.budgets[monthKey(prev)] || [];
    if (prevData.length === 0) return;
    setDraft(prevData);
  }

  const rows = draft.length ? draft : saved;
  const total = rows.reduce((s, c) => s + (Number(c.limit) || 0), 0);

  return (
    <div>
      <div className="pt-6 pb-5">
        <h1 className="font-display text-[28px] text-[var(--color-ink)]">Budget</h1>
        <p className="text-[13.5px] text-[var(--color-ink-soft)] mt-1">Plan your month, then watch how it goes</p>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => setCursor(c => { const d = new Date(c); d.setMonth(d.getMonth() - 1); return d; })} className="p-1.5 text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"><ChevronLeft size={18} /></button>
        <span className="text-[15px] font-medium text-[var(--color-ink)] w-40 text-center">{monthLabel(cursor)}</span>
        <button onClick={() => setCursor(c => { const d = new Date(c); d.setMonth(d.getMonth() + 1); return d; })} className="p-1.5 text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"><ChevronRight size={18} /></button>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="flex items-center gap-1.5 text-[15px] font-semibold text-[var(--color-ink)]">Monthly plan <Info size={13} className="text-[var(--color-ink-faint)]" /></span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={autoSuggest}><Sparkles size={14} /> Auto-suggest</Button>
            <Button variant="secondary" onClick={copyLastMonth}><Copy size={14} /> Copy from last month</Button>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="text-[13.5px] text-[var(--color-ink-soft)] py-6 text-center">No categories yet. Tap Add categories below to start.</p>
        ) : (
          <div className="flex flex-col divide-y divide-[var(--color-line)]">
            {rows.map(c => (
              <div key={c.category} className="flex items-center justify-between py-3 group">
                <span className="text-[14px] text-[var(--color-ink)]">{c.category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-[var(--color-ink-faint)]">₹</span>
                  <input
                    className="w-28 px-2.5 py-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-cream-soft)] text-[13.5px] text-right focus:outline-none focus:ring-2 focus:ring-[var(--color-forest)]/30"
                    inputMode="decimal" value={c.limit} onChange={e => setLimit(c.category, e.target.value)}
                  />
                  <button onClick={() => removeCategory(c.category)} className="opacity-0 group-hover:opacity-100 p-1 text-[var(--color-ink-faint)] hover:text-[var(--color-clay)] transition-opacity"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <div className="text-[12px] text-[var(--color-ink-faint)] mb-2">+ Add categories</div>
          <div className="flex flex-wrap gap-2">
            {EXPENSE_CATEGORIES.filter(c => !rows.find(r => r.category === c)).map(c => (
              <button key={c} onClick={() => addCategory(c)} className="px-3 py-1.5 rounded-lg text-[12.5px] font-medium bg-black/[0.04] text-[var(--color-ink-soft)] hover:bg-black/[0.07]">+ {c}</button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--color-line)]">
          <span className="text-[14px] font-medium text-[var(--color-ink)]">Total</span>
          <span className="font-mono-num text-[16px] text-[var(--color-ink)]">{formatINR(total, { hidden })}</span>
        </div>
      </Card>

      <div className="flex justify-end mt-4">
        <Button onClick={save} disabled={rows.length === 0}>Save budget</Button>
      </div>
    </div>
  );
}
