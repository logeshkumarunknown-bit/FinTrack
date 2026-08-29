import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './lib/store';
import { useCloudSync } from './lib/useCloudSync';
import AppShell from './components/AppShell';

import SignIn from './pages/auth/SignIn';
import OnboardingWelcome from './pages/auth/OnboardingWelcome';
import OnboardingProfile from './pages/auth/OnboardingProfile';
import OnboardingAssets from './pages/auth/OnboardingAssets';
import OnboardingDone from './pages/auth/OnboardingDone';

import Overview from './pages/Overview';
import Wealth from './pages/wealth/Wealth';
import Money from './pages/money/Money';
import EssentialsSection from './pages/essentials/EssentialsSection';

import Import from './pages/tools/Import';
import Calculators from './pages/tools/Calculators';
import WhatsNew from './pages/tools/WhatsNew';
import SettingsPage from './pages/tools/Settings';
import Install from './pages/tools/Install';
import Feedback from './pages/tools/Feedback';

export default function App() {
  return (
    <StoreProvider>
      <CloudSync />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/signin" replace />} />
          <Route path="/signin" element={<SignIn />} />

          <Route path="/onboarding/welcome" element={<OnboardingWelcome />} />
          <Route path="/onboarding/profile" element={<OnboardingProfile />} />
          <Route path="/onboarding/assets" element={<OnboardingAssets />} />
          <Route path="/onboarding/done" element={<OnboardingDone />} />

          <Route path="/app" element={<AppShell />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<Overview />} />
            <Route path="wealth" element={<Wealth />} />
            <Route path="money" element={<Money />} />
            <Route path="essentials" element={<EssentialsSection />} />
            <Route path="import" element={<Import />} />
            <Route path="calculators" element={<Calculators />} />
            <Route path="whats-new" element={<WhatsNew />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="install" element={<Install />} />
            <Route path="feedback" element={<Feedback />} />
          </Route>

          <Route path="*" element={<Navigate to="/signin" replace />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}

function CloudSync() {
  useCloudSync();
  return null;
}
