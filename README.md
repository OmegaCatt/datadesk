# DataDesk

[Česky](#česky) · [English](#english)

## Česky

**DataDesk je ukázková aplikace pro kontrolu kvality dat a párování objednávek se zásilkami.** Ze dvou fiktivních CSV exportů vytvoří vysvětlitelná zjištění a u každého zachová odkaz na původní řádek. Stejná validační pravidla fungují v prohlížeči i v příkazové řádce.

![Přehled aplikace DataDesk](docs/preview.png)

### Co aplikace ukazuje

- Odhaluje chybějící a nepřiřazené zásilky, duplicitní a rozporná ID, nesoulad množství a dat, neplatná pole a součty oddělené podle měny.
- Umožňuje místní import CSV, prohlížení zdrojových záznamů, filtrování zjištění, poznámky ke kontrole a export do CSV nebo JSON. Samostatný CSV seznam otevřených úkolů obsahuje prioritu a odkazy na zdrojové řádky. Poznámky nemění zjištění ani původní data.
- Omezuje velikost a strukturu importů, odmítá vyhrazené názvy sloupců, bezpečně zobrazuje text a při exportu neutralizuje vzorce, které by mohl spustit tabulkový procesor.
- Obsahuje automatizované testy a reprodukovatelný benchmark se 20 000 objednávkami a 20 000 zásilkami včetně scénáře s mnoha duplicitami.

### Spuštění

Vyžaduje Node.js 22 nebo novější. Nemá balíčkové závislosti ani API klíče.

```sh
npm start
```

Otevřete [http://127.0.0.1:4173](http://127.0.0.1:4173). Aplikace obsahuje tři fiktivní scénáře. Pro vlastní data zvolte jedno CSV s objednávkami a jedno CSV se zásilkami; každý soubor může mít nejvýše 20 000 záznamů a 2 000 000 bajtů. Požadované sloupce ukazuje rozhraní. Tato verze podporuje CSV, nikoli XLSX.

```sh
npm test
npm run benchmark
npm run demo:report
npm run build
```

CLI přijímá také `orders.csv shipments.csv [report.json]`. Bez argumentů vypíše report pro připravený příklad. Statická verze se vytvoří v `dist/`.

### Data a hranice ukázky

Všechna připravená jména, obchody a e-maily jsou fiktivní. Importy se zpracovávají v prohlížeči; aplikace nemá službu pro nahrávání dat. Poznámky k připraveným scénářům se ukládají do místního úložiště daného prohlížeče, poznámky k importům jen do paměti. Jde o portfoliovou ukázku, nikoli o sdílený nebo nemanipulovatelný auditní systém.

Podrobnosti: [zadání](docs/PROJECT.md), [rozhodnutí](docs/DECISIONS.md), [stav](docs/STATUS.md) a [ověření](docs/QA.md).

## English

DataDesk is a Czech portfolio application for reconciling fictional order and shipment exports. It turns raw CSV data into explainable findings with source-row provenance. The same validation engine runs in the browser and a Node CLI.

![DataDesk overview](docs/preview.png)

### What it demonstrates

- Deterministic validation: missing and orphaned shipments, duplicate and conflicting IDs, quantity and date checks, invalid fields, and currency-separated totals.
- Browser-local CSV import, source inspection, findings filters, review notes, and CSV/JSON exports. A separate open-issues CSV queue includes priority and source-row references. Review notes never change findings or original data.
- Defensive CSV parsing and export: schema and size limits, reserved-header rejection, safe text rendering, and spreadsheet-formula neutralization.
- Reproducible tests and a 20,000 + 20,000 row benchmark, including a duplicate-heavy case.

### Run locally

Requires Node.js 22 or newer. There are no package dependencies or API keys.

```sh
npm start
```

Open http://127.0.0.1:4173. The app includes three fictional scenarios. To import your own data, select one orders CSV and one shipments CSV; each may contain at most 20,000 records and 2,000,000 bytes. The interface shows the required columns. CSV is the supported format; XLSX is not supported in this version.

```sh
npm test
npm run benchmark
npm run demo:report
npm run build
```

The CLI also accepts `orders.csv shipments.csv [report.json]`. With no arguments it prints a report for the prepared example. The static build is written to `dist/`.

### Data and review limitations

All included names, shops and emails are fictional. Browser imports are processed in the page; the application has no upload service. Review notes for prepared scenarios are stored in that browser's local storage. Notes for imported files are held only in memory. This is a portfolio demonstration, not a shared or tamper-proof audit system.

See [project scope](docs/PROJECT.md), [decisions](docs/DECISIONS.md), [status](docs/STATUS.md) and [QA evidence](docs/QA.md).
