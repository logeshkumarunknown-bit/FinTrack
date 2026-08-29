import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { loadState, saveState, clearState } from './storage';
import { initialState } from './initialState';
import { uid } from './format';

const StoreContext = createContext(null);

function reducer(state, action) {
  switch (action.type) {
    case 'SIGN_IN':
      return { ...state, user: { ...state.user, name: action.name || state.user.name || 'Logeshkumar M', email: action.email ?? state.user.email, uid: action.uid ?? state.user.uid, photoURL: action.photoURL ?? state.user.photoURL, signedIn: true } };
    case 'SIGN_OUT':
      return { ...initialState };
    case 'ONBOARDING_STEP':
      return { ...state, onboarding: { step: action.step } };
    case 'UPDATE_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.payload } };
    case 'COMPLETE_ONBOARDING':
      return { ...state, user: { ...state.user, onboarded: true } };

    case 'TOGGLE_DARK':
      return { ...state, settings: { ...state.settings, darkMode: !state.settings.darkMode } };
    case 'TOGGLE_HIDE':
      return { ...state, settings: { ...state.settings, hideBalances: !state.settings.hideBalances } };

    case 'ADD_ASSET':
      return { ...state, assets: [{ id: uid(), ...action.payload }, ...state.assets] };
    case 'ADD_ASSETS':
      return { ...state, assets: [...action.payload.map(a => ({ id: uid(), ...a })), ...state.assets] };
    case 'UPDATE_ASSET':
      return { ...state, assets: state.assets.map(a => a.id === action.id ? { ...a, ...action.payload } : a) };
    case 'DELETE_ASSET':
      return { ...state, assets: state.assets.filter(a => a.id !== action.id) };
    case 'DELETE_ASSETS':
      return { ...state, assets: state.assets.filter(a => !action.ids.includes(a.id)) };

    case 'ADD_LIABILITY':
      return { ...state, liabilities: [{ id: uid(), ...action.payload }, ...state.liabilities] };
    case 'UPDATE_LIABILITY':
      return { ...state, liabilities: state.liabilities.map(l => l.id === action.id ? { ...l, ...action.payload } : l) };
    case 'DELETE_LIABILITY':
      return { ...state, liabilities: state.liabilities.filter(l => l.id !== action.id) };

    case 'ADD_TRANSACTION':
      return { ...state, transactions: [{ id: uid(), ...action.payload }, ...state.transactions] };
    case 'DELETE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter(t => t.id !== action.id) };

    case 'ADD_ACCOUNT':
      return { ...state, accounts: [{ id: uid(), ...action.payload }, ...state.accounts] };
    case 'DELETE_ACCOUNT':
      return { ...state, accounts: state.accounts.filter(a => a.id !== action.id) };

    case 'SET_BUDGET':
      return { ...state, budgets: { ...state.budgets, [action.month]: action.categories } };

    case 'ADD_GOAL':
      return { ...state, goals: [{ id: uid(), ...action.payload }, ...state.goals] };
    case 'DELETE_GOAL':
      return { ...state, goals: state.goals.filter(g => g.id !== action.id) };

    case 'TAKE_SNAPSHOT':
      return { ...state, netWorthSnapshots: [...state.netWorthSnapshots, action.payload] };
    case 'ADD_PAST_ENTRY':
      return { ...state, netWorthSnapshots: [...state.netWorthSnapshots, action.payload].sort((a, b) => a.date.localeCompare(b.date)) };

    case 'SET_TARGET_ALLOCATION':
      return { ...state, targetAllocation: action.payload };

    case 'LOAD_DEMO':
      return { ...state, ...action.payload, user: { ...state.user, onboarded: true, signedIn: true } };

    case 'RESET_ALL':
      clearState();
      return { ...initialState };

    case 'HYDRATE':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    const saved = loadState();
    return saved ? { ...init, ...saved } : init;
  });

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', !!state.settings.darkMode);
  }, [state.settings.darkMode]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
