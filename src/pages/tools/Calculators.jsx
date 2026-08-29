import { useState } from 'react';
import { PageHeader, Card, Field, inputClass, Tabs } from '../../components/UI';
import { formatINR } from '../../lib/format';

export default function Calculators() {
  const [tab, setTab] = useState('sip');

  return (
    <div>
      <PageHeader title="Calculators" subtitle="Quick financial math" />
      <Tabs
        tabs={[
          { value: 'sip', label: 'SIP' },
          { value: 'emi', label: 'EMI' },
          { value: 'inflation', label: 'Inflation' },
        ]}
        active={tab} onChange={setTab}
      />
      <div className="mt-5 max-w-lg">
        {tab === 'sip' && <SipCalc />}
        {tab === 'emi' && <EmiCalc />}
        {tab === 'inflation' && <InflationCalc />}
      </div>
    </div>
  );
}

function SipCalc() {
  const [amount, setAmount] = useState('10000');
  const [years, setYears] = useState('10');
  const [rate, setRate] = useState('12');

  const P = Number(amount) || 0;
  const n = (Number(years) || 0) * 12;
  const i = (Number(rate) || 0) / 100 / 12;
  const future = i > 0 ? P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i) : P * n;
  const invested = P * n;

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4">
        <Field label="Monthly Investment (₹)"><input className={inputClass} inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} /></Field>
        <Field label="Duration (years)"><input className={inputClass} inputMode="decimal" value={years} onChange={e => setYears(e.target.value)} /></Field>
        <Field label="Expected Return (% p.a.)"><input className={inputClass} inputMode="decimal" value={rate} onChange={e => setRate(e.target.value)} /></Field>
      </div>
      <div className="mt-6 pt-5 border-t border-[var(--color-line)] grid grid-cols-2 gap-4">
        <div>
          <div className="text-[11px] text-[var(--color-ink-faint)]">INVESTED</div>
          <div className="font-mono-num text-[18px] text-[var(--color-ink)] mt-0.5">{formatINR(invested)}</div>
        </div>
        <div>
          <div className="text-[11px] text-[var(--color-ink-faint)]">EXPECTED VALUE</div>
          <div className="font-mono-num text-[18px] text-[var(--color-forest)] mt-0.5">{formatINR(future)}</div>
        </div>
      </div>
    </Card>
  );
}

function EmiCalc() {
  const [principal, setPrincipal] = useState('2500000');
  const [rate, setRate] = useState('8.5');
  const [years, setYears] = useState('20');

  const P = Number(principal) || 0;
  const r = (Number(rate) || 0) / 12 / 100;
  const n = (Number(years) || 0) * 12;
  const emi = r > 0 ? (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : P / n;
  const totalPayment = emi * n;
  const totalInterest = totalPayment - P;

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4">
        <Field label="Loan Amount (₹)"><input className={inputClass} inputMode="decimal" value={principal} onChange={e => setPrincipal(e.target.value)} /></Field>
        <Field label="Interest Rate (% p.a.)"><input className={inputClass} inputMode="decimal" value={rate} onChange={e => setRate(e.target.value)} /></Field>
        <Field label="Tenure (years)"><input className={inputClass} inputMode="decimal" value={years} onChange={e => setYears(e.target.value)} /></Field>
      </div>
      <div className="mt-6 pt-5 border-t border-[var(--color-line)] grid grid-cols-3 gap-4">
        <div>
          <div className="text-[11px] text-[var(--color-ink-faint)]">MONTHLY EMI</div>
          <div className="font-mono-num text-[16px] text-[var(--color-ink)] mt-0.5">{formatINR(emi || 0)}</div>
        </div>
        <div>
          <div className="text-[11px] text-[var(--color-ink-faint)]">TOTAL INTEREST</div>
          <div className="font-mono-num text-[16px] text-[var(--color-clay)] mt-0.5">{formatINR(totalInterest || 0)}</div>
        </div>
        <div>
          <div className="text-[11px] text-[var(--color-ink-faint)]">TOTAL PAYMENT</div>
          <div className="font-mono-num text-[16px] text-[var(--color-ink)] mt-0.5">{formatINR(totalPayment || 0)}</div>
        </div>
      </div>
    </Card>
  );
}

function InflationCalc() {
  const [amount, setAmount] = useState('50000');
  const [years, setYears] = useState('15');
  const [rate, setRate] = useState('6');

  const future = (Number(amount) || 0) * Math.pow(1 + (Number(rate) || 0) / 100, Number(years) || 0);

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4">
        <Field label="Current Cost (₹)"><input className={inputClass} inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} /></Field>
        <Field label="Years From Now"><input className={inputClass} inputMode="decimal" value={years} onChange={e => setYears(e.target.value)} /></Field>
        <Field label="Inflation Rate (% p.a.)"><input className={inputClass} inputMode="decimal" value={rate} onChange={e => setRate(e.target.value)} /></Field>
      </div>
      <div className="mt-6 pt-5 border-t border-[var(--color-line)]">
        <div className="text-[11px] text-[var(--color-ink-faint)]">FUTURE COST</div>
        <div className="font-mono-num text-[22px] text-[var(--color-ink)] mt-0.5">{formatINR(future)}</div>
      </div>
    </Card>
  );
}
