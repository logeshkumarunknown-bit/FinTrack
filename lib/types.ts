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
  emi?: number | null;
  start_date?: string | null;
  due_date?: string | null;
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

export type TxnType = "expense" | "income" | "transfer";

export interface Account {
  id: string;
  name: string;
  type: string;
  currency: string;
  opening_balance: number;
  created_at: number;
}

export const ACCOUNT_TYPES = ["Savings", "Current", "Cash", "Credit Card", "Wallet", "Other"];

export interface Txn {
  id: string;
  type: TxnType;
  date: string; // YYYY-MM-DD
  amount: number;
  currency: string;
  category: string;
  account_id: string | null;
  to_account_id?: string | null;
  note: string | null;
  recurring_id?: string | null;
  created_at: number;
}

export type Frequency = "weekly" | "monthly" | "yearly";

export interface Recurring {
  id: string;
  type: "expense" | "income";
  amount: number;
  currency: string;
  category: string;
  account_id: string | null;
  note: string | null;
  frequency: Frequency;
  next_date: string;
  active: boolean;
  created_at: number;
}

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  currency: string;
  target_date: string;
  track: "networth" | "linked";
  linked_ids: string[]; // "h:<holdingId>" or "a:<accountId>"
  created_at: number;
}

export interface Rule {
  id: string;
  keyword: string;
  category: string;
  created_at: number;
}

export interface Budget {
  id: string; // YYYY-MM
  items: Record<string, number>;
}

export interface Profile {
  age?: number | null;
  dependents?: number | null;
  monthly_income?: number | null;
  monthly_expense?: number | null;
  term_cover?: number | null;
  health_cover?: number | null;
}

export interface UserDoc {
  baseCurrency?: string;
  onboarded?: boolean;
  profile?: Profile;
  customExpense?: string[];
  customIncome?: string[];
  hiddenCategories?: string[];
  excluded?: string[];
}
