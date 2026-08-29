export function assetCurrentValue(asset) {
  const qty = Number(asset.qty) || 0;
  const price = Number(asset.currentPrice ?? asset.avgCost) || 0;
  return qty * price;
}

export function assetInvestedValue(asset) {
  const qty = Number(asset.qty) || 0;
  const avg = Number(asset.avgCost) || 0;
  return qty * avg;
}

export function totalAssets(assets) {
  return assets.reduce((sum, a) => sum + assetCurrentValue(a), 0);
}

export function totalLiabilities(liabilities) {
  return liabilities.reduce((sum, l) => sum + (Number(l.outstandingAmount) || 0), 0);
}

export function netWorth(assets, liabilities) {
  return totalAssets(assets) - totalLiabilities(liabilities);
}

export function allocationByType(assets) {
  const map = {};
  let total = 0;
  for (const a of assets) {
    const v = assetCurrentValue(a);
    map[a.type] = (map[a.type] || 0) + v;
    total += v;
  }
  return { map, total };
}

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function txForMonth(transactions, key = monthKey()) {
  return transactions.filter(t => (t.date || '').startsWith(key));
}

export function sumByType(transactions, type) {
  return transactions.filter(t => t.type === type).reduce((s, t) => s + (Number(t.amount) || 0), 0);
}

export function emergencyFundMonths(liquidAssets, monthlyExpense) {
  const exp = Number(monthlyExpense) || 0;
  if (exp <= 0) return 0;
  return liquidAssets / exp;
}

export function idealTermCover(annualExpense, netWorthValue) {
  return Math.max(0, annualExpense * 25 - netWorthValue);
}

export function healthScore({ savingsRate, emergencyMonths, hasTermCover, hasHealthCover, debtRatio }) {
  let score = 0;
  score += Math.min(3, (savingsRate / 100) * 6); // up to 3
  score += Math.min(3, (emergencyMonths / 6) * 3); // up to 3
  score += hasTermCover ? 2 : 0;
  score += hasHealthCover ? 1.5 : 0;
  score += debtRatio < 0.3 ? 0.5 : 0;
  return Math.min(10, Math.round(score * 10) / 10);
}
