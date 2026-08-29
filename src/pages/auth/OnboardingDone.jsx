import { useNavigate } from 'react-router-dom';
import { PartyPopper, ArrowRight } from 'lucide-react';
import { useStore } from '../../lib/store';
import OnboardingShell from './OnboardingShell';

export default function OnboardingDone() {
  const { dispatch } = useStore();
  const navigate = useNavigate();

  function enter() {
    dispatch({ type: 'COMPLETE_ONBOARDING' });
    navigate('/app/overview');
  }

  return (
    <OnboardingShell step={3}>
      <div className="flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-[var(--color-forest-soft)] flex items-center justify-center mb-5">
          <PartyPopper size={22} className="text-[var(--color-forest)]" />
        </div>
        <h2 className="font-display text-[21px] text-[var(--color-ink)]">You're all set</h2>
        <p className="text-[13.5px] text-[var(--color-ink-soft)] mt-3 leading-relaxed max-w-[300px]">
          Your dashboard is ready. Add income, expenses and accounts any time — everything stays on this device.
        </p>
        <button
          onClick={enter}
          className="mt-7 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[var(--color-forest)] text-white px-6 py-2.5 rounded-lg text-[14px] font-medium hover:bg-[var(--color-forest-deep)] transition-colors"
        >
          Go to Dashboard <ArrowRight size={15} />
        </button>
      </div>
    </OnboardingShell>
  );
}
