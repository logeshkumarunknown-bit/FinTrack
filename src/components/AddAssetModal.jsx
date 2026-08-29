import { useState, useEffect } from 'react';
import { Modal, Field, inputClass, Button } from './UI';
import { ASSET_TYPES } from '../lib/initialState';

const empty = { name: '', type: 'Equity', qty: '', avgCost: '', currentPrice: '', currency: 'INR' };

export default function AddAssetModal({ open, onClose, onSave, defaultType, initial }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (open) setForm(initial ? { ...empty, ...initial } : { ...empty, type: defaultType || 'Equity' });
  }, [open, defaultType, initial]);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function submit(e) {
    e.preventDefault();
    if (!form.name || !form.qty || !form.avgCost) return;
    onSave({
      ...form,
      qty: Number(form.qty),
      avgCost: Number(form.avgCost),
      currentPrice: form.currentPrice ? Number(form.currentPrice) : Number(form.avgCost),
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Asset' : 'Add Asset'}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Name" required>
          <input className={inputClass} placeholder="e.g. HDFC Bank Ltd" value={form.name} onChange={e => set('name', e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type" required>
            <select className={inputClass} value={form.type} onChange={e => set('type', e.target.value)}>
              {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Currency">
            <select className={inputClass} value={form.currency} onChange={e => set('currency', e.target.value)}>
              <option value="INR">₹ INR</option>
              <option value="USD">$ USD</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantity" required>
            <input className={inputClass} placeholder="0" inputMode="decimal" value={form.qty} onChange={e => set('qty', e.target.value)} />
          </Field>
          <Field label="Avg. Cost / Unit" required>
            <input className={inputClass} placeholder="0.00" inputMode="decimal" value={form.avgCost} onChange={e => set('avgCost', e.target.value)} />
          </Field>
        </div>
        <Field label="Current Price / Unit" hint="Leave blank to use average cost">
          <input className={inputClass} placeholder="0.00" inputMode="decimal" value={form.currentPrice} onChange={e => set('currentPrice', e.target.value)} />
        </Field>
        <div className="flex items-center justify-end gap-2.5 mt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">{initial ? 'Save Changes' : 'Add Asset'}</Button>
        </div>
      </form>
    </Modal>
  );
}
