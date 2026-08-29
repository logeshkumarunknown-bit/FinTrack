import { useState } from 'react';
import { Plus, Trash2, Pencil, Landmark } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Card, EmptyState, Button, Modal, Field, inputClass } from '../../components/UI';
import { formatINR, formatDate } from '../../lib/format';
import { totalLiabilities } from '../../lib/calc';
import { LIABILITY_TYPES } from '../../lib/initialState';

const empty = { name: '', type: '', currency: 'INR', outstandingAmount: '', interestRate: '', monthlyEMI: '', startDate: '', principalAmount: '', dueDate: '', firstEmiDate: '' };

export default function Liabilities() {
  const { state, dispatch } = useStore();
  const hidden = state.settings.hideBalances;
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showMore, setShowMore] = useState(false);
  const [form, setForm] = useState(empty);

  function openAdd() { setEditing(null); setForm(empty); setModalOpen(true); }
  function openEdit(l) { setEditing(l); setForm({ ...empty, ...l }); setModalOpen(true); }
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function submit(e) {
    e.preventDefault();
    if (!form.name || !form.type || !form.outstandingAmount) return;
    const payload = { ...form, outstandingAmount: Number(form.outstandingAmount), interestRate: Number(form.interestRate) || 0, monthlyEMI: Number(form.monthlyEMI) || 0 };
    if (editing) dispatch({ type: 'UPDATE_LIABILITY', id: editing.id, payload });
    else dispatch({ type: 'ADD_LIABILITY', payload });
    setModalOpen(false);
  }

  const total = totalLiabilities(state.liabilities);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 pt-6 pb-5 flex-wrap">
        <div>
          <h1 className="font-display text-[28px] text-[var(--color-ink)]">Liabilities</h1>
          <p className="text-[13.5px] text-[var(--color-ink-soft)] mt-1">Track your debts</p>
        </div>
        <Button onClick={openAdd}><Plus size={15} /> Add Liability</Button>
      </div>

      {state.liabilities.length === 0 ? (
        <Card>
          <EmptyState
            icon={Landmark}
            title="No liabilities yet"
            description="Track home, personal, or auto loans and credit card balances to see your true net worth."
            action={<Button onClick={openAdd}><Plus size={15} /> Add your first liability</Button>}
          />
        </Card>
      ) : (
        <>
          <Card className="p-6 mb-4 flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-[0.1em] text-[var(--color-ink-faint)]">TOTAL OUTSTANDING</span>
            <span className="font-mono-num text-[20px] text-[var(--color-clay)]">{formatINR(total, { hidden })}</span>
          </Card>
          <div className="flex flex-col gap-3">
            {state.liabilities.map(l => (
              <Card key={l.id} className="p-5 flex items-center justify-between group">
                <div>
                  <div className="font-medium text-[14px] text-[var(--color-ink)]">{l.name}</div>
                  <div className="text-[12px] text-[var(--color-ink-soft)] mt-0.5">
                    {l.type} · {l.interestRate ? `${l.interestRate}% p.a.` : 'Rate not set'} {l.monthlyEMI ? `· EMI ${formatINR(l.monthlyEMI, { hidden, compact: true })}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono-num text-[15px] text-[var(--color-ink)]">{formatINR(l.outstandingAmount, { hidden })}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(l)} className="p-1.5 text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"><Pencil size={14} /></button>
                    <button onClick={() => dispatch({ type: 'DELETE_LIABILITY', id: l.id })} className="p-1.5 text-[var(--color-ink-soft)] hover:text-[var(--color-clay)]"><Trash2 size={14} /></button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Liability' : 'Add Liability'}>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Name" required>
            <input className={inputClass} placeholder="e.g. Home Loan - SBI" value={form.name} onChange={e => set('name', e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type" required>
              <select className={inputClass} value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="">Select type</option>
                {LIABILITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Currency">
              <select className={inputClass} value={form.currency} onChange={e => set('currency', e.target.value)}>
                <option value="INR">INR ₹</option>
                <option value="USD">USD $</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Outstanding Amount" required>
              <input className={inputClass} placeholder="Amount" inputMode="decimal" value={form.outstandingAmount} onChange={e => set('outstandingAmount', e.target.value)} />
            </Field>
            <Field label="Interest Rate (%)" required>
              <input className={inputClass} placeholder="e.g. 8.5" inputMode="decimal" value={form.interestRate} onChange={e => set('interestRate', e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Monthly EMI">
              <input className={inputClass} placeholder="Monthly payment" inputMode="decimal" value={form.monthlyEMI} onChange={e => set('monthlyEMI', e.target.value)} />
            </Field>
            <Field label="Start Date" required>
              <input type="date" className={inputClass} value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </Field>
          </div>

          {showMore && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Principal Amount">
                <input className={inputClass} placeholder="Original loan amount" inputMode="decimal" value={form.principalAmount} onChange={e => set('principalAmount', e.target.value)} />
              </Field>
              <Field label="Due Date">
                <input type="date" className={inputClass} value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
              </Field>
              <Field label="First EMI Date" hint="Optional. Set if the first EMI was due more than a month after the loan started.">
                <input type="date" className={inputClass} value={form.firstEmiDate} onChange={e => set('firstEmiDate', e.target.value)} />
              </Field>
            </div>
          )}
          <button type="button" onClick={() => setShowMore(v => !v)} className="text-left text-[13px] text-[var(--color-forest)] font-medium">
            {showMore ? '︿ Less details' : '﹀ More details'}
          </button>

          <div className="flex items-center justify-end gap-2.5 mt-1">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Save Changes' : 'Add Liability'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
