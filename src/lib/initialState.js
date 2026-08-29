export const ASSET_TYPES = [
  'Equity', 'Debt', 'Real Estate', 'Commodities', 'Cash & Savings', 'Crypto', 'Alternatives', 'Other',
];

export const LIABILITY_TYPES = [
  'Home Loan', 'Personal Loan', 'Car Loan', 'Education Loan', 'Credit Card', 'Other',
];

export const EXPENSE_CATEGORIES = [
  'Housing & Rent', 'Food & Dining', 'Groceries', 'Transport', 'Healthcare', 'Education',
  'Insurance', 'EMI & Loans', 'Entertainment', 'Utilities', 'Shopping', 'Investment',
  'Travel & Vacations', 'Subscriptions', 'Personal Care', 'Credit Card Payment', 'Taxes',
  'Cash Withdrawal', 'Childcare', 'Other Expense',
];

export const ACCOUNT_TYPES = ['Bank Account', 'Credit Card', 'Cash', 'Wallet'];

export const initialState = {
  user: { name: '', email: '', uid: '', photoURL: '', onboarded: false, signedIn: false },
  onboarding: { step: 0 },
  settings: { darkMode: false, hideBalances: false },
  profile: { age: '', monthlyIncome: '', monthlyExpense: '', monthlySavings: '' },
  assets: [],
  liabilities: [],
  transactions: [],
  budgets: {},
  accounts: [],
  goals: [],
  netWorthSnapshots: [],
  targetAllocation: { Equity: 55, Debt: 20, 'Real Estate': 10, Commodities: 10, 'Cash & Savings': 5 },
};
