import type { UserDoc } from "./types";

export const DEFAULT_EXPENSE = [
  "Food & Dining", "Groceries", "Shopping", "Transport", "Bills & Utilities", "Rent",
  "Entertainment", "Health", "Education", "Travel", "Insurance", "EMI / Loan",
  "Personal Care", "Gifts & Donations", "Investment", "Credit Card Payment",
  "Cash Withdrawal", "Other",
];

export const DEFAULT_INCOME = [
  "Salary", "Business", "Interest", "Dividends", "Rental", "Refund", "Gift", "Other Income",
];

/** Not counted as spending in budgets and insights unless the user changes this. */
export const DEFAULT_EXCLUDED = ["Investment", "Credit Card Payment", "Cash Withdrawal"];

export function categoriesFor(type: "expense" | "income", u: UserDoc): string[] {
  const hidden = u.hiddenCategories ?? [];
  const base = type === "expense" ? DEFAULT_EXPENSE : DEFAULT_INCOME;
  const custom = (type === "expense" ? u.customExpense : u.customIncome) ?? [];
  return [...base, ...custom].filter((c) => !hidden.includes(c));
}

export function excludedFor(u: UserDoc): string[] {
  return u.excluded ?? DEFAULT_EXCLUDED;
}
