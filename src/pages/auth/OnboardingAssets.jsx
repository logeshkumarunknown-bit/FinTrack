import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, TrendingUp, Landmark, Home, Coins, Wallet, Bitcoin, Layers, Plus, ArrowRight, Check, AlertTriangle } from 'lucide-react';
import { useStore } from '../../lib/store';
import { parseBrokerFile } from '../../lib/importParser';
import OnboardingShell from './OnboardingShell';
import AddAssetModal from '../../components/AddAssetModal';

const types = [
  { type: 'Equity', count: '10 types', icon: TrendingUp },
  { type: 'Debt', count: '17 types', icon: Landmark },
  { type: 'Real Estate', count: '2 types', icon: Home },
  { type: 'Commodities', count: '4 types', icon: Coins },
  { type: 'Cash & Savings', count: '2 types', icon: Wallet },
  { type: 'Crypto', count: '2 types', icon: Bitcoin },
  { type: 'Alternatives', count: '2 types', icon: Layers },
  { type: 'Other', count: '', icon: Plus },
];

export default function OnboardingAssets() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [modalType, setModalType] = useState(null);
  const [importState, setImportState] = useState('idle'); // idle | parsing | done | error
  const [importMsg, setImportMsg] = useState('');

  function addAsset(payload) {
    dispatch({ type: 'ADD_ASSET', payload });
  }

  async function handleFile(file) {
    if (!file) return;
    setImportState('parsing');
    try {
      const { assets, skipped } = await parseBrokerFile(file);
      if (assets.length === 0) {
        setImportMsg("Couldn't find any holdings in that file — try a CSV/Excel export, or add manually below.");
        setImportState('error');
        return;
      }
      dispatch({ type: 'ADD_ASSETS', payload: assets });
      setImportMsg(`Imported all ${assets.length} holding${assets.length !== 1 ? 's' : ''}${skipped ? ` (${skipped} row${skipped !== 1 ? 's' : ''} skipped)` : ''}`);
      setImportState('done');
    } catch (e) {
      setImportMsg(e.message || 'Could not read that file.');
      setImportState('error');
    }
  }

  function finish() {
    navigate('/onboarding/done');
  }

  return (
    <OnboardingShell step={2}>
      <div className="text-center mb-6">
        <h2 className="font-display text-[20px] text-[var(--color-ink)]">Add your assets</h2>
        <p className="text-[13px] text-[var(--color-ink-soft)] mt-1.5">Import from your broker or add manually. You can always do this later.</p>
      </div>

      <button
        onClick={() => inputRef.current?.click()}
        disabled={importState === 'parsing'}
        className="w-full flex items-center gap-3 border border-dashed border-[var(--color-line)] rounded-lg px-4 py-3.5 hover:bg-black/[0.02] transition-colors text-left disabled:opacity-60"
      >
        <span className="w-9 h-9 rounded-full bg-black/[0.04] flex items-center justify-center shrink-0">
          {importState === 'done' ? <Check size={16} className="text-[var(--color-forest)]" />
            : importState === 'error' ? <AlertTriangle size={16} className="text-[var(--color-clay)]" />
            : <Upload size={16} className="text-[var(--color-ink)]" />}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[13.5px] font-medium text-[var(--color-ink)]">
            {importState === 'parsing' ? 'Reading your file…' : importState === 'idle' ? 'Import from Broker' : importMsg}
          </span>
          <span className="block text-[12px] text-[var(--color-ink-soft)]">
            {importState === 'idle' ? 'Upload CSV/Excel from Zerodha, Groww, or any broker — no limit on rows' : importState === 'done' ? 'You can edit these anytime under Wealth' : ' '}
          </span>
        </span>
        <ArrowRight size={15} className="text-[var(--color-ink-faint)] shrink-0" />
      </button>
      <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />

      <div className="flex items-center gap-3 my-5">
        <div className="h-px flex-1 bg-[var(--color-line)]" />
        <span className="text-[12px] text-[var(--color-ink-faint)]">or add manually</span>
        <div className="h-px flex-1 bg-[var(--color-line)]" />
      </div>

      <div className="text-[13px] font-medium text-[var(--color-ink)] mb-2.5">Asset Type</div>
      <div className="grid grid-cols-4 gap-2">
        {types.map(({ type, count, icon: Icon }) => (
          <button
            key={type}
            onClick={() => setModalType(type)}
            className="flex flex-col items-center justify-center gap-1.5 border border-[var(--color-line)] rounded-lg py-3.5 px-1 hover:border-[var(--color-forest)] hover:bg-[var(--color-forest-soft)]/40 transition-colors"
          >
            <Icon size={17} className="text-[var(--color-ink)]" />
            <span className="text-[11px] font-medium text-[var(--color-ink)] text-center leading-tight">{type}</span>
            {count && <span className="text-[10px] text-[var(--color-ink-faint)]">{count}</span>}
          </button>
        ))}
      </div>

      {state.assets.length > 0 && (
        <p className="text-[12px] text-[var(--color-forest)] mt-4 text-center">{state.assets.length} asset{state.assets.length !== 1 ? 's' : ''} added so far</p>
      )}

      <div className="flex items-center justify-between mt-7">
        <button onClick={() => navigate('/onboarding/profile')} className="text-[13.5px] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">Back</button>
        <div className="flex items-center gap-2.5">
          <button onClick={finish} className="px-4 py-2.5 rounded-lg text-[13.5px] border border-[var(--color-line)] text-[var(--color-ink)] hover:bg-black/[0.03]">Skip</button>
          <button onClick={finish} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-[13.5px] font-medium bg-[var(--color-forest)] text-white hover:bg-[var(--color-forest-deep)]">
            Save <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <AddAssetModal open={!!modalType} defaultType={modalType} onClose={() => setModalType(null)} onSave={addAsset} />
    </OnboardingShell>
  );
}
