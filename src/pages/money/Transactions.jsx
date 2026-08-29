import { useMemo, useState } from 'react';
import { Search, Download, Plus, Settings, Trash2, Receipt } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Card, EmptyState, Button, Modal, Field, inputClass } from '../../components/UI';
import { formatINR, formatDate, monthLabel } from '../../lib/format';
import { EXPENSE_CATEGORIES } from '../../lib/initialState';

const empty = { type: 'expense', amount: '', category: '', account: '', date: new Date().toISOString().slice(0, 10), note: '' };

export default function Transactions({ autoOpenType }) {
  const { state, dispatch } = useStore();
  const hidden = state.settings.hideBalances;
  const [filter, setFilter] = useState(autoOpenType ? (autoOpenType === 'income' ? 'income' : 'expense') : 'expense');
  const [modalOpen, setModalOpen] = useState(!!autoOpenType);
  const [form, setForm] = useState({ ...empty, type: autoOpenType || 'expense' });

  const filtered = useMemo(() => {
    if (filter === 'all') return state.transactions;
    return state.transactions.filter(t => t.type === filter);
  }, [state.transactions, filter]);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function submit(e) {
    e.preventDefault();
    if (!form.amount || !form.category) return;
    dispatch({ type: 'ADD_TRANSACTION', payload: { ...form, amount: Number(form.amount) } });
    setModalOpen(false);
    setForm(empty);
  }

  const emptyCopy = {
    expense: 'No expenses recorded yet. Add your first entry above.',
    income: 'No income recorded yet. Add your first entry above.',
    transfer: 'No transfers recorded yet. Add your first entry above.',
    all: 'No transactions yet. Add your first entry above.',
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 pt-6 pb-5 flex-wrap">
        <div>
          <h1 className="font-display text-[28px] text-[var(--color-ink)]">Transactions</h1>
          <p className="text-[13.5px] text-[var(--color-ink-soft)] mt-1">{state.transactions.length} entries</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)]" />
            <input placeholder="Search..." className="pl-8 pr-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] text-[13.5px] w-36 focus:outline-none focus:ring-2 focus:ring-[var(--color-forest)]/30" />
          </div>
          <Button variant="secondary"><Download size={14} /> Export</Button>
          <Button onClick={() => { setForm({ ...empty, type: filter === 'all' ? 'expense' : filter }); setModalOpen(true); }}><Plus size={15} /> Add</Button>
          <button className="p-2 text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"><Settings size={17} /></button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-1 bg-black/[0.04] rounded-lg p-1 w-fit">
          {[['expense', 'Expense'], ['income', 'Income'], ['transfer', 'Transfer'], ['all', 'All']].map(([k, l]) => (
            <button
              key={k} onClick={() => setFilter(k)}
              className={`px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-colors ${filter === k ? 'bg-[var(--color-forest)] text-white' : 'text-[var(--color-ink-soft)]'}`}
            >
              {l}
            </button>
          ))}
        </div>
        <span className="text-[13px] text-[var(--color-ink-soft)] bg-[var(--color-paper)] border border-[var(--color-line)] px-3 py-1.5 rounded-lg">{monthLabel()}</span>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon={Receipt} title="Nothing here yet" description={emptyCopy[filter]} />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {filtered.map(t => (
            <div key={t.id} className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-line)] last:border-0 group hover:bg-black/[0.015]">
              <div>
                <div className="text-[14px] font-medium text-[var(--color-ink)]">{t.category}</div>
                <div className="text-[12px] text-[var(--color-ink-soft)] mt-0.5">{formatDate(t.date)}{t.account ? ` · ${t.account}` : ''}{t.note ? ` · ${t.note}` : ''}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-mono-num text-[14.5px] ${t.type === 'income' ? 'text-[var(--color-forest)]' : t.type === 'expense' ? 'text-[var(--color-clay)]' : 'text-[var(--color-ink)]'}`}>
                  {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}{formatINR(t.amount, { hidden })}
                </span>
                <button onClick={() => dispatch({ type: 'DELETE_TRANSACTION', id: t.id })} className="opacity-0 group-hover:opacity-100 p-1.5 text-[var(--color-ink-soft)] hover:text-[var(--color-clay)] transition-opacity"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Transaction">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex items-center gap-1 bg-black/[0.04] rounded-lg p-1 w-fit">
            {[['expense', 'Expense'], ['income', 'Income'], ['transfer', 'Transfer']].map(([k, l]) => (
              <button
                key={k} type="button" onClick={() => set('type', k)}
                className={`px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-colors ${form.type === k ? 'bg-[var(--color-forest)] text-white' : 'text-[var(--color-ink-soft)]'}`}
              >
                {l}
              </button>
            ))}
          </div>
          <Field label="Amount (₹)" required>
            <input className={inputClass} inputMode="decimal" placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} />
          </Field>
          <Field label="Category" required>
            {form.type === 'expense' ? (
              <select className={inputClass} value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">Select category</option>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <input className={inputClass} placeholder={form.type === 'income' ? 'e.g. Salary' : 'e.g. To Savings'} value={form.category} onChange={e => set('category', e.target.value)} />
            )}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Account">
              <select className={inputClass} value={form.account} onChange={e => set('account', e.target.value)}>
                <option value="">No account</option>
                {state.accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
              </select>
            </Field>
            <Field label="Date" required>
              <input type="date" className={inputClass} value={form.date} onChange={e => set('date', e.target.value)} />
            </Field>
          </div>
          <Field label="Note">
            <input className={inputClass} placeholder="Optional" value={form.note} onChange={e => set('note', e.target.value)} />
          </Field>
          <div className="flex items-center justify-end gap-2.5 mt-1">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Entry</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
