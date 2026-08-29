import Papa from 'papaparse';

const ALIASES = {
  name: ['instrument', 'symbol', 'name', 'scripname', 'stockname', 'tradingsymbol', 'security', 'fundname', 'assetname'],
  qty: ['qty', 'quantity', 'netqty', 'shares', 'units', 'holdingqty'],
  avgCost: ['avgcost', 'avgcostprice', 'averageprice', 'buyavg', 'avgprice', 'avgbuyprice', 'buyprice', 'costprice', 'purchaseprice'],
  currentPrice: ['ltp', 'lastprice', 'currentprice', 'marketprice', 'cmp', 'closeprice', 'nav', 'currentvalue'],
  type: ['type', 'assettype', 'category', 'instrumenttype', 'segment'],
};

const TYPE_MAP = {
  equity: 'Equity', stock: 'Equity', stocks: 'Equity', shares: 'Equity',
  mf: 'Equity', mutualfund: 'Equity', mutualfunds: 'Equity', etf: 'Equity',
  debt: 'Debt', bond: 'Debt', bonds: 'Debt', fd: 'Debt', fixeddeposit: 'Debt',
  gold: 'Commodities', silver: 'Commodities', commodity: 'Commodities', commodities: 'Commodities',
  realestate: 'Real Estate', property: 'Real Estate',
  cash: 'Cash & Savings', savings: 'Cash & Savings',
  crypto: 'Crypto', bitcoin: 'Crypto', cryptocurrency: 'Crypto',
};

function normKey(k) {
  return String(k || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function detectColumns(headers) {
  const normalized = headers.map(h => ({ raw: h, norm: normKey(h) }));
  const map = {};
  for (const field of Object.keys(ALIASES)) {
    const hit = normalized.find(h => ALIASES[field].includes(h.norm));
    if (hit) map[field] = hit.raw;
  }
  return map;
}

function rowsToAssets(rows, defaultType) {
  if (rows.length === 0) return { assets: [], skipped: 0, columns: {} };
  const headers = Object.keys(rows[0]);
  const cols = detectColumns(headers);

  const assets = [];
  let skipped = 0;

  for (const row of rows) {
    const rawName = cols.name ? row[cols.name] : undefined;
    const rawQty = cols.qty ? row[cols.qty] : undefined;
    const rawAvg = cols.avgCost ? row[cols.avgCost] : undefined;
    const rawCur = cols.currentPrice ? row[cols.currentPrice] : undefined;
    const rawType = cols.type ? row[cols.type] : undefined;

    const name = String(rawName ?? '').trim();
    const qty = toNumber(rawQty);
    const avgCost = toNumber(rawAvg);

    if (!name || !qty || !avgCost) { skipped++; continue; }

    const typeKey = normKey(rawType);
    const type = TYPE_MAP[typeKey] || defaultType || 'Equity';

    assets.push({
      name,
      type,
      qty,
      avgCost,
      currentPrice: toNumber(rawCur) || avgCost,
      currency: 'INR',
      tags: [],
    });
  }

  return { assets, skipped, columns: cols };
}

function toNumber(v) {
  if (v === undefined || v === null || v === '') return 0;
  const n = Number(String(v).replace(/[₹$,\s]/g, ''));
  return isNaN(n) ? 0 : n;
}

export function parseCSV(file, defaultType) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          resolve(rowsToAssets(results.data, defaultType));
        } catch (e) { reject(e); }
      },
      error: reject,
    });
  });
}

export async function parseExcel(file, defaultType) {
  const XLSX = await import('xlsx');
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  return rowsToAssets(rows, defaultType);
}

// Parses a CSV or Excel broker export and returns every valid holding found —
// there is no cap on the number of rows.
export async function parseBrokerFile(file, defaultType) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'csv') return parseCSV(file, defaultType);
  if (['xlsx', 'xls'].includes(ext)) return parseExcel(file, defaultType);
  throw new Error('Unsupported file type. Please upload a .csv, .xlsx, or .xls file.');
}
