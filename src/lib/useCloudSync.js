import { useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, cloudEnabled } from './firebase';
import { useStore } from './store';

const SYNCED_KEYS = [
  'profile', 'assets', 'liabilities', 'transactions', 'budgets',
  'accounts', 'goals', 'netWorthSnapshots', 'targetAllocation', 'settings',
];

function pickSynced(state) {
  const out = {};
  for (const k of SYNCED_KEYS) out[k] = state[k];
  out.onboarded = !!state.user.onboarded;
  return out;
}

export function useCloudSync() {
  const { state, dispatch } = useStore();
  const lastPushed = useRef(null);
  const lastReceived = useRef(null);
  const unsubDoc = useRef(null);
  const uidRef = useRef(null);

  // Auth listener — drives sign-in state and (dis)connects the Firestore listener.
  useEffect(() => {
    if (!cloudEnabled) return;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubDoc.current) { unsubDoc.current(); unsubDoc.current = null; }

      if (user) {
        uidRef.current = user.uid;
        dispatch({
          type: 'SIGN_IN',
          name: user.displayName || state.user.name || user.email?.split('@')[0],
          email: user.email || '',
          uid: user.uid,
          photoURL: user.photoURL || '',
        });

        const ref = doc(db, 'users', user.uid);
        unsubDoc.current = onSnapshot(ref, (snap) => {
          if (!snap.exists()) return; // first-ever sign-in on this account — nothing to pull yet
          const data = snap.data();
          const json = JSON.stringify(data);
          if (json === lastPushed.current) return; // this is our own write echoing back
          lastReceived.current = json;
          const { onboarded, ...rest } = data;
          dispatch({ type: 'HYDRATE', payload: rest });
          if (onboarded) dispatch({ type: 'COMPLETE_ONBOARDING' });
        }, (err) => {
          console.error('FinBoom cloud sync (read) failed:', err);
        });
      } else {
        uidRef.current = null;
      }
    });
    return () => unsubAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push local changes up, debounced, whenever signed in.
  useEffect(() => {
    if (!cloudEnabled || !uidRef.current || !state.user.signedIn) return;
    const payload = pickSynced(state);
    const json = JSON.stringify(payload);
    if (json === lastReceived.current || json === lastPushed.current) return;

    const t = setTimeout(() => {
      const ref = doc(db, 'users', uidRef.current);
      lastPushed.current = json;
      setDoc(ref, { ...payload, updatedAt: serverTimestamp() }, { merge: false }).catch((err) => {
        console.error('FinBoom cloud sync (write) failed:', err);
      });
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
}

export async function cloudSignOut() {
  if (cloudEnabled) {
    try { await fbSignOut(auth); } catch { /* ignore */ }
  }
}
