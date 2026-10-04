import type { Frequency } from "./types";

export const pad = (n: number) => String(n).padStart(2, "0");

export function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const today = () => ymd(new Date());
export const monthKey = (s: string) => s.slice(0, 7);

export function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function shiftMonth(key: string, n: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export function listMonths(from: string, to: string): string[] {
  const out: string[] = [];
  let k = from;
  while (k <= to && out.length < 600) {
    out.push(k);
    k = shiftMonth(k, 1);
  }
  return out;
}

export function monthStart(key: string) { return `${key}-01`; }
export function monthEnd(key: string) {
  const [y, m] = key.split("-").map(Number);
  return ymd(new Date(y, m, 0));
}

/** Whole months from date a to date b (can be negative). */
export function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth();
}

export function addPeriod(s: string, freq: Frequency): string {
  const d = parseDate(s);
  if (freq === "weekly") {
    d.setDate(d.getDate() + 7);
    return ymd(d);
  }
  const day = d.getDate();
  d.setDate(1);
  if (freq === "monthly") d.setMonth(d.getMonth() + 1);
  else d.setFullYear(d.getFullYear() + 1);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return ymd(d);
}
