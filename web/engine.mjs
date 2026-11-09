export const ENGINE_VERSION = '0.1.0';
export const MAX_ROWS = 20000;
export const MAX_FILE_BYTES = 2_000_000;

export function parseDate(value) {
  const s = String(value ?? '').trim();
  let parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  let y, m, d;
  if (parts) [, y, m, d] = parts;
  else {
    parts = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(s);
    if (!parts) return null;
    [, d, m, y] = parts;
  }
  y = Number(y); m = Number(m); d = Number(d);
  if (y < 1900 || y > 2200 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d ? dt.toISOString().slice(0, 10) : null;
}

export function parseMoney(value) {
  const s = String(value ?? '').trim().replace(/[ \u00a0\u202f]/g, '');
  // Mixed separators and >2 decimal places are deliberately not guessed.
  const m = /^(\d{1,8})(?:[,.](\d{1,2}))?$/.exec(s);
  if (!m) return null;
  const cents = Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

export function parseQuantity(value) {
  const s = String(value ?? '').trim();
  return /^[1-9]\d{0,5}$/.test(s) ? Number(s) : null;
}

export function parseCSV(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_FILE_BYTES) throw new Error('Soubor překračuje limit 2 MB.');
  text = text.replace(/^\uFEFF/, '');
  if (!text.trim()) throw new Error('Soubor je prázdný.');
  let first = '', quoted = false;
  for (const c of text) { if (c === '"') quoted = !quoted; if ((c === '\n' || c === '\r') && !quoted) break; first += c; }
  const count = (sep) => { let n = 0, q = false; for (const c of first) { if (c === '"') q = !q; else if (!q && c === sep) n++; } return n; };
  const separator = [';', ',', '\t'].sort((a, b) => count(b) - count(a))[0];
  const records = []; let cells = [], field = '', inQuote = false, closed = false, line = 1, start = 1;
  const finishField = () => { cells.push(field); field = ''; closed = false; };
  const finishRecord = () => { finishField(); if (cells.some(c => c.trim())) records.push({ cells, line: start }); cells = []; if (records.length > MAX_ROWS + 1) throw new Error(`Maximum je ${MAX_ROWS} datových řádků.`); };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuote) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else { inQuote = false; closed = true; } }
      else { field += c; if (c === '\n') line++; }
    } else if (c === '"') {
      if (field || closed) throw new Error(`Neplatné uvozovky na řádku ${line}.`);
      inQuote = true;
    } else if (c === separator) finishField();
    else if (c === '\n' || c === '\r') {
      finishRecord(); if (c === '\r' && text[i + 1] === '\n') i++; line++; start = line;
    } else { if (closed) throw new Error(`Text za uzavřenými uvozovkami na řádku ${line}.`); field += c; }
  }
  if (inQuote) throw new Error('Neuzavřené uvozovky v CSV.');
  if (field || cells.length || closed) finishRecord();
  const headers = records.shift()?.cells.map(s => s.trim());
  if (!headers?.length || headers.some(h => !h) || new Set(headers).size !== headers.length) throw new Error('CSV musí mít neprázdné, unikátní názvy sloupců.');
  if (headers.some(h => ['__proto__', 'prototype', 'constructor', '__line'].includes(h))) throw new Error('Nepovolený název sloupce.');
  return records.map(({ cells, line: sourceLine }) => {
    if (cells.length !== headers.length) throw new Error(`Řádek ${sourceLine}: očekáváno ${headers.length} sloupců, nalezeno ${cells.length}.`);
    return Object.assign(Object.create(null), Object.fromEntries(headers.map((h, i) => [h, cells[i]])), { __line: sourceLine });
  });
}

export function spreadsheetSafe(value) {
  const s = String(value ?? '');
  return /^[\s\u0000-\u001f]*[=+\-@]/u.test(s) || /^[\t\r\n]/.test(s) ? "'" + s : s;
}
export function toCSV(rows, columns) {
  const quote = s => '"' + spreadsheetSafe(s).replaceAll('"', '""') + '"';
  return '\uFEFF' + [columns.map(quote).join(';'), ...rows.map(row => columns.map(k => quote(row[k])).join(';'))].join('\r\n');
}

export function openWorkQueue(result, reviews = {}) {
  return result.findings.filter(finding => !Object.hasOwn(reviews, finding.id)).map(finding => ({
    priority: finding.severity === 'error' ? '1 - chyba' : '2 - upozornění',
    rule: finding.code,
    title: finding.title,
    description: finding.message,
    records: finding.rows.map(row => `${row.source}:${row.line ?? row.row}:${row.shop}/${row.id}`).join(' | '),
    next_step: 'Ověřit zdrojová data a zaznamenat výsledek kontroly',
  }));
}
const clean = value => String(value ?? '').trim();
const key = (shop, id) => JSON.stringify([shop, id]);
const group = (rows, fn) => { const m = new Map(); for (const row of rows) { const k = fn(row); if (k) { if (!m.has(k)) m.set(k, []); m.get(k).push(row); } } return m; };
const rowRef = row => ({ source: row.source, row: row.row, line: row.line, id: row.id, shop: row.shop, raw: row.raw });

export const RULES = [
  ['REQUIRED', 'Povinné identifikátory', 'Bez e-shopu a identifikátoru nelze záznam bezpečně spárovat.'],
  ['INVALID_DATE', 'Platná kalendářní data', 'ISO YYYY-MM-DD nebo české D.M.YYYY; neexistující dny se odmítnou.'],
  ['INVALID_AMOUNT', 'Jednoznačný zápis částek', 'Kladná částka, nejvýše dvě desetinná místa. Nejednoznačné oddělovače se neodhadují.'],
  ['INVALID_CURRENCY', 'Měna', 'CZK, EUR nebo USD. Různé měny se nesčítají ani automaticky nepřevádějí.'],
  ['INVALID_QUANTITY', 'Celé kladné množství', 'Počet kusů musí být celé číslo od 1 do 999999.'],
  ['INVALID_EMAIL', 'Základní formát e-mailu', 'Kontrola formátu, nikoli doručitelnosti adresy.'],
  ['DUPLICATE_ORDER', 'Duplicitní objednávky', 'Klíčem je dvojice e-shop + ID. I shodné duplicity vyžadují prověření.'],
  ['DUPLICATE_SHIPMENT', 'Duplicitní expedice', 'Nejednoznačné skupiny se nezapočítávají do množstevní kontroly.'],
  ['ORPHAN_SHIPMENT', 'Expedice bez objednávky', 'Odkazovaná objednávka chybí v dodaném exportu.'],
  ['MISSING_SHIPMENT', 'Objednávka bez expedice', 'V exportu expedice nebyl nalezen odpovídající záznam. Nejde automaticky o zpoždění.'],
  ['QUANTITY_MISMATCH', 'Nesoulad množství', 'Součet kusů všech jednoznačných expedic se porovnává s objednaným množstvím.'],
  ['DATE_SEQUENCE', 'Časová návaznost', 'Datum expedice nesmí předcházet datu objednávky.']
];

export function reconcile(inputOrders, inputShipments) {
  if (!Array.isArray(inputOrders) || !Array.isArray(inputShipments) || inputOrders.length > MAX_ROWS || inputShipments.length > MAX_ROWS) throw new Error(`Neplatný vstup nebo překročení limitu ${MAX_ROWS} řádků na zdroj.`);
  const requireSchema = (rows, fields, label) => {
    if (!rows.length) throw new Error(`${label}: soubor neobsahuje žádné datové řádky.`);
    if (rows.some(row => !row || typeof row !== 'object' || Array.isArray(row))) throw new Error(`${label}: neplatný záznam.`);
    if (rows.some(row => row.__line !== undefined && (!Number.isSafeInteger(row.__line) || row.__line<1 || row.__line>MAX_FILE_BYTES+1))) throw new Error(`${label}: neplatné číslo řádku zdroje.`);
    const missing = fields.filter(f => rows.some(row => !Object.hasOwn(row, f)));
    if (missing.length) throw new Error(`${label}: chybí sloupce ${missing.join(', ')}.`);
    if (rows.some(row => fields.some(f => typeof row[f] === 'object' && row[f] !== null))) throw new Error(`${label}: buňka musí obsahovat jednoduchou hodnotu.`);
    if (rows.some(row => Object.values(row).some(v => String(v ?? '').length > 500))) throw new Error(`${label}: buňka překročila limit 500 znaků.`);
  };
  requireSchema(inputOrders, ['order_id', 'shop', 'customer', 'email', 'ordered_at', 'amount', 'currency', 'quantity'], 'Objednávky');
  requireSchema(inputShipments, ['shipment_id', 'shop', 'order_id', 'shipped_at', 'quantity', 'carrier'], 'Expedice');
  const findings = [];
  const add = (code, severity, title, message, rows, orderKey = null) => {
    findings.push({ id: `${code}:${rows.map(r => `${r.source}-${r.row}`).join('-')}`, code, severity, title, message, rows: rows.map(rowRef), orderKey });
  };
  const orders = inputOrders.map((raw, i) => ({ source: 'orders', row: i + 2, line: raw.__line ?? i + 2, id: clean(raw.order_id), shop: clean(raw.shop), date: parseDate(raw.ordered_at), cents: parseMoney(raw.amount), currency: clean(raw.currency).toUpperCase(), quantity: parseQuantity(raw.quantity), raw: { ...raw } }));
  const shipments = inputShipments.map((raw, i) => ({ source: 'shipments', row: i + 2, line: raw.__line ?? i + 2, id: clean(raw.shipment_id), shop: clean(raw.shop), orderId: clean(raw.order_id), date: parseDate(raw.shipped_at), quantity: parseQuantity(raw.quantity), raw: { ...raw } }));
  for (const r of orders) {
    const k = r.id && r.shop ? key(r.shop, r.id) : null;
    if (!k) add('REQUIRED', 'error', 'Chybí identifikátor', 'Objednávka potřebuje ID i e-shop.', [r]);
    if (!r.date) add('INVALID_DATE', 'error', 'Neplatné datum objednávky', `Hodnotu „${clean(r.raw.ordered_at)}“ nelze jednoznačně zpracovat.`, [r], k);
    if (r.cents === null) add('INVALID_AMOUNT', 'error', 'Neplatná částka', `Částka „${clean(r.raw.amount)}“ vyžaduje opravu ve zdroji.`, [r], k);
    if (!['CZK', 'EUR', 'USD'].includes(r.currency)) add('INVALID_CURRENCY', 'error', 'Neznámá měna', `Měna „${r.currency || 'prázdná'}“ není v povoleném seznamu.`, [r], k);
    if (r.quantity === null) add('INVALID_QUANTITY', 'error', 'Neplatné množství', 'Počet objednaných kusů musí být celé kladné číslo.', [r], k);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(r.raw.email))) add('INVALID_EMAIL', 'warning', 'Podezřelý e-mail', 'Zkontrolujte formát adresy. Doručitelnost se neověřuje.', [r], k);
  }
  for (const r of shipments) {
    const k = r.orderId && r.shop ? key(r.shop, r.orderId) : null;
    if (!r.id || !k) add('REQUIRED', 'error', 'Chybí identifikátor expedice', 'Expedice potřebuje vlastní ID, ID objednávky a e-shop.', [r], k);
    if (!r.date) add('INVALID_DATE', 'error', 'Neplatné datum expedice', 'Datum expedice není platný podporovaný kalendářní den.', [r], k);
    if (r.quantity === null) add('INVALID_QUANTITY', 'error', 'Neplatné množství expedice', 'Počet expedovaných kusů musí být celé kladné číslo.', [r], k);
  }
  const orderGroups = group(orders, r => r.id && r.shop ? key(r.shop, r.id) : null);
  const shipGroups = group(shipments, r => r.id && r.shop ? key(r.shop, r.id) : null);
  const ambiguousShipments = new Set();
  for (const [k, rows] of orderGroups) if (rows.length > 1) {
    const signatures = rows.map(r => JSON.stringify([r.date, r.cents, r.currency, r.quantity, clean(r.raw.email), clean(r.raw.customer)]));
    const conflict = new Set(signatures).size > 1;
    add('DUPLICATE_ORDER', conflict ? 'error' : 'warning', conflict ? 'Rozporné duplicity objednávky' : 'Duplicitní objednávka', `${rows.length} záznamy sdílejí klíč ${rows[0].shop} / ${rows[0].id}. Skupina se automaticky neslučuje.`, rows, k);
  }
  for (const rows of shipGroups.values()) if (rows.length > 1) {
    rows.forEach(r => ambiguousShipments.add(r));
    add('DUPLICATE_SHIPMENT', 'error', 'Duplicitní ID expedice', `${rows.length} záznamy mají stejné ID expedice. Množstevní kontrola souvisejících objednávek je pozastavena.`, rows);
  }
  const byOrder = group(shipments, r => r.shop && r.orderId ? key(r.shop, r.orderId) : null);
  for (const r of shipments) if (r.shop && r.orderId && !orderGroups.has(key(r.shop, r.orderId))) add('ORPHAN_SHIPMENT', 'error', 'Expedice bez objednávky', `Objednávka ${r.orderId} pro ${r.shop} není v tomto exportu.`, [r], key(r.shop, r.orderId));
  let matchedOrders = 0, verifiedQuantity = 0;
  for (const [k, rows] of orderGroups) {
    if (rows.length !== 1) continue;
    const r = rows[0], linked = byOrder.get(k) ?? [];
    if (!linked.length) { add('MISSING_SHIPMENT', 'warning', 'Chybí expedice v exportu', 'Ověřte stav objednávky nebo úplnost exportu expedice.', [r], k); continue; }
    matchedOrders++;
    if (r.quantity !== null && linked.every(s => s.id && s.quantity !== null && !ambiguousShipments.has(s))) {
      verifiedQuantity++;
      const qty = linked.reduce((sum, s) => sum + s.quantity, 0);
      if (qty !== r.quantity) add('QUANTITY_MISMATCH', 'error', 'Nesouhlasí počet kusů', `Objednáno ${r.quantity}, v expedici ${qty}. Rozdíl ${qty - r.quantity}.`, [r, ...linked], k);
    }
    for (const s of linked) if (r.date && s.date && s.date < r.date) add('DATE_SEQUENCE', 'error', 'Expedice před objednávkou', `Expedice ${s.date} předchází objednávce ${r.date}.`, [r, s], k);
  }
  findings.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'error' ? -1 : 1) || a.rows[0].row - b.rows[0].row || a.code.localeCompare(b.code));
  const affectedOrders = new Set();
  const affectedKeys = new Set();
  for (const f of findings) for (const r of f.rows) {
    if (r.source === 'orders') affectedOrders.add(r.row);
    else affectedKeys.add(key(r.shop, clean(r.raw.order_id)));
  }
  for (const k of affectedKeys) for (const order of orderGroups.get(k) ?? []) affectedOrders.add(order.row);
  const totals = {};
  for (const [k, rows] of orderGroups) { const r = rows[0]; if (rows.length === 1 && r.cents !== null && ['CZK', 'EUR', 'USD'].includes(r.currency)) totals[r.currency] = (totals[r.currency] ?? 0) + r.cents; }
  return { version: ENGINE_VERSION, orders, shipments, findings, totals, stats: { orderRows: orders.length, shipmentRows: shipments.length, findings: findings.length, errors: findings.filter(f => f.severity === 'error').length, warnings: findings.filter(f => f.severity === 'warning').length, matchedOrders, verifiedQuantity, cleanOrders: orders.filter(r => r.id && r.shop && !affectedOrders.has(r.row)).length } };
}
