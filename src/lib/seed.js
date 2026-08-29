import { uid } from './format';

function eq(name, qty, avgCost) {
  return { id: uid(), name, type: 'Equity', qty, avgCost, currentPrice: avgCost, currency: 'INR', tags: [] };
}

export const demoAssets = [
  eq('Natco Pharma Ltd', 11, 966.79),
  eq('Kotak Gold ETF', 81, 91.85),
  eq('ITC Ltd', 16, 402.49),
  eq('HDFC Bank Ltd', 4, 793.20),
  eq('Karnataka Bank Ltd', 15, 211.17),
  eq('TVS Motor Company Ltd', 1, 1922.80),
  eq('Manappuram Finance Ltd', 11, 167.19),
  eq('Tata Consultancy Services Ltd', 1, 3512.30),
  eq('Coal India Ltd', 9, 402.85),
  eq('Bharat Electronics Ltd', 12, 289.40),
  eq('NTPC Ltd', 14, 342.10),
  eq('Power Grid Corp of India', 15, 318.55),
  eq('Punjab National Bank', 45, 98.30),
  eq('IRFC Ltd', 32, 128.90),
  eq('Vedanta Ltd', 8, 452.60),
  eq('GAIL India Ltd', 20, 195.75),
  eq('SBI Life Insurance Co', 2, 1478.20),
  eq('Zomato Ltd', 22, 231.40),
  eq('Tata Steel Ltd', 24, 158.90),
  eq('Bank of Baroda', 18, 210.30),
  eq('Suzlon Energy Ltd', 60, 66.25),
  eq('IDFC First Bank Ltd', 25, 78.40),
  eq('Yes Bank Ltd', 90, 21.60),
  eq('Hindustan Copper Ltd', 20, 240.10),
  eq('Bajaj Housing Finance Ltd', 6, 172.85),
];

export const demoProfile = {
  age: '29',
  monthlyIncome: '25000',
  monthlyExpense: '14000',
  monthlySavings: '10000',
};

export const demoUser = { name: 'Logeshkumar M', email: 'logesh@example.com' };
