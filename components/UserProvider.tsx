"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import type { UserDoc } from "@/lib/types";

interface Ctx {
  data: UserDoc;
  loading: boolean;
  loadError: string | null;
  saveUser: (patch: Partial<UserDoc>) => Promise<void>;
}

const UserContext = createContext<Ctx | null>(null);

export function useUser() {
  const c = useContext(UserContext);
  if (!c) throw new Error("useUser must be used inside UserProvider");
  return c;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<UserDoc>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setData({});
      setLoading(false);
      return;
    }
    setLoading(true);
    getDoc(doc(getDb(), "users", user.uid))
      .then((s) => {
        setData((s.data() as UserDoc) ?? {});
        setLoadError(null);
      })
      .catch((e) => setLoadError((e as Error).message))
      .finally(() => setLoading(false));
  }, [user]);

  const saveUser = useCallback(
    async (patch: Partial<UserDoc>) => {
      if (!user) return;
      if (loadError) throw new Error("Your settings could not be loaded, so changes are not saved. Refresh and try again.");
      setData((d) => ({ ...d, ...patch }));
      const clean = JSON.parse(JSON.stringify(patch));
      await setDoc(doc(getDb(), "users", user.uid), clean, { merge: true });
    },
    [user, loadError]
  );

  return <UserContext.Provider value={{ data, loading, loadError, saveUser }}>{children}</UserContext.Provider>;
}
