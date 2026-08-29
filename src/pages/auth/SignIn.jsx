import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Eye, EyeOff, CloudOff } from 'lucide-react';
import {
  signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, updateProfile,
} from 'firebase/auth';
import { useStore } from '../../lib/store';
import { auth, googleProvider, cloudEnabled } from '../../lib/firebase';
import { inputClass, Field } from '../../components/UI';

export default function SignIn() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin');
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (state.user.signedIn) {
    return <Navigate to={state.user.onboarded ? '/app/overview' : '/onboarding/welcome'} replace />;
  }

  function goNext() {
    // onAuthStateChanged (useCloudSync) will have already dispatched SIGN_IN and
    // hydrated onboarded status from Firestore by the time this resolves for
    // returning users; for brand-new sign-ins state.user.onboarded is still false.
    navigate(state.user.onboarded ? '/app/overview' : '/onboarding/welcome');
  }

  async function continueWithGoogle() {
    setError('');
    if (!cloudEnabled) {
      dispatch({ type: 'SIGN_IN', name: 'Logeshkumar M', email: 'logesh@example.com' });
      navigate('/onboarding/welcome');
      return;
    }
    setBusy(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      dispatch({ type: 'SIGN_IN', name: cred.user.displayName, email: cred.user.email, uid: cred.user.uid, photoURL: cred.user.photoURL });
      goNext();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!cloudEnabled) {
      dispatch({ type: 'SIGN_IN', name: mode === 'signup' ? (name || email.split('@')[0]) : undefined, email });
      navigate(state.user.onboarded ? '/app/overview' : '/onboarding/welcome');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name) await updateProfile(cred.user, { displayName: name });
        dispatch({ type: 'SIGN_IN', name: name || email.split('@')[0], email, uid: cred.user.uid });
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        dispatch({ type: 'SIGN_IN', name: cred.user.displayName, email: cred.user.email, uid: cred.user.uid, photoURL: cred.user.photoURL });
      }
      goNext();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function forgotPassword() {
    if (!email) { setError('Enter your email above first.'); return; }
    if (!cloudEnabled) { setError('Password reset needs cloud sync configured.'); return; }
    try {
      await sendPasswordResetEmail(auth, email);
      setError('Password reset email sent.');
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-cream)] px-4">
      <div className="w-full max-w-[384px] animate-in">
        <div className="text-center mb-8">
          <h1 className="font-display text-[32px] text-[var(--color-ink)]">FinBoom</h1>
          <p className="text-[14px] text-[var(--color-ink-soft)] mt-1">Know your true wealth at a glance</p>
          {!cloudEnabled && (
            <div className="flex items-center justify-center gap-1.5 text-[11.5px] text-[var(--color-gold)] bg-[var(--color-gold-soft)] rounded-full px-3 py-1 mt-3 w-fit mx-auto">
              <CloudOff size={12} /> Cloud sync not configured — running local-only
            </div>
          )}
        </div>

        <button
          onClick={continueWithGoogle}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2.5 border border-[var(--color-line)] bg-[var(--color-paper)] rounded-lg py-2.5 text-[14px] font-medium text-[var(--color-ink)] hover:bg-black/[0.02] transition-colors disabled:opacity-50"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-[var(--color-line)]" />
          <span className="text-[12px] text-[var(--color-ink-faint)]">or use email</span>
          <div className="h-px flex-1 bg-[var(--color-line)]" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'signup' && (
            <Field label="Name">
              <input className={inputClass} placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
            </Field>
          )}
          <Field label="Email">
            <input type="email" required className={inputClass} placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </Field>
          <Field label="Password">
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                minLength={cloudEnabled ? 6 : undefined}
                className={inputClass + ' pr-10'}
                placeholder="Your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)]">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>

          {error && <p className="text-[12.5px] text-[var(--color-clay)] -mt-1">{error}</p>}

          {mode === 'signin' && (
            <div className="text-right -mt-2">
              <button type="button" onClick={forgotPassword} className="text-[12.5px] text-[var(--color-forest)] hover:underline">Forgot password?</button>
            </div>
          )}

          <button type="submit" disabled={busy} className="w-full bg-[var(--color-forest)] text-white rounded-lg py-2.5 text-[14px] font-medium hover:bg-[var(--color-forest-deep)] transition-colors disabled:opacity-50">
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-[13px] text-[var(--color-ink-soft)] mt-5">
          {mode === 'signin' ? (
            <>No account yet? <button className="text-[var(--color-forest)] font-medium hover:underline" onClick={() => setMode('signup')}>Create one</button></>
          ) : (
            <>Already have an account? <button className="text-[var(--color-forest)] font-medium hover:underline" onClick={() => setMode('signin')}>Sign in</button></>
          )}
        </p>

        <p className="text-center text-[11.5px] text-[var(--color-ink-faint)] mt-6 leading-relaxed">
          By continuing, you agree to our <span className="underline">Terms of Service</span> and <span className="underline">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}

function friendlyError(err) {
  const code = err?.code || '';
  if (code.includes('popup-closed')) return 'Google sign-in was closed before finishing.';
  if (code.includes('wrong-password') || code.includes('invalid-credential')) return 'Incorrect email or password.';
  if (code.includes('user-not-found')) return 'No account found for that email.';
  if (code.includes('email-already-in-use')) return 'An account already exists for that email.';
  if (code.includes('weak-password')) return 'Password should be at least 6 characters.';
  if (code.includes('network-request-failed')) return 'Network error — check your connection and try again.';
  return err?.message || 'Something went wrong. Please try again.';
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.3C29.3 35.4 26.8 36 24 36c-5.2 0-9.6-3-11.4-7.4l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.2 5.3C40.8 36.3 44 30.8 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  );
}
