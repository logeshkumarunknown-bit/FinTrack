import { useState } from 'react';
import { Plus, Trash2, Wallet } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Card, EmptyState, Button, Modal, Field, inputClass } from '../../components/UI';
import { formatINR } from '../../lib/format';
import { ACCOUNT_TYPES } from '../../lib/initialState';

const empty = { name: '', type: 'Bank Account', balance: '' };

export default function Accounts() {
  const { state, dispatch } = useStore();
  const hidden = state.settings.hideBalances;
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(empty);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function submit(e) {
    e.preventDefault();
    if (!form.name) return;
    dispatch({ type: 'ADD_ACCOUNT', payload: { ...form, balance: Number(form.balance) || 0 } });
    setModalOpen(false);
    setForm(empty);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 pt-6 pb-5 flex-wrap">
        <div>
          <h1 className="font-display text-[28px] text-[var(--color-ink)]">Accounts</h1>
          <p className="text-[13.5px] text-[var(--color-ink-soft)] mt-1">Bank, card, cash &amp; wallet</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus size={15} /> Add Account</Button>
      </div>

      {state.accounts.length === 0 ? (
        <Card>
          <EmptyState
            icon={Wallet}
            title="No accounts yet"
            description="Add your bank, credit cards, cash and wallets so every expense and income can be tagged to the right place."
            action={<Button onClick={() => setModalOpen(true)}><Plus size={15} /> Add your first account</Button>}
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {state.accounts.map(a => (
            <Card key={a.id} className="p-5 group">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-[14.5px] text-[var(--color-ink)]">{a.name}</div>
                  <div className="text-[12px] text-[var(--color-ink-soft)] mt-0.5">{a.type}</div>
                </div>
                <button onClick={() => dispatch({ type: 'DELETE_ACCOUNT', id: a.id })} className="opacity-0 group-hover:opacity-100 p-1 text-[var(--color-ink-soft)] hover:text-[var(--color-clay)] transition-opacity"><Trash2 size={14} /></button>
              </div>
              <div className="font-mono-num text-[19px] text-[var(--color-ink)] mt-4">{formatINR(a.balance, { hidden })}</div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Account">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Name" required>
            <input className={inputClass} placeholder="e.g. HDFC Savings" value={form.name} onChange={e => set('name', e.target.value)} />
          </Field>
          <Field label="Type" required>
            <select className={inputClass} value={form.type} onChange={e => set('type', e.target.value)}>
              {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Current Balance (₹)">
            <input className={inputClass} placeholder="0.00" inputMode="decimal" value={form.balance} onChange={e => set('balance', e.target.value)} />
          </Field>
          <div className="flex items-center justify-end gap-2.5 mt-1">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Add Account</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
