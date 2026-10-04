import type { Account, Profile, Txn } from "./types";

export type Conv = (amount: number, from: string, to: string) => number;

/** Balance in the account's own currency: opening balance + all its transactions. */
export function accountBalance(a: Account, txns: Txn[], conv: Conv): number {
  let b = Number(a.opening_balance) || 0;
  for (const t of txns) {
    const amt = Number(t.amount) || 0;
    if (t.type === "transfer") {
      if (t.account_id === a.id) b -= conv(amt, t.currency, a.currency);
      if (t.to_account_id === a.id) b += conv(amt, t.currency, a.currency);
    } else if (t.account_id === a.id) {
      const v = conv(amt, t.currency, a.currency);
      b += t.type === "income" ? v : -v;
    }
  }
  return b;
}

export interface Summary {
  income: number;
  expense: number;
  invested: number;
  byCategory: Record<string, number>;
  skipped: number; // transactions that couldn't be converted (missing rate)
}

export function summarize(
  txns: Txn[], from: string, to: string, excluded: string[],
  toBase: (amount: number, cur: string) => number
): Summary {
  const s: Summary = { income: 0, expense: 0, invested: 0, byCategory: {}, skipped: 0 };
  for (const t of txns) {
    if (t.type === "transfer" || t.date < from || t.date > to) continue;
    const v = toBase(Number(t.amount), t.currency);
    if (!Number.isFinite(v)) { s.skipped++; continue; }
    if (t.type === "income") {
      s.income += v;
    } else {
      if (t.category === "Investment") s.invested += v;
      if (!excluded.includes(t.category)) {
        s.expense += v;
        s.byCategory[t.category] = (s.byCategory[t.category] ?? 0) + v;
      }
    }
  }
  return s;
}

/* ---------- Financial health (simple rules of thumb, not advice) ---------- */

export const clamp10 = (x: number) => Math.max(0, Math.min(10, x));

/** Years until net worth reaches 25x annual expenses, saving `monthlySaving` at a 5% real return. */
export function yearsToFI(netWorth: number, annualExpense: number, monthlySaving: number): number | null {
  const target = 25 * annualExpense;
  if (target <= 0) return null;
  if (netWorth >= target) return 0;
  if (monthlySaving <= 0) return null;
  const r = 0.05 / 12;
  let v = netWorth;
  for (let m = 1; m <= 12 * 60; m++) {
    v = v * (1 + r) + monthlySaving;
    if (v >= target) return m / 12;
  }
  return null;
}

export interface HealthInput {
  profile: Profile;
  netWorth: number;
  liquid: number; // cash + savings in the same currency as the profile
}

export interface HealthPart {
  key: string;
  label: string;
  score: number | null;
  detail: string;
}

export function healthScore(i: HealthInput): { overall: number | null; parts: HealthPart[] } {
  const p = i.profile;
  const inc = Number(p.monthly_income) || 0;
  const exp = Number(p.monthly_expense) || 0;
  const dep = Number(p.dependents) || 0;
  const parts: HealthPart[] = [];

  if (exp > 0) {
    const months = i.liquid / exp;
    parts.push({
      key: "emergency", label: "Emergency fund",
      score: clamp10((months / 6) * 10),
      detail: `${months.toFixed(1)} months of expenses in cash & savings (aim for 6)`,
    });
  } else parts.push({ key: "emergency", label: "Emergency fund", score: null, detail: "Add your monthly expenses" });

  if (inc > 0 && exp > 0) {
    const rate = (inc - exp) / inc;
    parts.push({
      key: "savings", label: "Savings rate",
      score: clamp10((rate / 0.3) * 10),
      detail: `You save ${(rate * 100).toFixed(0)}% of income (aim for 30%)`,
    });
    const y = yearsToFI(i.netWorth, exp * 12, inc - exp);
    parts.push({
      key: "fi", label: "Financial independence",
      score: y == null ? 0 : clamp10(10 - y / 3),
      detail: y == null ? "Not reachable at the current savings" : y === 0 ? "You already have 25x annual expenses" : `About ${y.toFixed(0)} years to 25x annual expenses`,
    });
  } else {
    parts.push({ key: "savings", label: "Savings rate", score: null, detail: "Add income and expenses" });
    parts.push({ key: "fi", label: "Financial independence", score: null, detail: "Add income and expenses" });
  }

  if (exp > 0 && p.term_cover != null) {
    const need = dep > 0 ? Math.max(0, 25 * exp * 12 - i.netWorth) : 0;
    const have = Number(p.term_cover) || 0;
    parts.push({
      key: "term", label: "Term life cover",
      score: need === 0 ? 10 : clamp10((have / need) * 10),
      detail: need === 0 ? "No cover gap by this rule" : `Cover ${have.toLocaleString("en-IN")} vs about ${Math.round(need).toLocaleString("en-IN")} needed`,
    });
  } else parts.push({ key: "term", label: "Term life cover", score: null, detail: "Add expenses and your term cover" });

  if (p.health_cover != null) {
    const min = 500000 * (1 + dep);
    const good = 1000000 * (1 + dep);
    const have = Number(p.health_cover) || 0;
    parts.push({
      key: "health", label: "Health cover",
      score: have >= good ? 10 : have >= min ? 7 : clamp10((have / min) * 7),
      detail: `Cover ${have.toLocaleString("en-IN")}; minimum ${min.toLocaleString("en-IN")}, good ${good.toLocaleString("en-IN")}`,
    });
  } else parts.push({ key: "health", label: "Health cover", score: null, detail: "Add your health cover" });

  const have = parts.filter((x) => x.score != null) as (HealthPart & { score: number })[];
  const overall = have.length ? have.reduce((s, x) => s + x.score, 0) / have.length : null;
  return { overall, parts };
}

/* ---------- Calculators ---------- */

export function sipFV(monthly: number, annualRate: number, years: number) {
  const n = Math.round(years * 12);
  const r = annualRate / 12 / 100;
  const invested = monthly * n;
  const fv = r === 0 ? invested : monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  return { invested, fv };
}

export function lumpsumFV(principal: number, annualRate: number, years: number) {
  return principal * Math.pow(1 + annualRate / 100, years);
}

export function emi(principal: number, annualRate: number, years: number) {
  const n = Math.round(years * 12);
  const r = annualRate / 12 / 100;
  if (n <= 0) return { emi: 0, total: 0, interest: 0 };
  const e = r === 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return { emi: e, total: e * n, interest: e * n - principal };
}

export function inflate(amount: number, ratePct: number, years: number) {
  return amount * Math.pow(1 + ratePct / 100, years);
}
