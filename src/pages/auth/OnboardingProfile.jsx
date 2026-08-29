import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Field, inputClass } from '../../components/UI';
import OnboardingShell from './OnboardingShell';

export default function OnboardingProfile() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState(state.profile);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function submit(skip) {
    if (!skip) dispatch({ type: 'UPDATE_PROFILE', payload: form });
    navigate('/onboarding/assets');
  }

  return (
    <OnboardingShell step={1}>
      <div className="text-center mb-6">
        <h2 className="font-display text-[20px] text-[var(--color-ink)]">Your Financial Profile</h2>
        <p className="text-[13px] text-[var(--color-ink-soft)] mt-1.5">Optional — helps us provide personalised financial health insights.</p>
      </div>

      <div className="flex flex-col gap-4">
        <Field label="Age">
          <input className={inputClass} placeholder="e.g. 30" inputMode="numeric" value={form.age} onChange={e => set('age', e.target.value)} />
        </Field>
        <Field label="Monthly Income (₹ INR)">
          <input className={inputClass} placeholder="e.g. 1,00,000" inputMode="numeric" value={form.monthlyIncome} onChange={e => set('monthlyIncome', e.target.value)} />
        </Field>
        <Field label="Avg. Monthly Family Expense (₹ INR)">
          <input className={inputClass} placeholder="e.g. 50,000" inputMode="numeric" value={form.monthlyExpense} onChange={e => set('monthlyExpense', e.target.value)} />
        </Field>
        <Field label="Monthly Savings / Investments (₹ INR)">
          <input className={inputClass} placeholder="e.g. 30,000" inputMode="numeric" value={form.monthlySavings} onChange={e => set('monthlySavings', e.target.value)} />
        </Field>
      </div>

      <div className="flex items-center justify-between mt-7">
        <button onClick={() => navigate('/onboarding/welcome')} className="text-[13.5px] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">Back</button>
        <div className="flex items-center gap-2.5">
          <button onClick={() => submit(true)} className="px-4 py-2.5 rounded-lg text-[13.5px] border border-[var(--color-line)] text-[var(--color-ink)] hover:bg-black/[0.03]">Skip</button>
          <button onClick={() => submit(false)} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-[13.5px] font-medium bg-[var(--color-forest)] text-white hover:bg-[var(--color-forest-deep)]">
            Continue <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </OnboardingShell>
  );
}
