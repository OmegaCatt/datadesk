# DataDesk

## Aktualizace 9. 11. 2026: Mapování a uložené případy

CSV import nyní nabízí potvrzení mapování všech sloupců s náhledem hodnot a místním profilem. Případ lze uložit včetně vstupů a poznámek; při otevření se ověřuje SHA-256 otisk a nálezy se znovu vypočítají. Otisk není podpis ani doklad autenticity. Importované případy se automaticky neukládají do prohlížeče. Samostatný Python/SQLite report a postup obnovy v Excelu jsou v [analysis/README.md](analysis/README.md). XLSX import a hotový BI sešit zatím nejsou implementované.

English: confirmed column mapping, portable cases with input fingerprint checks and recomputed findings, plus a reproducible Python/SQLite coverage report. XLSX input and a finished BI workbook remain future work.

[Česky](#česky) · [English](#english)

## Česky

**DataDesk je ukázková aplikace pro kontrolu kvality dat a párování objednávek se zásilkami.** Ze dvou fiktivních CSV exportů vytvoří vysvětlitelná zjištění a u každého zachová odkaz na původní řádek. Stejná validační pravidla fungují v prohlížeči i v příkazové řádce.

![Přehled aplikace DataDesk](docs/preview.png)

### Co aplikace ukazuje

- Odhaluje chybějící a nepřiřazené zásilky, duplicitní a rozporná ID, nesoulad množství a dat, neplatná pole a součty oddělené podle měny.
- Umožňuje místní import CSV, prohlížení zdrojových záznamů, filtrování zjištění, poznámky ke kontrole a export do CSV nebo JSON. Filtrovaný CSV export obsahuje aktuální výběr napříč stránkami; samostatný seznam otevřených úkolů obsahuje prioritu a odkazy na zdrojové řádky. Poznámky nemění zjištění ani původní data.
- Rozklikávací panel v aplikaci vysvětluje použité technologie, kontrolní postup a hranice ukázky.
- Omezuje velikost a strukturu importů, odmítá vyhrazené názvy sloupců, bezpečně zobrazuje text a při exportu neutralizuje vzorce, které by mohl spustit tabulkový procesor.
- Obsahuje automatizované testy a reprodukovatelný benchmark se 20 000 objednávkami a 20 000 zásilkami včetně scénáře s mnoha duplicitami.

### Jak se používá a co bylo použito

1. Vyberte připravený scénář, nebo nahrajte export objednávek a zásilek jako dvě CSV. Aplikace před kontrolou ověří strukturu a velikost vstupu.
2. Projděte souhrn a seznam zjištění. Filtrujte podle závažnosti a otevřete původní řádky; u sporných případů přidejte poznámku ke kontrole.
3. Exportujte všechna nebo filtrovaná zjištění do CSV/JSON, případně samostatný seznam otevřených úkolů. Stejná pravidla lze spustit z CLI pro opakovatelný report.

Použito je **JavaScript ES modules, HTML/CSS, Node.js, vlastní CSV parser a vestavěný `node:test`**. Kontroly jsou pravidlové, bez LLM a bez odesílání importovaných dat na server. Kód pro načtení, párování a report je sdílený mezi prohlížečem a CLI; webové jádro nepoužívá Python ani databázi. Samostatná analytická ukázka používá Python/SQLite; napojení na e-shop zde není.

### Jak by šlo řešení zavést ve firmě

Prvním krokem by byl schválený vzorek anonymizovaných exportů a společná definice identifikátorů, stavů objednávek a výjimek. Pak by se pravidla ověřila proti známým případům, nastavily hranice a zodpovědnost za řešení nálezů. CLI lze použít jako základ pravidelné kontroly exportů; pro týmovou práci by bylo potřeba doplnit bezpečné sdílené úložiště, přihlášení, historii oprav a provozní monitoring. Konektor na firemní systémy a plánované spouštění jsou **možná rozšíření**, nikoli funkce této ukázky.

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
- Browser-local CSV import, source inspection, findings filters, review notes, and CSV/JSON exports. A filtered CSV includes all matching findings across pages; a separate open-issues queue includes priority and source-row references. Review notes never change findings or original data.
- An expandable in-app note explains the technologies, data flow, and demo limits.
- Defensive CSV parsing and export: schema and size limits, reserved-header rejection, safe text rendering, and spreadsheet-formula neutralization.
- Reproducible tests and a 20,000 + 20,000 row benchmark, including a duplicate-heavy case.

### Workflow and implementation

Choose a fictional scenario or import separate orders and shipments CSV files. Inspect and filter findings, open the source rows, add review notes, then export CSV/JSON or an open-issues queue. The same rules can generate a repeatable report from the CLI.

The implemented stack is **JavaScript ES modules, HTML/CSS, Node.js, a custom CSV parser, and built-in `node:test`**. Reconciliation is deterministic; imported files stay in the browser. The web engine uses no LLM or database. A separate Python/SQLite report is available under analysis/; there is no live commerce integration.

### Possible company adoption

Start with approved anonymized exports and agree on IDs, order states, and exception rules. Validate findings against known cases before scheduling CLI reports. Teamwide use would additionally require access control, shared storage, review history, monitoring, and a maintained source-system connector. These are proposed extensions, not current features.

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
