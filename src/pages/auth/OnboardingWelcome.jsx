import { useNavigate } from 'react-router-dom';
import { Sparkles, Layers, Globe2, ShieldCheck, ArrowRight } from 'lucide-react';
import OnboardingShell from './OnboardingShell';

export default function OnboardingWelcome() {
  const navigate = useNavigate();
  return (
    <OnboardingShell step={0}>
      <div className="flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-black/[0.04] flex items-center justify-center mb-5">
          <Sparkles size={22} className="text-[var(--color-forest)]" />
        </div>
        <h2 className="font-display text-[21px] text-[var(--color-ink)]">Welcome to FinBoom</h2>
        <p className="text-[13.5px] text-[var(--color-ink-soft)] mt-3 leading-relaxed max-w-[300px]">
          Your privacy-first net worth tracker. No broker connections, no third-party tracking. Just you and your data.
        </p>

        <div className="grid grid-cols-3 gap-2.5 mt-6 w-full">
          <Feature icon={Layers} label="Track assets & liabilities" />
          <Feature icon={Globe2} label="Multi-currency support" />
          <Feature icon={ShieldCheck} label="Private & secure" />
        </div>

        <button
          onClick={() => navigate('/onboarding/profile')}
          className="mt-7 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[var(--color-forest)] text-white px-6 py-2.5 rounded-lg text-[14px] font-medium hover:bg-[var(--color-forest-deep)] transition-colors"
        >
          Get Started <ArrowRight size={15} />
        </button>
      </div>
    </OnboardingShell>
  );
}

function Feature({ icon: Icon, label }) {
  return (
    <div className="bg-black/[0.025] rounded-lg px-2 py-3.5 flex flex-col items-center gap-1.5">
      <Icon size={16} className="text-[var(--color-forest)]" />
      <span className="text-[11px] leading-tight text-[var(--color-ink-soft)]">{label}</span>
    </div>
  );
}
