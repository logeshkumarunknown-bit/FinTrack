export type Kind = "asset" | "liability";

export interface Holding {
  id: string;
  kind: Kind;
  name: string;
  category: string;
  currency: string;
  amount: number;
  interest_rate: number | null;
  notes: string | null;
  created_at: number;
}

export interface Snapshot {
  id: string;
  taken_on: string;
  base_currency: string;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
}

export const ASSET_CATEGORIES = [
  "Cash & Savings", "Bank FD / RD", "Stocks", "Mutual Funds", "EPF / PPF / NPS",
  "Real Estate", "Gold & Silver", "Crypto", "Business / Alternatives", "Other",
];

export const LIABILITY_CATEGORIES = [
  "Home Loan", "Car Loan", "Personal Loan", "Education Loan",
  "Credit Card", "Other",
];
