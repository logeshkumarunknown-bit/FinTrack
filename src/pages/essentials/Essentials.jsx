import { useState } from 'react';
import { ChevronDown, ShieldCheck, Flame, ShieldPlus, HeartPulse, Scale3D, Check, Pencil } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Card, Field, inputClass, Badge, ProgressBar } from '../../components/UI';
import { formatINR } from '../../lib/format';
import { totalAssets, totalLiabilities, netWorth, idealTermCover, healthScore } from '../../lib/calc';

export default function Essentials() {
  const { state, dispatch } = useStore();
  const hidden = state.settings.hideBalances;
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState(state.profile);
  const [termCover, setTermCover] = useState('');
  const [healthCover, setHealthCover] = useState('');
  const [dependents, setDependents] = useState(0);

  const assets = totalAssets(state.assets);
  const liabilities = totalLiabilities(state.liabilities);
  const nw = netWorth(state.assets, state.liabilities);

  const liquidAssets = state.assets.filter(a => a.type === 'Cash & Savings').reduce((s, a) => s + (Number(a.qty) || 0) * (Number(a.currentPrice ?? a.avgCost) || 0), 0);
  const monthlyExpense = Number(state.profile.monthlyExpense) || 0;
  const monthlyIncome = Number(state.profile.monthlyIncome) || 0;
  const monthlySavings = Number(state.profile.monthlySavings) || (monthlyIncome - monthlyExpense);
  const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;
  const runwayMonths = monthlyExpense > 0 ? liquidAssets / monthlyExpense : 0;
  const idealTerm = idealTermCover(monthlyExpense * 12, nw);
  const debtRatio = assets > 0 ? liabilities / assets : 0;

  const score = healthScore({
    savingsRate, emergencyMonths: runwayMonths,
    hasTermCover: Number(termCover) > 0, hasHealthCover: Number(healthCover) > 0, debtRatio,
  });

  function saveProfile() {
    dispatch({ type: 'UPDATE_PROFILE', payload: profile });
    setProfileOpen(false);
  }

  return (
    <div className="pt-6">
      <div className="pb-5">
        <h1 className="font-display text-[28px] text-[var(--color-ink)]">Essentials</h1>
        <p className="text-[13.5px] text-[var(--color-ink-soft)] mt-1">Financial health check</p>
      </div>

      <Card className="mb-4">
        <button onClick={() => setProfileOpen(v => !v)} className="w-full flex items-center justify-between px-5 py-3.5">
          <span className="flex items-center gap-2 text-[14px] font-medium text-[var(--color-ink)]">Financial Profile</span>
          <ChevronDown size={16} className={`text-[var(--color-ink-faint)] transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
        </button>
        {profileOpen && (
          <div className="px-5 pb-5 border-t border-[var(--color-line)] pt-4 grid sm:grid-cols-2 gap-4">
            <Field label="Age"><input className={inputClass} value={profile.age} onChange={e => setProfile(p => ({ ...p, age: e.target.value }))} /></Field>
            <Field label="Monthly Income (₹)"><input className={inputClass} value={profile.monthlyIncome} onChange={e => setProfile(p => ({ ...p, monthlyIncome: e.target.value }))} /></Field>
            <Field label="Avg. Monthly Expense (₹)"><input className={inputClass} value={profile.monthlyExpense} onChange={e => setProfile(p => ({ ...p, monthlyExpense: e.target.value }))} /></Field>
            <Field label="Monthly Savings (₹)"><input className={inputClass} value={profile.monthlySavings} onChange={e => setProfile(p => ({ ...p, monthlySavings: e.target.value }))} /></Field>
            <button onClick={saveProfile} className="sm:col-span-2 text-left text-[13px] text-[var(--color-forest)] font-medium">Save profile</button>
          </div>
        )}
      </Card>

      <Card className="p-6 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="flex items-baseline gap-1.5">
            <span className="font-display text-[26px] text-[var(--color-gold)]">{score}</span>
            <span className="text-[13px] text-[var(--color-ink-faint)]">/10</span>
          </span>
          <span className="text-[11px] font-semibold text-[var(--color-ink-faint)]">{score >= 7 ? 'On Track' : score >= 4 ? 'Getting There' : 'Needs Work'}</span>
        </div>
        <div className="text-[10px] font-semibold tracking-[0.1em] text-[var(--color-ink-faint)] mb-1">OVERALL HEALTH SCORE</div>
        <ProgressBar value={score} max={10} barClassName="bg-[var(--color-gold)]" />
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <HealthCard
          icon={ShieldCheck} title="Emergency Fund"
          badge={runwayMonths >= 3 ? { tone: 'good', text: 'Good' } : { tone: 'risky', text: 'Risky' }}
        >
          <Metric label="LIQUID ASSETS" hint="Cash & Savings · FD & RD · Liquid / Debt Funds" value={formatINR(liquidAssets, { hidden })} />
          <div className="mt-4">
            <div className="flex justify-between text-[11px] text-[var(--color-ink-faint)] mb-1"><span>RUNWAY</span><span>{runwayMonths.toFixed(0)} months</span></div>
            <ProgressBar value={Math.min(runwayMonths, 12)} max={12} />
            <div className="flex justify-between text-[10px] text-[var(--color-ink-faint)] mt-1"><span>0</span><span>3m</span><span>6m</span><span>12m+</span></div>
          </div>
          <p className="text-[12.5px] text-[var(--color-ink-soft)] mt-3">Build at least 3 months of expenses in liquid savings</p>
        </HealthCard>

        <HealthCard icon={Flame} title="Savings Rate" badge={savingsRate >= 20 ? { tone: 'good', text: 'Good' } : { tone: 'warn', text: 'Fair' }}>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[28px] text-[var(--color-ink)]">{savingsRate.toFixed(0)}%</span>
            <span className="text-[12px] text-[var(--color-ink-soft)]">of income saved</span>
          </div>
          <p className="text-[11px] text-[var(--color-ink-faint)] mt-1">Based on your Financial Profile · actual savings may differ.</p>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Metric label="INCOME" value={formatINR(monthlyIncome, { compact: true, hidden })} />
            <Metric label="EXPENSE" value={formatINR(monthlyExpense, { compact: true, hidden })} />
          </div>
          <div className="mt-3"><ProgressBar value={savingsRate} max={80} /></div>
          <div className="flex justify-between px-1 text-[10px] text-[var(--color-ink-faint)] mt-1"><span>0%</span><span>20%</span><span>50%</span><span>80%+</span></div>
          <p className="text-[12.5px] text-[var(--color-ink-soft)] mt-3">{savingsRate >= 20 ? "Strong savings rate. You're on a solid path to financial independence." : 'Aim to save at least 20% of income for steady long-term growth.'}</p>
        </HealthCard>

        <HealthCard icon={ShieldPlus} title="Term Insurance" badge={Number(termCover) >= idealTerm && idealTerm > 0 ? { tone: 'good', text: 'Good' } : { tone: 'risky', text: 'Risky' }}>
          <div className="text-[11px] text-[var(--color-ink-faint)] mb-1.5">YOUR COVER</div>
          <CoverInput value={termCover} onChange={setTermCover} />
          <div className="flex justify-between text-[11px] text-[var(--color-ink-faint)] mt-4 mb-1"><span>IDEAL COVER</span><span className="text-[var(--color-ink)] font-mono-num">{formatINR(idealTerm, { compact: true, hidden })}</span></div>
          <ProgressBar value={Number(termCover)} max={Math.max(idealTerm, 1)} />
          <p className="text-[11px] text-[var(--color-ink-faint)] mt-1">Formula: 25 × Annual Expense − Net Worth = {formatINR(idealTerm, { compact: true, hidden })}</p>
          <p className="text-[12.5px] text-[var(--color-ink-soft)] mt-2">{Number(termCover) >= idealTerm && idealTerm > 0 ? 'Your term cover meets the recommended amount' : 'Your term cover is significantly below the recommended amount'}</p>
        </HealthCard>

        <HealthCard icon={HeartPulse} title="Health Insurance" badge={Number(healthCover) >= 500000 ? { tone: 'good', text: 'Good' } : { tone: 'risky', text: 'Risky' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] text-[var(--color-ink-faint)]">DEPENDENTS</span>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-[var(--color-ink)]">{dependents} people</span>
              <button onClick={() => setDependents(d => (d + 1) % 6)} className="p-1 text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"><Pencil size={12} /></button>
            </div>
          </div>
          <div className="text-[11px] text-[var(--color-ink-faint)] mb-1.5">YOUR COVER</div>
          <CoverInput value={healthCover} onChange={setHealthCover} />
          <div className="flex justify-between text-[11px] text-[var(--color-ink-faint)] mt-4 mb-1"><span>RECOMMENDED</span><span className="text-[var(--color-ink)]">Min ₹5L · Good ₹10L</span></div>
          <ProgressBar value={Number(healthCover)} max={1000000} />
          <p className="text-[12.5px] text-[var(--color-ink-soft)] mt-3">Minimum ₹5L private health cover is recommended</p>
        </HealthCard>

        <HealthCard icon={Scale3D} title="Debt Ratio" badge={debtRatio <= 0.3 ? { tone: 'good', text: 'Perfect' } : { tone: 'risky', text: 'High' }} full>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[28px] text-[var(--color-ink)]">{(debtRatio * 100).toFixed(0)}%</span>
            <span className="text-[12px] text-[var(--color-ink-soft)]">of assets are debt-funded</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Metric label="TOTAL ASSETS" value={formatINR(assets, { compact: true, hidden })} />
            <Metric label="TOTAL LIABILITIES" value={formatINR(liabilities, { compact: true, hidden })} />
          </div>
          <div className="mt-3"><ProgressBar value={debtRatio * 100} max={50} /></div>
          <div className="flex justify-between px-1 text-[10px] text-[var(--color-ink-faint)] mt-1"><span>0%</span><span>10%</span><span>30%</span><span>50%+</span></div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--color-line)]">
            <span className="text-[12.5px] font-medium text-[var(--color-ink)]">NET WORTH</span>
            <span className="font-mono-num text-[14px] text-[var(--color-ink)]">{formatINR(nw, { hidden })}</span>
          </div>
        </HealthCard>
      </div>
    </div>
  );
}

function HealthCard({ icon: Icon, title, badge, children, full }) {
  return (
    <Card className={`p-6 ${full ? 'md:col-span-2' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="flex items-center gap-2 text-[14.5px] font-medium text-[var(--color-ink)]"><Icon size={16} className="text-[var(--color-ink-soft)]" /> {title}</span>
        <Badge tone={badge.tone}>{badge.text}</Badge>
      </div>
      {children}
    </Card>
  );
}

function Metric({ label, value, hint }) {
  return (
    <div>
      <div className="text-[10.5px] text-[var(--color-ink-faint)] tracking-wide">{label}</div>
      {hint && <div className="text-[10.5px] text-[var(--color-ink-faint)]">{hint}</div>}
      <div className="font-mono-num text-[15px] text-[var(--color-ink)] mt-0.5">{value}</div>
    </div>
  );
}

function CoverInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <input className={inputClass + ' flex-1'} placeholder="Enter cover amount" inputMode="decimal" value={value} onChange={e => onChange(e.target.value)} />
      {Number(value) > 0 && <Check size={16} className="text-[var(--color-forest)] shrink-0" />}
    </div>
  );
}
