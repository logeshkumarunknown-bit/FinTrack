import { useMemo, useState } from 'react';
import { Search, Plus, Trash2, Pencil, Layers } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Card, EmptyState, Button } from '../../components/UI';
import { formatINR, formatNumber } from '../../lib/format';
import { assetCurrentValue, assetInvestedValue, totalAssets } from '../../lib/calc';
import { ASSET_TYPES } from '../../lib/initialState';
import AddAssetModal from '../../components/AddAssetModal';

export default function Assets({ autoOpen }) {
  const { state, dispatch } = useStore();
  const hidden = state.settings.hideBalances;
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(!!autoOpen);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState([]);

  const filtered = useMemo(() => {
    return state.assets.filter(a => {
      if (typeFilter !== 'All' && a.type !== typeFilter) return false;
      if (query && !a.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [state.assets, typeFilter, query]);

  const invested = filtered.reduce((s, a) => s + assetInvestedValue(a), 0);
  const current = filtered.reduce((s, a) => s + assetCurrentValue(a), 0);
  const pnl = current - invested;
  const totalCurrent = totalAssets(state.assets) || 1;

  function save(payload) {
    if (editing) dispatch({ type: 'UPDATE_ASSET', id: editing.id, payload });
    else dispatch({ type: 'ADD_ASSET', payload });
    setEditing(null);
  }

  function remove(id) {
    dispatch({ type: 'DELETE_ASSET', id });
    setSelected(s => s.filter(x => x !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 pt-6 pb-5 flex-wrap">
        <div>
          <h1 className="font-display text-[28px] text-[var(--color-ink)]">Assets</h1>
          <p className="text-[13.5px] text-[var(--color-ink-soft)] mt-1">{state.assets.length} asset{state.assets.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)]" />
            <input
              value={query} onChange={e => setQuery(e.target.value)} placeholder="Search..."
              className="pl-8 pr-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] text-[13.5px] w-40 focus:outline-none focus:ring-2 focus:ring-[var(--color-forest)]/30"
            />
          </div>
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={15} /> Add Asset</Button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {['All', ...ASSET_TYPES].map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-[12.5px] font-medium whitespace-nowrap transition-colors ${
              typeFilter === t ? 'bg-[var(--color-ink)] text-[var(--color-cream)]' : 'bg-black/[0.04] text-[var(--color-ink-soft)] hover:bg-black/[0.07]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {state.assets.length === 0 ? (
        <Card>
          <EmptyState
            icon={Layers}
            title="No assets yet"
            description="Add your stocks, funds, property, gold, or cash so your net worth stays accurate."
            action={<Button onClick={() => setModalOpen(true)}><Plus size={15} /> Add your first asset</Button>}
          />
        </Card>
      ) : (
        <>
          <Card className="p-6 mb-4">
            <span className="text-[11px] font-semibold tracking-[0.1em] text-[var(--color-ink-faint)]">TOTAL ASSETS</span>
            <div className="grid sm:grid-cols-3 gap-4 mt-3">
              <div>
                <div className="text-[11px] text-[var(--color-ink-faint)]">INVESTED</div>
                <div className="font-mono-num text-[19px] text-[var(--color-ink)] mt-1">{formatINR(invested, { hidden })}</div>
              </div>
              <div>
                <div className="text-[11px] text-[var(--color-ink-faint)]">CURRENT VALUE</div>
                <div className="font-mono-num text-[19px] text-[var(--color-ink)] mt-1">{formatINR(current, { hidden })}</div>
              </div>
              <div>
                <div className="text-[11px] text-[var(--color-ink-faint)]">P&amp;L</div>
                <div className={`font-mono-num text-[19px] mt-1 ${pnl >= 0 ? 'text-[var(--color-forest)]' : 'text-[var(--color-clay)]'}`}>
                  {pnl >= 0 ? '+' : ''}{formatINR(pnl, { hidden })}
                </div>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13.5px]">
                <thead>
                  <tr className="border-b border-[var(--color-line)] text-[11px] text-[var(--color-ink-faint)] tracking-wide">
                    <th className="text-left font-semibold px-5 py-3">NAME</th>
                    <th className="text-right font-semibold px-3 py-3">QTY</th>
                    <th className="text-right font-semibold px-3 py-3">AVG. COST</th>
                    <th className="text-right font-semibold px-3 py-3">INVESTED</th>
                    <th className="text-right font-semibold px-3 py-3">CUR. VAL</th>
                    <th className="text-right font-semibold px-3 py-3">P&amp;L</th>
                    <th className="text-right font-semibold px-3 py-3">% ALLOC</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(a => {
                    const inv = assetInvestedValue(a);
                    const cur = assetCurrentValue(a);
                    const p = cur - inv;
                    const alloc = (cur / totalCurrent) * 100;
                    return (
                      <tr key={a.id} className="border-b border-[var(--color-line)] last:border-0 hover:bg-black/[0.015] group">
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-[var(--color-ink)]">{a.name}</div>
                          <div className="text-[11.5px] text-[var(--color-ink-faint)]">{a.type}</div>
                        </td>
                        <td className="text-right px-3 font-mono-num">{formatNumber(a.qty, a.qty % 1 ? 2 : 0)}</td>
                        <td className="text-right px-3 font-mono-num">{formatINR(a.avgCost, { hidden })}</td>
                        <td className="text-right px-3 font-mono-num">{formatINR(inv, { hidden })}</td>
                        <td className="text-right px-3 font-mono-num font-medium">{formatINR(cur, { hidden })}</td>
                        <td className={`text-right px-3 font-mono-num ${p >= 0 ? 'text-[var(--color-forest)]' : 'text-[var(--color-clay)]'}`}>
                          {p >= 0 ? '+' : ''}{formatINR(p, { hidden })}
                        </td>
                        <td className="text-right px-3 font-mono-num text-[var(--color-ink-soft)]">{alloc.toFixed(1)}%</td>
                        <td className="px-4">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditing(a); setModalOpen(true); }} className="p-1.5 text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"><Pencil size={13} /></button>
                            <button onClick={() => remove(a.id)} className="p-1.5 text-[var(--color-ink-soft)] hover:text-[var(--color-clay)]"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <AddAssetModal
        open={modalOpen}
        initial={editing}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={save}
      />
    </div>
  );
}
