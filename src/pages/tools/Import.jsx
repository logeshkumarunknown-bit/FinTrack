import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Check, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { useStore } from '../../lib/store';
import { PageHeader, Card, Button } from '../../components/UI';
import { parseBrokerFile } from '../../lib/importParser';
import { demoAssets } from '../../lib/seed';

export default function Import() {
  const { dispatch } = useStore();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [state, setState] = useState('idle'); // idle | parsing | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file) {
    if (!file) return;
    setState('parsing');
    setError('');
    try {
      const { assets, skipped } = await parseBrokerFile(file);
      if (assets.length === 0) {
        setError("Couldn't find any recognizable holdings in that file. Check that it has columns like Name/Symbol, Quantity and Avg. Cost, or add assets manually instead.");
        setState('error');
        return;
      }
      dispatch({ type: 'ADD_ASSETS', payload: assets });
      setResult({ count: assets.length, skipped, fileName: file.name });
      setState('done');
    } catch (e) {
      setError(e.message || 'Something went wrong reading that file.');
      setState('error');
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  }

  function loadSample() {
    demoAssets.forEach(a => {
      const { id, ...rest } = a;
      dispatch({ type: 'ADD_ASSET', payload: rest });
    });
    setResult({ count: demoAssets.length, skipped: 0, fileName: 'sample portfolio' });
    setState('done');
  }

  return (
    <div>
      <PageHeader title="Import" subtitle="Bring in your full portfolio from a broker export — no limit on holdings" />

      <Card
        className={`p-10 flex flex-col items-center text-center border-2 border-dashed transition-colors ${dragOver ? 'border-[var(--color-forest)] bg-[var(--color-forest-soft)]/30' : 'border-[var(--color-line)]'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <div className="w-12 h-12 rounded-full bg-black/[0.04] flex items-center justify-center mb-4">
          {state === 'done' ? <Check size={20} className="text-[var(--color-forest)]" />
            : state === 'error' ? <AlertTriangle size={20} className="text-[var(--color-clay)]" />
            : <UploadCloud size={20} className="text-[var(--color-ink-soft)]" />}
        </div>

        {state === 'done' && result ? (
          <>
            <div className="font-medium text-[15px] text-[var(--color-ink)]">Imported {result.count} holding{result.count !== 1 ? 's' : ''}</div>
            <p className="text-[13.5px] text-[var(--color-ink-soft)] mt-1.5 max-w-sm">
              From {result.fileName}{result.skipped ? ` — ${result.skipped} row${result.skipped !== 1 ? 's' : ''} skipped (missing name, quantity, or cost).` : '.'} Review and edit them under Wealth → Assets.
            </p>
            <div className="flex items-center gap-2.5 mt-5">
              <Button onClick={() => navigate('/app/wealth')}>Go to Assets</Button>
              <Button variant="secondary" onClick={() => { setState('idle'); setResult(null); }}>Import another file</Button>
            </div>
          </>
        ) : (
          <>
            <div className="font-medium text-[15px] text-[var(--color-ink)]">
              {state === 'parsing' ? 'Reading your file…' : state === 'error' ? "Couldn't read that file" : 'Upload a broker statement'}
            </div>
            <p className="text-[13.5px] text-[var(--color-ink-soft)] mt-1.5 max-w-sm">
              {state === 'error' ? error : 'Drop a CSV or Excel export from Zerodha, Groww, or any broker — every holding in the file is imported, however many rows it has.'}
            </p>
            <div className="flex items-center gap-2.5 mt-5">
              <Button onClick={() => inputRef.current?.click()} disabled={state === 'parsing'}>
                <FileSpreadsheet size={15} /> {state === 'parsing' ? 'Reading…' : 'Choose file'}
              </Button>
              <Button variant="secondary" onClick={loadSample} disabled={state === 'parsing'}>Try sample portfolio</Button>
            </div>
            <p className="text-[11.5px] text-[var(--color-ink-faint)] mt-4">.csv, .xlsx, or .xls — columns like Name/Symbol, Quantity, Avg. Cost are auto-detected</p>
          </>
        )}

        <input
          ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </Card>
    </div>
  );
}
