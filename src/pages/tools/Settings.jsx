import { useNavigate } from 'react-router-dom';
import { Moon, Eye, Trash2, LogOut, Cloud, CloudOff } from 'lucide-react';
import { useStore } from '../../lib/store';
import { cloudEnabled } from '../../lib/firebase';
import { cloudSignOut } from '../../lib/useCloudSync';
import { PageHeader, Card, Button, Field, inputClass, Badge } from '../../components/UI';

export default function Settings() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();

  function resetAll() {
    if (confirm('This clears all local FinBoom data on this device. Continue?')) {
      dispatch({ type: 'RESET_ALL' });
      navigate('/signin');
    }
  }

  async function signOut() {
    await cloudSignOut();
    dispatch({ type: 'SIGN_OUT' });
    navigate('/');
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />

      <Card className="p-6 mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2 text-[13.5px] text-[var(--color-ink)]">
          {cloudEnabled ? <Cloud size={16} className="text-[var(--color-forest)]" /> : <CloudOff size={16} className="text-[var(--color-ink-faint)]" />}
          {cloudEnabled ? 'Synced to your Google account in real time' : 'Local-only — cloud sync not configured'}
        </span>
        <Badge tone={cloudEnabled ? 'good' : 'neutral'}>{cloudEnabled ? 'Live' : 'Offline'}</Badge>
      </Card>

      <Card className="p-6 mb-4">
        <div className="text-[14.5px] font-medium text-[var(--color-ink)] mb-4">Profile</div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name">
            <input className={inputClass} value={state.user.name} onChange={e => dispatch({ type: 'SIGN_IN', name: e.target.value })} />
          </Field>
          <Field label="Email">
            <input className={inputClass} value={state.user.email} disabled />
          </Field>
        </div>
      </Card>

      <Card className="p-6 mb-4">
        <div className="text-[14.5px] font-medium text-[var(--color-ink)] mb-4">Appearance</div>
        <div className="flex items-center justify-between py-2">
          <span className="flex items-center gap-2 text-[13.5px] text-[var(--color-ink)]"><Moon size={15} /> Dark mode</span>
          <Toggle checked={state.settings.darkMode} onChange={() => dispatch({ type: 'TOGGLE_DARK' })} />
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="flex items-center gap-2 text-[13.5px] text-[var(--color-ink)]"><Eye size={15} /> Hide amounts by default</span>
          <Toggle checked={state.settings.hideBalances} onChange={() => dispatch({ type: 'TOGGLE_HIDE' })} />
        </div>
      </Card>

      <Card className="p-6">
        <div className="text-[14.5px] font-medium text-[var(--color-ink)] mb-1">Danger zone</div>
        <p className="text-[13px] text-[var(--color-ink-soft)] mb-4">Everything in FinBoom lives only on this device — nothing is synced anywhere. Clearing it can't be undone.</p>
        <div className="flex items-center gap-2.5">
          <Button variant="danger" onClick={resetAll}><Trash2 size={14} /> Clear all data</Button>
          <Button variant="secondary" onClick={signOut}><LogOut size={14} /> Sign out</Button>
        </div>
      </Card>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`w-10 h-5.5 rounded-full transition-colors relative ${checked ? 'bg-[var(--color-forest)]' : 'bg-black/[0.15]'}`}
      style={{ height: 22, width: 40 }}
    >
      <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white transition-transform ${checked ? 'translate-x-[18px]' : ''}`} style={{ height: 18, width: 18 }} />
    </button>
  );
}
