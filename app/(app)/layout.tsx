"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useUser } from "@/components/UserProvider";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { DataProvider } from "@/components/DataProvider";
import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { data, loading: userLoading, loadError } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (user && !userLoading && !loadError && !data.onboarded) router.replace("/onboarding");
  }, [user, userLoading, loadError, data.onboarded, router]);

  if (loading || !user || userLoading) {
    return <p className="p-8 text-sm text-black/60">Loading…</p>;
  }
  if (loadError) {
    return (
      <p className="m-8 rounded-lg bg-loss/10 p-4 text-sm text-loss">
        Couldn&apos;t load your data: {loadError}. Check your internet and refresh.
      </p>
    );
  }
  if (!data.onboarded) return <p className="p-8 text-sm text-black/60">Loading…</p>;

  return (
    <CurrencyProvider>
      <DataProvider>
        <div className="md:flex">
          <Sidebar />
          <main className="mx-auto w-full max-w-5xl flex-1 p-4 md:p-8">
            <Suspense fallback={<p className="text-sm text-black/60">Loading…</p>}>{children}</Suspense>
          </main>
        </div>
      </DataProvider>
    </CurrencyProvider>
  );
}
