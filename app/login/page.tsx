"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signInWithPopup,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";

function friendly(code: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found": return "Wrong email or password.";
    case "auth/email-already-in-use": return "That email already has an account. Try signing in.";
    case "auth/weak-password": return "Password must be at least 8 characters.";
    case "auth/popup-closed-by-user": return "Google sign-in was cancelled.";
    case "auth/unauthorized-domain": return "This website address isn't allowed yet. Add it under Firebase → Authentication → Settings → Authorized domains.";
    case "auth/operation-not-allowed": return "This sign-in method isn't switched on in Firebase yet.";
    default: return "Something went wrong. Please try again.";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const auth = getFirebaseAuth();
      if (mode === "signup") await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setMsg(friendly((err as { code?: string }).code ?? ""));
    }
    setBusy(false);
  }

  async function google() {
    setMsg(null);
    try {
      await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
    } catch (err) {
      setMsg(friendly((err as { code?: string }).code ?? ""));
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-4">
      <div className="text-center">
        <h1 className="font-serif text-3xl font-semibold">NetWorth</h1>
        <p className="mt-1 text-sm text-black/60">Know your true wealth at a glance</p>
      </div>

      <div className="card space-y-4">
        <button className="btn-ghost w-full" onClick={google}>Continue with Google</button>
        <div className="text-center text-xs text-black/40">or use email</div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" required className="input" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="label" htmlFor="pw">Password</label>
            <input id="pw" type="password" required minLength={8} className="input" value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
          </div>
          {msg && <p className="text-sm text-loss">{msg}</p>}
          <button className="btn w-full" disabled={busy}>
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <p className="text-center text-sm">
          {mode === "signin" ? "New here? " : "Already have an account? "}
          <button className="font-medium text-brand underline"
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMsg(null); }}>
            {mode === "signin" ? "Create account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
