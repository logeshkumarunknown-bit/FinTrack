export const CURRENCIES = [
  "INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD",
  "JPY", "CHF", "SAR", "HKD", "NZD", "CNY", "MYR", "QAR", "KWD",
] as const;

/** Units of each currency per 1 USD (e.g. INR: 83.2). */
export type Rates = Record<string, number>;

export function convert(amount: number, from: string, to: string, rates: Rates): number {
  if (from === to) return amount;
  const f = rates[from];
  const t = rates[to];
  if (!f || !t) return NaN; // unknown rate: never silently treat as 1:1
  return (amount / f) * t;
}

export function formatMoney(amount: number, currency: string, hide = false): string {
  if (hide) return "••••";
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
