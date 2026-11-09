import {reconcile, MAX_ROWS} from './engine.mjs';
import {ORDER_COLUMNS, SHIPMENT_COLUMNS} from './datasets.mjs';

export const COLUMNS = {orders: ORDER_COLUMNS, shipments: SHIPMENT_COLUMNS};
export function mapColumns(rows, mapping, kind) {
  if (!Array.isArray(rows) || !rows.length || rows.length > MAX_ROWS || !COLUMNS[kind]) throw new Error('Neplatný vstup mapování.');
  const available = Object.keys(rows[0]).filter(k => k !== '__line');
  const selected = COLUMNS[kind].map(key => mapping?.[key]);
  if (selected.some(key => typeof key !== 'string' || !available.includes(key)) || new Set(selected).size !== selected.length) throw new Error('Každému poli přiřaďte jiný existující sloupec.');
  return rows.map(row => Object.assign(Object.create(null), Object.fromEntries(COLUMNS[kind].map(key => [key, row[mapping[key]]])), {__line: row.__line}));
}
const validNote = entry => entry && typeof entry.note === 'string' && entry.note.trim().length >= 5 && entry.note.length <= 500 && typeof entry.at === 'string' && Number.isFinite(Date.parse(entry.at));
export function decodeCase(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > 8_000_000) throw new Error('Případ může mít nejvýše 8 MB.');
  let saved;
  try { saved = JSON.parse(text); } catch { throw new Error('Neplatný JSON případu.'); }
  if (saved?.format !== 'datadesk-case' || saved.version !== 1 || !Array.isArray(saved.names) || saved.names.length !== 2 || saved.names.some(n => typeof n !== 'string' || n.length > 400)) throw new Error('Nepodporovaný formát případu.');
  // Always recompute findings. Saved totals, findings and review flags are not trusted.
  const result = reconcile(saved.orders, saved.shipments);
  if (saved.engineVersion !== result.version) throw new Error('Případ používá jinou verzi pravidel.');
  const allowed = new Set(result.findings.map(f => f.id));
  const reviews = Object.create(null);
  if (saved.reviews && typeof saved.reviews === 'object') for (const [id, entry] of Object.entries(saved.reviews)) {
    if (!allowed.has(id) || !validNote(entry)) throw new Error('Případ obsahuje neplatné prověření.');
    reviews[id] = {note:entry.note, at:entry.at};
  }
  const history = saved.history ?? [];
  if (!Array.isArray(history) || history.length > 1000 || history.some(e => !allowed.has(e?.id) || !['reviewed','reopened'].includes(e.action) || typeof e.note !== 'string' || e.note.length > 500 || !Number.isFinite(Date.parse(e.at)))) throw new Error('Neplatná historie prověření.');
  return {...saved, result, reviews, history};
}

export async function caseFingerprint(orders, shipments) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify({orders, shipments})));
  return [...new Uint8Array(digest)].map(v => v.toString(16).padStart(2,'0')).join('');
}
export async function encodeCase(state) {
  return JSON.stringify({format:'datadesk-case', version:1, engineVersion:state.result.version,
    names:state.names, orders:state.scenario.orders, shipments:state.scenario.shipments,
    fingerprint:await caseFingerprint(state.scenario.orders,state.scenario.shipments),
    reviews:state.reviews, history:state.history.slice(-1000)}, null, 2);
}
export async function restoreCase(text) {
  const saved = decodeCase(text);
  if (saved.fingerprint !== await caseFingerprint(saved.orders,saved.shipments)) throw new Error('Otisk vstupů nesouhlasí. Poznámky nelze přiřadit ke změněným datům.');
  return saved;
}
