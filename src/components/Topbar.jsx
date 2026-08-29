import { useState, useRef, useEffect } from 'react';
import { Moon, Sun, Eye, EyeOff, Bell, ChevronDown, Menu, LogOut } from 'lucide-react';
import { useStore } from '../lib/store';
import { cloudSignOut } from '../lib/useCloudSync';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ onMenu }) {
  const { state, dispatch } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setMenuOpen(false);
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const notifications = [
    { t: 'Your term insurance cover is below the recommended amount.' },
    { t: 'Set a target allocation to start tracking rebalancing.' },
    { t: 'No transactions logged this month yet.' },
    { t: 'Take your first net worth snapshot.' },
    { t: 'Add an account to tag your expenses.' },
    { t: 'Welcome to FinBoom — your dashboard is ready.' },
  ];

  return (
    <header className="sticky top-0 z-20 bg-[var(--color-cream)]/90 backdrop-blur">
      <div className="flex items-center justify-end px-5 md:px-8 py-4">
        <button className="md:hidden mr-auto -ml-1 p-1.5 text-[var(--color-ink-soft)]" onClick={onMenu}>
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-4 shrink-0" ref={ref}>
          <button
            title={state.settings.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={() => dispatch({ type: 'TOGGLE_DARK' })}
            className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
          >
            {state.settings.darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            title={state.settings.hideBalances ? 'Show amounts' : 'Hide amounts'}
            onClick={() => dispatch({ type: 'TOGGLE_HIDE' })}
            className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
          >
            {state.settings.hideBalances ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>

          <div className="relative">
            <button
              onClick={() => { setNotifOpen(v => !v); setMenuOpen(false); }}
              className="relative text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
            >
              <Bell size={18} />
              <span className="absolute -top-1.5 -right-1.5 bg-[var(--color-clay)] text-white text-[9px] font-semibold rounded-full w-4 h-4 flex items-center justify-center">
                {notifications.length}
              </span>
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-3 w-72 bg-[var(--color-paper)] border border-[var(--color-line)] rounded-xl shadow-lg p-2 animate-in">
                <div className="px-2 py-1.5 text-[12px] font-semibold text-[var(--color-ink-soft)]">Notifications</div>
                {notifications.map((n, i) => (
                  <div key={i} className="px-2 py-2 text-[13px] text-[var(--color-ink)] rounded-lg hover:bg-black/[0.03]">
                    {n.t}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => { setMenuOpen(v => !v); setNotifOpen(false); }}
              className="flex items-center gap-1.5 text-[14px] text-[var(--color-ink)]"
            >
              <span className="w-6 h-6 rounded-full bg-[var(--color-forest)] text-white text-[11px] flex items-center justify-center font-medium overflow-hidden">
                {state.user.photoURL ? <img src={state.user.photoURL} alt="" className="w-full h-full object-cover" /> : (state.user.name || 'U').charAt(0)}
              </span>
              <span className="hidden sm:inline">{state.user.name || 'You'}</span>
              <ChevronDown size={14} className="text-[var(--color-ink-soft)]" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-3 w-44 bg-[var(--color-paper)] border border-[var(--color-line)] rounded-xl shadow-lg p-1.5 animate-in">
                <button
                  onClick={() => navigate('/app/settings')}
                  className="w-full text-left px-3 py-2 text-[13px] rounded-lg hover:bg-black/[0.03]"
                >
                  Settings
                </button>
                <button
                  onClick={async () => { await cloudSignOut(); dispatch({ type: 'SIGN_OUT' }); navigate('/'); }}
                  className="w-full text-left px-3 py-2 text-[13px] rounded-lg hover:bg-black/[0.03] flex items-center gap-2 text-[var(--color-clay)]"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
