import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useStore } from '../lib/store';

export default function AppShell() {
  const { state } = useStore();
  const [open, setOpen] = useState(false);

  if (!state.user.signedIn) return <Navigate to="/signin" replace />;
  if (!state.user.onboarded) return <Navigate to="/onboarding/welcome" replace />;

  return (
    <div className="min-h-screen flex bg-[var(--color-cream)]">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="flex-1 px-5 md:px-8 pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
