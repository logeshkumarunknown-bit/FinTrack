import { useState } from 'react';
import { CalendarPlus, Camera } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useStore } from '../../lib/store';
import { Card, Button, Modal, Field, inputClass } from '../../components/UI';
import { formatINR, formatDate } from '../../lib/format';
import { totalAssets, totalLiabilities, netWorth } from '../../lib/calc';

export default function NetWorth() {
  const { state, dispatch } = useStore();
  const hidden = state.settings.hideBalances;
  const [view, setView] = useState('networth');
  const [pastOpen, setPastOpen] = useState(false);
  const [pastDate, setPastDate] = useState('');
  const [pastValue, setPastValue] = useState('');

  const assets = totalAssets(state.assets);
  const liabilities = totalLiabilities(state.liabilities);
  const nw = netWorth(state.assets, state.liabilities);

  function takeSnapshot() {
    dispatch({ type: 'TAKE_SNAPSHOT', payload: { date: new Date().toISOString().slice(0, 10), netWorth: nw, assets, liabilities } });
  }

  function addPast(e) {
    e.preventDefault();
    if (!pastDate || !pastValue) return;
    dispatch({ type: 'ADD_PAST_ENTRY', payload: { date: pastDate, netWorth: Number(pastValue), assets, liabilities } });
    setPastOpen(false);
    setPastDate(''); setPastValue('');
  }

  const chartData = state.netWorthSnapshots.map(s => ({
    date: formatDate(s.date),
    value: view === 'assets' ? s.assets : view === 'liabilities' ? s.liabilities : s.netWorth,
  }));

  return (
    <div>
      <div className="flex items-center justify-between gap-3 pt-6 pb-5 flex-wrap">
        <div>
          <h1 className="font-display text-[28px] text-[var(--color-ink)]">Net Worth</h1>
          <p className="text-[13.5px] text-[var(--color-ink-soft)] mt-1">{state.netWorthSnapshots.length} snapshot{state.netWorthSnapshots.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setPastOpen(true)}><CalendarPlus size={15} /> Add Past Entry</Button>
          <Button onClick={takeSnapshot}><Camera size={15} /> Take New Snapshot</Button>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-4 w-fit bg-black/[0.04] rounded-lg p-1">
        {[['networth', 'Net Worth'], ['assets', 'Assets'], ['liabilities', 'Liabilities']].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setView(k)}
            className={`px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-colors ${view === k ? 'bg-[var(--color-forest)] text-white' : 'text-[var(--color-ink-soft)]'}`}
          >
            {l}
          </button>
        ))}
      </div>

      <Card className="p-6">
        <span className="text-[11px] font-semibold tracking-[0.1em] text-[var(--color-ink-faint)]">YOUR CURRENT NET WORTH</span>
        <div className="font-display text-[36px] text-[var(--color-ink)] mt-2">{formatINR(nw, { hidden })}</div>
        <div className="flex gap-8 mt-4">
          <div>
            <div className="text-[11px] text-[var(--color-ink-faint)]">ASSETS</div>
            <div className="font-mono-num text-[15px] text-[var(--color-forest)] mt-0.5">{formatINR(assets, { compact: true, hidden })}</div>
          </div>
          <div>
            <div className="text-[11px] text-[var(--color-ink-faint)]">LIABILITIES</div>
            <div className="font-mono-num text-[15px] text-[var(--color-clay)] mt-0.5">{formatINR(liabilities, { compact: true, hidden })}</div>
          </div>
        </div>

        {chartData.length > 1 && (
          <div className="h-56 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-ink-faint)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-faint)' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatINR(v, { compact: true, hidden })} />
                <Tooltip formatter={(v) => formatINR(v, { hidden })} contentStyle={{ borderRadius: 10, border: '1px solid var(--color-line)', fontSize: 12 }} />
                <Line type="monotone" dataKey="value" stroke="var(--color-forest)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {state.netWorthSnapshots.length === 0 && (
          <div className="mt-6 pt-6 border-t border-[var(--color-line)]">
            <p className="text-[13.5px] text-[var(--color-ink-soft)]">Snapshots record your net worth at a point in time so you can track growth over months.</p>
            <div className="flex items-center gap-2.5 mt-4">
              <Button onClick={takeSnapshot}>Take Your First Snapshot</Button>
              <Button variant="secondary" onClick={() => setPastOpen(true)}>Add Past Entry</Button>
            </div>
            <p className="text-[12px] text-[var(--color-ink-faint)] mt-3">Tracked your net worth somewhere else before this? Add those months as past entries so your chart starts with real history.</p>
          </div>
        )}
      </Card>

      <Modal open={pastOpen} onClose={() => setPastOpen(false)} title="Add Past Entry">
        <form onSubmit={addPast} className="flex flex-col gap-4">
          <Field label="Month" required>
            <input type="month" className={inputClass} value={pastDate ? pastDate.slice(0, 7) : ''} onChange={e => setPastDate(e.target.value + '-01')} />
          </Field>
          <Field label="Net Worth (₹)" required>
            <input className={inputClass} placeholder="e.g. 350000" inputMode="decimal" value={pastValue} onChange={e => setPastValue(e.target.value)} />
          </Field>
          <div className="flex items-center justify-end gap-2.5 mt-1">
            <Button type="button" variant="secondary" onClick={() => setPastOpen(false)}>Cancel</Button>
            <Button type="submit">Add Entry</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
