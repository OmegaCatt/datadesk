import { reconcile, parseCSV, toCSV, openWorkQueue, RULES, MAX_FILE_BYTES } from './engine.mjs';
import { getScenario, ORDER_COLUMNS, SHIPMENT_COLUMNS } from './datasets.mjs';

const $ = id => document.getElementById(id);
const paths = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  scan: '<path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-3M7 9h10M7 13h7M7 17h4"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10M15 10v10"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/>',
  file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  box: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 5v10l9 5 9-5V8M12 13v10M7 5.8l10 5.4"/>',
  alert: '<path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5m0 3v.1"/>',
  circle: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 4v.1"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>',
  link: '<path d="m10 13 4-4m-6 6-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 2 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0"/>'
};
function icon(name) { const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '1.6'); svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round'); svg.setAttribute('aria-hidden', 'true'); svg.innerHTML = paths[name] ?? paths.file; return svg; }
function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v === true ? '' : String(v));
  }
  for (const child of children.flat()) if (child !== undefined && child !== null) node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  return node;
}
document.querySelectorAll('[data-icon]').forEach(n => n.append(icon(n.dataset.icon)));
const state = { view: 'overview', scenario: null, result: null, reviews: {}, history: [], severity: 'all', reviewFilter: 'all', query: '', page: 1, source: 'orders', dataQuery: '', dataPage: 1, duration: 0, names: ['objednavky_rijen.csv', 'expedice_rijen.csv'] };
let toastTimer;
function toast(message) { $('toast').textContent = message; $('toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 3500); }
function storeKey() { return `datadesk:reviews:v1:${state.scenario.id}`; }
function restoreReviews() {
  state.reviews = {}; state.history = [];
  if (state.scenario.id.startsWith('custom-')) return;
  try {
    const saved = JSON.parse(localStorage.getItem(storeKey()) ?? '{}');
    const allowed = new Set(state.result.findings.map(f => f.id));
    if (saved.reviews && typeof saved.reviews === 'object') for (const [id, entry] of Object.entries(saved.reviews)) if (allowed.has(id) && typeof entry?.note === 'string' && entry.note.trim().length >= 5 && entry.note.length <= 500 && typeof entry.at === 'string') state.reviews[id] = { note: entry.note, at: entry.at };
    if (Array.isArray(saved.history)) state.history = saved.history.slice(-1000).filter(e => allowed.has(e?.id) && ['reviewed', 'reopened'].includes(e?.action) && typeof e?.at === 'string').map(e => ({ id: e.id, action: e.action, note: typeof e.note === 'string' ? e.note.slice(0, 500) : '', at: e.at }));
  } catch { /* Corrupt or disabled local storage does not block analysis. */ }
}
function persistReviews() {
  if (state.scenario.id.startsWith('custom-')) return true;
  try { localStorage.setItem(storeKey(), JSON.stringify({ reviews: state.reviews, history: state.history })); return true; } catch { return false; }
}
function setData(scenario, names) {
  const begin = performance.now();
  const result = reconcile(scenario.orders, scenario.shipments);
  state.duration = performance.now() - begin;
  state.scenario = scenario; state.result = result;
  state.names = names ?? ['objednavky_rijen.csv', 'expedice_rijen.csv'];
  state.query = ''; state.dataQuery = ''; state.page = 1; state.dataPage = 1; state.severity = 'all'; state.reviewFilter = 'all';
  restoreReviews(); render();
}
function badge(severity, label) { return el('span', { class: `badge ${severity}` }, icon(severity === 'error' ? 'circle' : severity === 'warning' ? 'alert' : 'check'), label ?? (severity === 'error' ? 'Chyba' : 'Upozornění')); }
const number = n => new Intl.NumberFormat('cs-CZ').format(n);
const countWord = (n, one, few, many) => `${number(n)} ${n === 1 ? one : n >= 2 && n <= 4 ? few : many}`;
const sourceName = s => s === 'orders' ? 'Objednávky' : 'Expedice';
function reviewed(f) { return Object.hasOwn(state.reviews, f.id); }
function openCount() { return state.result.findings.filter(f => !reviewed(f)).length; }
function metric(label, value, hint, type, symbol) { return el('article', { class: `metric ${type ?? ''}` }, el('div', { class: 'metric-label' }, label, icon(symbol)), el('div', { class: 'metric-value' }, number(value)), el('div', { class: 'metric-hint' }, hint)); }
function sectionHeading(title, note) { return el('div', { class: 'section-heading' }, el('h2', {}, title), el('span', {}, note)); }
function sources() { return el('div', { class: 'source-grid' }, ...['orders', 'shipments'].map((kind, i) => el('div', { class: 'source-card' }, el('span', { class: 'source-icon' }, icon('file')), el('div', {}, el('strong', {}, state.names[i]), el('small', {}, `${sourceName(kind)} · ${countWord(state.result[kind].length, 'záznam', 'záznamy', 'záznamů')} · CSV`)), el('span', {}, icon('check'), 'Načteno')))); }
function empty(title, message) { return el('div', { class: 'empty' }, el('span', { class: 'empty-icon' }, icon('check')), el('h3', {}, title), el('p', {}, message)); }
function findingsRows(rows) {
  const table = el('table', {}, el('thead', {}, el('tr', {}, ...['ZÁVAŽNOST', 'NÁLEZ', 'ZÁZNAM / E-SHOP', 'STAV', ''].map(t => el('th', { scope: 'col' }, t)))));
  const body = el('tbody');
  rows.forEach(f => {
    const ref = f.rows[0];
    body.append(el('tr', {}, el('td', {}, badge(f.severity)), el('td', {}, el('button', { class: 'finding-title', onclick: () => showDetail(f) }, f.title), el('span', { class: 'cell-sub' }, `${sourceName(ref.source)} · záznam ${ref.row}${f.rows.length > 1 ? ` + ${f.rows.length - 1} další` : ''}`)), el('td', {}, el('span', { class: 'mono' }, ref.id || '—'), el('span', { class: 'cell-sub' }, ref.shop || 'Chybí e-shop')), el('td', { class: 'review-cell' }, reviewed(f) ? badge('reviewed', 'Prověřeno') : el('span', { class: 'badge open' }, 'K prověření')), el('td', {}, el('button', { class: 'chevron', 'aria-label': `Detail: ${f.title}, ${ref.id || 'bez ID'}`, onclick: () => showDetail(f) }, icon('chevron')))));
  });
  table.append(body); return el('div', { class: 'table-scroll' }, table);
}
function overview() {
  const s = state.result.stats;
  const wrap = el('div', {}, el('section', { class: 'metrics', 'aria-label': 'Výsledky kontroly' }, metric('Objednávek v exportu', s.orderRows, `${countWord(s.shipmentRows, 'záznam', 'záznamy', 'záznamů')} expedice`, '', 'box'), metric('Nalezených chyb', s.errors, 'Vyžadují kontrolu zdroje', 'error', 'circle'), metric('Upozornění', s.warnings, 'Prověřte souvislosti', 'warning', 'alert'), metric('Spárované objednávky', s.matchedOrders, 'Mají alespoň jeden záznam expedice', 'success', 'link')), sectionHeading('Vstupní soubory', 'Původní hodnoty zůstávají zachované'), sources());
  const panel = el('section', { class: 'panel', 'aria-label': 'Nálezy k prověření' }, el('div', { class: 'panel-heading' }, el('div', {}, el('h2', {}, 'Co potřebuje vaši pozornost'), el('p', {}, `${openCount()} otevřených nálezů · začněte chybami a pokračujte upozorněními`)), el('a', { class: 'text-button', href: '#findings' }, 'Všechny nálezy →')));
  const open = state.result.findings.filter(f => !reviewed(f));
  panel.append(open.length ? findingsRows(open.slice(0, 5)) : empty(state.result.findings.length ? 'Všechny nálezy jsou prověřené' : 'V tomto exportu je vše v pořádku', state.result.findings.length ? 'Poznámky jsou uložené. Zdrojová data tím nejsou opravená.' : 'Kontrolní pravidla v dodaných datech nenašla nesrovnalosti.'));
  panel.append(el('div', { class: 'table-footer' }, `Zobrazeno ${Math.min(5, open.length)} z ${open.length} otevřených nálezů`, el('span', {}, '12 pravidel · původ dat u každého nálezu'))); wrap.append(panel);
  const counts = new Map();
  for (const f of state.result.findings) counts.set(f.code, (counts.get(f.code) ?? 0) + 1);
  const chart = el('section', { class: 'panel' }, el('div', { class: 'panel-heading' }, el('h2', {}, 'Kde vznikají nesrovnalosti')));
  const dist = el('div', { class: 'distribution' });
  const groups = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 5);
  groups.forEach(([code, count]) => dist.append(el('div', { class: 'distribution-row' }, el('span', {}, RULES.find(r => r[0] === code)?.[1] ?? code), el('div', { class: 'bar-track' }, el('div', { class: 'bar-fill', style: `width:${count / Math.max(...groups.map(g => g[1])) * 100}%` })), el('span', {}, count))));
  chart.append(groups.length ? dist : empty('Žádné nesrovnalosti', 'Zkuste scénář Říjnová kontrola.'));
  const steps = el('section', { class: 'panel' }, el('div', { class: 'panel-heading' }, el('h2', {}, 'Od nálezu k dalšímu kroku')), el('ol', { class: 'steps' }, ...[
    ['Otevřete detail nálezu', 'Porovnejte původní záznamy a důvod kontroly.'],
    ['Zapište výsledek prověření', 'Poznámka odděluje rozhodnutí člověka od původních dat.'],
    ['Předejte výsledek dál', 'Exportujte přehled pro opravu ve zdrojovém systému.']
  ].map(([title, desc], i) => el('li', {}, el('span', { class: 'step-number' }, `0${i + 1}`), el('div', {}, el('strong', {}, title), el('p', {}, desc))))));
  wrap.append(el('div', { class: 'bottom-grid' }, chart, steps)); return wrap;
}
function selectFilter(id, value, options, callback) { const select = el('select', { id, class: 'filter-select', 'aria-label': id === 'severity-filter' ? 'Filtrovat závažnost' : 'Filtrovat stav' }, ...options.map(([v, label]) => el('option', { value: v }, label))); select.value = value; select.addEventListener('change', () => callback(select.value)); return select; }
function searchBox(id, value, placeholder, callback) { const input = el('input', { id, type: 'search', placeholder, 'aria-label': placeholder, maxlength: 150 }); input.value = value; input.addEventListener('input', () => callback(input.value)); return el('label', { class: 'search' }, icon('search'), input); }
function pager(current, pages, callback) { return el('div', { class: 'page-controls' }, el('button', { 'aria-label': 'Předchozí stránka', disabled: current <= 1, onclick: () => callback(current - 1) }, '←'), `${current} / ${Math.max(1, pages)}`, el('button', { 'aria-label': 'Další stránka', disabled: current >= pages, onclick: () => callback(current + 1) }, '→')); }
function filteredFindings() { return state.result.findings.filter(f => (state.severity === 'all' || f.severity === state.severity) && (state.reviewFilter === 'all' || reviewed(f) === (state.reviewFilter === 'reviewed')) && `${f.title} ${f.code} ${f.rows.map(r => `${r.id} ${r.shop}`).join(' ')}`.toLocaleLowerCase('cs').includes(state.query.toLocaleLowerCase('cs'))); }
function findingsView() {
  const filtered = filteredFindings();
  const perPage = 12, pages = Math.ceil(filtered.length / perPage); state.page = Math.max(1, Math.min(state.page, pages || 1));
  const panel = el('section', { class: 'panel' }, el('div', { class: 'panel-heading' }, el('div', {}, el('h2', {}, 'Všechny nálezy'), el('p', {}, `${state.result.findings.length} nálezů celkem · ${openCount()} čeká na prověření`))));
  panel.append(el('div', { class: 'toolbar' }, searchBox('findings-search', state.query, 'Hledat nález, ID nebo e-shop…', v => { state.query = v; state.page = 1; render(); }), selectFilter('severity-filter', state.severity, [['all', 'Všechny závažnosti'], ['error', 'Jen chyby'], ['warning', 'Jen upozornění']], v => { state.severity = v; state.page = 1; render(); }), selectFilter('review-filter', state.reviewFilter, [['all', 'Všechny stavy'], ['open', 'K prověření'], ['reviewed', 'Prověřeno']], v => { state.reviewFilter = v; state.page = 1; render(); })));
  panel.append(filtered.length ? findingsRows(filtered.slice((state.page - 1) * perPage, state.page * perPage)) : empty('Žádné odpovídající nálezy', 'Změňte hledání, filtr nebo ukázkový scénář.'));
  panel.append(el('div', { class: 'table-footer' }, `${number(filtered.length)} odpovídajících nálezů`, pager(state.page, pages, p => { state.page = p; render(); }))); return panel;
}
const labels = { order_id: 'ID objednávky', shop: 'E-shop', customer: 'Zákazník', email: 'E-mail', ordered_at: 'Datum objednávky', amount: 'Částka', currency: 'Měna', quantity: 'Počet kusů', shipment_id: 'ID expedice', shipped_at: 'Datum expedice', carrier: 'Dopravce' };
function dataView() {
  const columns = state.source === 'orders' ? ORDER_COLUMNS : SHIPMENT_COLUMNS;
  const records = state.result[state.source].filter(r => Object.values(r.raw).some(v => String(v).toLocaleLowerCase('cs').includes(state.dataQuery.toLocaleLowerCase('cs'))));
  const perPage = 25, pages = Math.ceil(records.length / perPage); state.dataPage = Math.max(1, Math.min(state.dataPage, pages || 1));
  const panel = el('section', { class: 'panel' }, el('div', { class: 'panel-heading' }, el('div', { class: 'data-tabs', role: 'group', 'aria-label': 'Vybrat zdroj dat' }, ...['orders', 'shipments'].map(kind => el('button', { class: `data-tab ${state.source === kind ? 'selected' : ''}`, 'aria-pressed': state.source === kind ? 'true' : 'false', onclick: () => { state.source = kind; state.dataPage = 1; state.dataQuery = ''; render(); } }, sourceName(kind))))));
  panel.append(el('div', { class: 'toolbar' }, searchBox('data-search', state.dataQuery, 'Hledat ve zdrojových datech…', v => { state.dataQuery = v; state.dataPage = 1; render(); })));
  const table = el('table', { class: 'data-table' }, el('thead', {}, el('tr', {}, el('th', { scope: 'col' }, 'ZÁZNAM'), ...columns.map(c => el('th', { scope: 'col' }, labels[c])))), el('tbody', {}, ...records.slice((state.dataPage - 1) * perPage, state.dataPage * perPage).map(r => el('tr', {}, el('td', { class: 'mono' }, r.row), ...columns.map(c => el('td', { title: String(r.raw[c] ?? '') }, String(r.raw[c] ?? '')))))));
  panel.append(records.length ? el('div', { class: 'table-scroll' }, table) : empty('Žádné odpovídající záznamy', 'Zkuste jiný hledaný výraz.'));
  panel.append(el('div', { class: 'table-footer' }, `${number(records.length)} záznamů · původní hodnoty bez úprav`, pager(state.dataPage, pages, p => { state.dataPage = p; render(); })), el('div', { class: 'info-line' }, 'Záznamy se zde neupravují. DataDesk poskytuje kontrolní výsledek pro opravu ve zdroji.')); return panel;
}
function rulesView() { return el('div', { class: 'rules-grid' }, ...RULES.map(([code, title, desc]) => el('article', { class: 'rule-card' }, el('span', {}, icon('shield')), el('h2', {}, title), el('p', {}, desc), el('div', { class: 'rule-code' }, code)))); }
function render() {
  const focus = document.activeElement?.id, selection = document.activeElement?.selectionStart;
  const title = { overview: 'Kontrola objednávek', findings: 'Nalezené problémy', data: 'Zdrojová data', rules: 'Kontrolní pravidla' }[state.view];
  $('page-title').textContent = title;
  $('page-description').textContent = { overview: 'Najděte nesrovnalosti dřív, než se z nich stanou problémy.', findings: 'Každý nález má vysvětlení, zdroj a prostor pro vaše rozhodnutí.', data: 'Původní záznamy, přesně tak, jak byly načteny.', rules: 'Srozumitelná pravidla. Stejná data, stejný výsledek.' }[state.view];
  document.title = `${title} — DataDesk`;
  $('nav-count').textContent = openCount();
  $('run-description').textContent = `${state.scenario.name} · ${countWord(state.result.stats.orderRows + state.result.stats.shipmentRows, 'vstupní záznam', 'vstupní záznamy', 'vstupních záznamů')} · výpočet ${state.duration.toFixed(1).replace('.', ',')} ms`;
  document.querySelectorAll('[data-view]').forEach(a => { a.classList.toggle('active', a.dataset.view === state.view); if (a.dataset.view === state.view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  $('content').replaceChildren(state.view === 'overview' ? overview() : state.view === 'findings' ? findingsView() : state.view === 'data' ? dataView() : rulesView());
  if (focus && $(focus) && ['findings-search', 'data-search'].includes(focus)) { $(focus).focus(); if (typeof selection === 'number') $(focus).setSelectionRange(selection, selection); }
}
function showDetail(f) {
  const content = $('detail-content');
  content.replaceChildren(badge(f.severity), el('h2', { id: 'detail-title', class: 'detail-title' }, f.title), el('p', {}, f.message), el('div', { class: 'detail-meta' }, el('span', { class: 'mono' }, f.code), reviewed(f) ? badge('reviewed', 'Prověřeno') : el('span', { class: 'badge open' }, 'K prověření')));
  for (const r of f.rows.slice(0, 20)) content.append(el('section', { class: 'source-record' }, el('div', { class: 'record-heading' }, `${sourceName(r.source)} · záznam ${r.row}`), el('table', {}, el('tbody', {}, ...Object.entries(r.raw).filter(([k]) => k !== '__line').map(([k, v]) => el('tr', {}, el('td', {}, labels[k] ?? k), el('td', {}, String(v ?? ''))))))));
  if (f.rows.length > 20) content.append(el('p', { class: 'small muted' }, `Zobrazeno prvních 20 z ${number(f.rows.length)} souvisejících záznamů. Úplné podklady obsahuje export JSON.`));
  if (reviewed(f)) {
    const entry = state.reviews[f.id];
    content.append(el('div', { class: 'review-note' }, el('strong', {}, 'Poznámka k prověření'), el('p', {}, entry.note), el('small', {}, 'Zdrojová data zůstávají beze změny.')),
      el('button', { class: 'text-button', onclick: () => { delete state.reviews[f.id]; state.history.push({ id: f.id, action: 'reopened', at: new Date().toISOString(), note: '' }); persistReviews(); render(); showDetail(f); toast('Nález je znovu otevřený.'); } }, 'Vrátit k prověření'));
  } else {
    const textarea = el('textarea', { id: 'review-note', maxlength: 500, minlength: 5, required: true, placeholder: 'Co jste ověřili a jaký má být další krok? (alespoň 5 znaků)' });
    const button = el('button', { class: 'button primary', type: 'submit', disabled: true }, icon('check'), 'Označit jako prověřené');
    textarea.addEventListener('input', () => { button.disabled = textarea.value.trim().length < 5; });
    const form = el('form', { class: 'review-form', onsubmit: event => {
      event.preventDefault(); const note = textarea.value.trim(); if (note.length < 5 || note.length > 500) return;
      const at = new Date().toISOString(); state.reviews[f.id] = { note, at }; state.history.push({ id: f.id, action: 'reviewed', at, note });
      const persisted = persistReviews(); render(); showDetail(f); toast(persisted ? 'Prověření zaznamenáno. Původní nález zůstává v protokolu.' : 'Prověření je jen v paměti této stránky; prohlížeč nepovolil uložení.');
    } }, el('label', { for: 'review-note' }, 'Výsledek vašeho prověření'), textarea, el('p', { class: 'small muted' }, 'Poznámka potvrzuje prověření. Neopravuje chybný údaj a nemění závažnost nálezu.'), button);
    content.append(form);
  }
  if (!$('detail-dialog').open) $('detail-dialog').showModal();
}
function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type })); const a = el('a', { href: url, download: name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 3000);
}
function report() { return { application: 'DataDesk', engineVersion: state.result.version, exportedAt: new Date().toISOString(), scenario: state.scenario.name, syntheticFixture: !state.scenario.id.startsWith('custom-'), sources: state.names, stats: state.result.stats, totalsMinorUnits: state.result.totals, totalsNote: 'Součty po měnách pouze z jednoznačných klíčů objednávek a platných částek; nejde o součet všech zdrojových řádků.', findings: state.result.findings.map(f => ({ ...f, review: state.reviews[f.id] ?? null })), reviewHistory: state.history, rules: RULES.map(([code, title, description]) => ({ code, title, description })) }; }
$('new-button').addEventListener('click', () => { $('import-error').textContent = ''; $('import-dialog').showModal(); });
$('about-button').addEventListener('click', () => $('about-dialog').showModal());
$('export-button').addEventListener('click', () => $('export-dialog').showModal());
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => $(b.dataset.close).close()));
$('scenario').addEventListener('change', () => { if ($('scenario').value === 'custom') return; const id = $('scenario').value; $('scenario').querySelector('[value=custom]')?.remove(); setData(getScenario(id)); toast('Kontrola byla přepočítána z vybraných dat.'); });
$('menu-toggle').addEventListener('click', () => { const visible = $('sidebar').classList.toggle('visible'); $('menu-toggle').setAttribute('aria-expanded', visible ? 'true' : 'false'); });
function navigate() { const view = location.hash.slice(1); state.view = ['overview', 'findings', 'data', 'rules'].includes(view) ? view : 'overview'; $('sidebar').classList.remove('visible'); $('menu-toggle').setAttribute('aria-expanded', 'false'); if (state.result) render(); }
window.addEventListener('hashchange', navigate);
document.addEventListener('click', event => { if (window.innerWidth <= 900 && !$('sidebar').contains(event.target) && !$('menu-toggle').contains(event.target)) { $('sidebar').classList.remove('visible'); $('menu-toggle').setAttribute('aria-expanded', 'false'); } });
$('samples-orders').addEventListener('click', () => { const sample = getScenario('issues'); download('objednavky_vzor.csv', toCSV(sample.orders, ORDER_COLUMNS), 'text/csv;charset=utf-8'); });
$('samples-shipments').addEventListener('click', () => { const sample = getScenario('issues'); download('expedice_vzor.csv', toCSV(sample.shipments, SHIPMENT_COLUMNS), 'text/csv;charset=utf-8'); });
$('import-form').addEventListener('submit', async event => {
  event.preventDefault(); const button = event.target.querySelector('[type=submit]'); $('import-error').textContent = ''; button.disabled = true;
  try {
    const a = $('orders-file').files[0], b = $('shipments-file').files[0];
    if (!a || !b) throw new Error('Vyberte oba CSV soubory.');
    if (![a, b].every(f => f.name.toLowerCase().endsWith('.csv'))) throw new Error('Podporované jsou pouze CSV soubory v UTF-8.');
    if ([a, b].some(f => f.size > MAX_FILE_BYTES)) throw new Error('Každý soubor může mít nejvýše 2 MB.');
    const [at, bt] = await Promise.all([a.text(), b.text()]);
    if ([at, bt].some(text => text.includes('\uFFFD') || text.includes('\u0000'))) throw new Error('Soubor není platný podporovaný text. Uložte jej jako CSV UTF-8.');
    const orders = parseCSV(at), shipments = parseCSV(bt);
    setData({ id: `custom-${Date.now()}`, name: 'Vlastní kontrola CSV', orders, shipments }, [a.name, b.name]);
    if (!$('scenario').querySelector('[value=custom]')) $('scenario').append(el('option', { value: 'custom' }, 'Vlastní kontrola CSV'));
    $('scenario').value = 'custom'; $('import-dialog').close(); toast('Soubory byly zkontrolovány lokálně v prohlížeči.');
  } catch (error) { $('import-error').textContent = error instanceof Error ? error.message : 'Soubory se nepodařilo zpracovat.'; }
  finally { button.disabled = false; }
});
const findingColumns = ['severity', 'rule', 'title', 'description', 'records', 'review_status', 'review_note'];
function findingExportRows(findings) { return findings.map(f => ({ severity: f.severity, rule: f.code, title: f.title, description: f.message, records: f.rows.map(r => `${sourceName(r.source)}:${r.row}:${r.shop}/${r.id}`).join(' | '), review_status: reviewed(f) ? 'Prověřeno, data nezměněna' : 'K prověření', review_note: state.reviews[f.id]?.note ?? '' })); }
$('csv-export').addEventListener('click', () => { download('datadesk_nalezy.csv', toCSV(findingExportRows(state.result.findings), findingColumns), 'text/csv;charset=utf-8'); toast('CSV protokol byl připraven ke stažení.'); });
$('filtered-export').addEventListener('click', () => { const rows = findingExportRows(filteredFindings()); download('datadesk_vyber_nalezu.csv', toCSV(rows, findingColumns), 'text/csv;charset=utf-8'); toast(`Výběr ${rows.length} nálezů je připraven ke stažení.`); });
$('queue-export').addEventListener('click', () => {
  const rows = openWorkQueue(state.result, state.reviews);
  download('datadesk_k_provereni.csv', toCSV(rows, ['priority', 'rule', 'title', 'description', 'records', 'next_step']), 'text/csv;charset=utf-8');
  toast(`Seznam ${rows.length} otevřených nálezů je připraven ke stažení.`);
});
$('json-export').addEventListener('click', () => { download('datadesk_protokol.json', JSON.stringify(report(), null, 2), 'application/json;charset=utf-8'); toast('Kompletní protokol byl připraven ke stažení.'); });
$('reset-reviews').addEventListener('click', () => { state.reviews = {}; state.history = []; persistReviews(); render(); $('about-dialog').close(); toast('Uložená prověření této kontroly byla smazána.'); });
navigate(); setData(getScenario('issues'));
