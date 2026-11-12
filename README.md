# DataDesk

## Rychlá ukázka pro zájemce a HR

Porovná objednávky se zásilkami, ukáže nesrovnalosti a připraví Excel report.

**[Prohlédnout veřejnou ukázku](https://omegacatt.github.io/datadesk/portfolio/#datadesk)** - bez instalace a přihlášení.

**[Otevřít živou aplikaci](https://omegacatt.github.io/datadesk/)** - můžete si ji rovnou vyzkoušet v prohlížeči.

## Spuštění krok za krokem (Windows)

1. Nainstalujte **Node.js 24 nebo novější** z oficiálního webu [Node.js](https://nodejs.org/en/download/). Potom zavřete a znovu otevřete Terminál, pokud už běžel.
2. Nahoře na této stránce GitHubu klikněte na zelené **Code** a potom **Download ZIP**.
3. Stažený ZIP rozbalte: pravým tlačítkem → **Extrahovat vše**. Otevřete rozbalenou složku `datadesk-main`. Pokud je uvnitř ještě jedna stejně pojmenovaná složka, otevřete i ji; musíte vidět soubor `package.json`.
4. Otevřete v této složce **Terminál**. Jednoduchá cesta: v horním adresním řádku Průzkumníka napište `powershell` a stiskněte **Enter**. Otevře se příkazové okno přímo v této složce.

Napište tento příkaz a stiskněte **Enter**:

```powershell
node scripts/serve.mjs
```

Terminál **nechte otevřený**. To, že příkaz dál běží a nevrací se nový řádek pro psaní, je v pořádku. V prohlížeči otevřete:

**[http://127.0.0.1:4173](http://127.0.0.1:4173)**

Adresa vede jen do vašeho počítače. Aplikace používá připravená **fiktivní data**. Na úvodní stránce klikněte na **1. Otevřít skutečný nález**. Uvidíte chybu i původní řádky. Potom můžete stáhnout Excel report.

**Vypnutí:** vraťte se do Terminálu a stiskněte **Ctrl+C**. Pro příští spuštění znovu otevřete Terminál ve stejné složce a napište už jen spouštěcí příkaz výše.

Pokud se objeví chyba, otevřete [řešení běžných potíží a další možnosti](docs/SPUSTENI.md). Vývojové testy ani znalost programování nejsou podmínkou pro prohlédnutí veřejné ukázky.

---

## Orientace v aplikaci (11. 11. 2026)

Při první návštěvě se otevře stručný návod. Po zavření si aplikace v tomto prohlížeči zapamatuje potvrzení; změna nemá vliv na obchodní data. V hlavičce lze kdykoli otevřít **Jak aplikaci používat** a **Technické informace**. Oba obsahy odkazují na úplný README zde na GitHubu. Pokud úložiště prohlížeče není dostupné, návod lze zavřít a aplikace dál funguje.

Pískové a grafitové pracovní rozhraní s okrovým akcentem. Dekorativní gradient, blur, stíny a animace byly odstraněné; výpočet, zdroje, kontrolní stavy a exporty zůstávají stejné.


**Kontrola kvality dat a párování objednávek se zásilkami.** Ze dvou CSV/XLSX exportů vzniknou dohledatelné nálezy, kontrolní případ, Excel report a reprodukovatelná SQL analýza.

[Veřejná funkční aplikace](https://omegacatt.github.io/datadesk/) · [Galerie serverových projektů](https://omegacatt.github.io/datadesk/portfolio/) (označené záznamy) · [CI](https://github.com/OmegaCatt/datadesk/actions/workflows/ci.yml)

## Ukázka za dvě minuty

V aplikaci otevřete „Krátký průchod od chyby k reportu“: nález → původní řádky → poznámka → zdroje → skutečný Excel report. Tlačítka používají právě načtený případ a nepřepisují vlastní data. Bezchybný scénář nevytváří ukázkovou chybu. [Portfolio](https://omegacatt.github.io/datadesk/portfolio/) staví vedle sebe tři hlavní pracovní situace; ostatní projekty zůstávají rozbalitelné.

## Pracovní postup

1. Vyberte jeden ze tří fiktivních scénářů nebo nahrajte objednávky a expedici. CSV nabízí výslovný oddělovač; XLSX výběr viditelného listu a hlavičky.
2. Potvrďte mapování sloupců a formát data s náhledem originál → výklad. Například 03/04/2026 se bez potvrzení neodhaduje. Profil se uchová místně. Originální hodnoty a počáteční nuly ID se nepřepisují.
3. Projděte chyby a upozornění: neplatné hodnoty, duplicitní/rozporné identity, chybějící vazby, množství a chronologie. Každý nález odkazuje na skutečný zdrojový řádek. Rozporné duplicity se nevyřeší automatickým výběrem prvního záznamu.
4. Přidejte poznámku ke kontrole a exportujte nálezy, filtrovaný výběr nebo frontu otevřených úkolů. Prověření není oprava vstupních dat.
5. Uložte celý případ včetně vstupů/poznámek a SHA-256. Obnovení zkontroluje otisk a pravidla spustí znovu; nedůvěřuje uloženému výsledku. Otisk není podpis ani důkaz pravosti původu.
6. Stáhněte pětilistý Excel report nebo spusťte analytický SQL postup nad ověřeným případem.

## Excel a SQL

**Exportovat výsledky → Excel report** vytvoří Přehled, Objednávky, Expedice, Nálezy a Pravidla. Součty/podíly jsou skutečné vzorce; zdrojové texty se nevkládají jako vzorce. Vstupní data a nálezy jsou snímek exportu. Obnovují se novým zpracováním a exportem nebo z uloženého případu:

```powershell
node scripts/export-workbook.mjs pripad.json report.xlsx
python analysis/analyze.py after.json --before before.json --output-dir analytics-output
```

[SQL postup](analysis/ANALYTICS.md) používá Node k ověření otisku a přepočtu stejným validačním enginem; Python vytváří paměťovou SQLite databázi a provádí čitelné SQL:

- měsíční částky podle obchodu a měny, bez nejednoznačných duplicit/neplatných částek;
- neprověřené nálezy podle období a obchodu, s výslovně neznámým obdobím;
- nové/zmizelé/nezměněné nálezy a změna kontroly mezi dvěma běhy, bez falešné změny pouhým přeuspořádáním zdrojových řádků.

Měny se neslévají ani nepřepočítávají. Skupinový součet nálezů není globální počet, pokud nález zasahuje více skupin. Nejde o účetní výkaz. Samostatný Python report a nezávislé SQL pokrytí jsou v [analysis/README.md](analysis/README.md). Excel není Power BI ani Power Query; vzorce byly přepočtené v nezávislém tabulkovém nástroji, desktopový Excel nebyl součástí ověření.

## Technologie a data

JavaScript ES modules, HTML/CSS, vlastní CSV parser, lokálně přiložený **SheetJS 0.20.3**, module workers, Web Crypto SHA-256, Node.js a node:test. Volitelná analytika Python 3.13/SQLite/SQL. Stejný validační engine používá UI i Node CLI. Žádný LLM, API klíč, CDN načítaná knihovna nebo upload služba; import/export probíhá v prohlížeči.

Poznámky připravených scénářů zůstávají v localStorage. Importované případy a poznámky jsou v paměti, dokud je uživatel výslovně neuloží jako JSON. Mapovací profily jsou místní v prohlížeči. Není zde sdílená databáze, účty ani podepsaný audit.

## Limity a ověřování vstupu

Do 20 000 řádků a 2 000 000 bajtů na soubor. XLSX: nejvýše 32 MB skutečně rozbaleného obsahu, 256 částí, 16 listů, 64 sloupců; hlavička 1–25. Vzorce a chybové buňky ve vybrané oblasti, sloučené datové buňky, makra a externí odkazy se odmítají. Parser běží ve workeru. Formátovaná ID zůstávají textem; neobvyklé formáty mohou vyžadovat opravu zdrojového exportu.

Podporované formáty data jsou auto (ISO a den.měsíc), ISO, den.měsíc, den/měsíc a měsíc/den. Metadata výkladu zůstávají součástí případu i otisku vedle originálu. Neplatné datum je nález, nikoli vymyšlené datum. CSV výstupy chrání textové buňky proti spuštění vzorce.

## Spuštění a kontrola

Node.js 24, běh bez instalace balíčků:

```powershell
node scripts/serve.mjs
```

[127.0.0.1:4173](http://127.0.0.1:4173). Vývojové ověření:

```powershell
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm test
python -m unittest discover -s analysis -v
node scripts/qa-xlsx.mjs
node scripts/qa-formats.mjs
node scripts/qa-demo.mjs
node scripts/qa-portfolio.mjs
pnpm build
```

46 Node a 9 Python testů. Browser QA: skutečné sešity, workery, list/hlavička, mapování, profil dat/oddělovače, report, odmítnutí vzorce bez ztráty případu a mobil. Celý XLSX průchod prošel i na skutečné veřejné URL bez přihlášení. Volitelné PLAYWRIGHT_EXECUTABLE_PATH / DATADESK_QA_BASE_URL, pro analytiku DATADESK_NODE. Detaily a měření v [QA](docs/QA.md); kód [b517386 úspěšně prošel CI](https://github.com/OmegaCatt/datadesk/actions/runs/42729968607).

## Zavedení do firmy

Začít dvěma schválenými exporty, potvrdit význam identifikátorů, měn, stavů a pravidel. Ručně zkontrolovat referenční případy a dohodnout vlastníka opravy. Pro sdílení přidat účty, řízení přístupu, historii a retenci; pro automatický pravidelný běh konektor a monitoring. Chybí slíbený termín expedice, proto nelze tvrdit včasnost doručení. Současná ukázka neprovádí tiché opravy ani zápisy do e-shopu.

## English

First-time visitors see a keyboard-accessible guide; persistent header buttons reopen usage and technical information with a link to this README. Acknowledgement is browser-local and does not store business records. A warm paper/graphite interface with an ochre accent replaces decorative gradients, blur, shadows and animation. Reconciliation, provenance and exports retain the same behavior.


A fictional-data reconciliation app with source-row findings, CSV/XLSX imports, explicit mapping/date profiles, review notes, portable fingerprinted cases, a five-sheet Excel report and reproducible SQLite analysis. The same deterministic JavaScript engine runs in the browser and Node CLI; currencies remain separate and ambiguous duplicates are excluded from financial totals.

XLSX runs in bounded module workers with a locally vendored SheetJS build; formulas/macros/external links are rejected. Original values and date-interpretation metadata are retained. Case restoration validates and recalculates instead of trusting saved results. Python/SQL adds monthly amounts, open findings and cross-run transitions. Reports refresh by regeneration, not native Power Query.

A guided walkthrough opens a real finding, preserves source data and exports the actual workbook. The portfolio gallery presents three main cases, two live apps and a clearly labelled local CompanyAtlas recording with captions.

Use the public GitHub Pages app or node scripts/serve.mjs (4173). No LLM, API keys or upload service. 46 Node and 9 Python tests plus browser QA, including the full public XLSX workflow, passed. Company adoption needs agreed source contracts, ownership of corrections, shared access/audit/retention and a tested connector. Review notes are not data repair or a tamper-proof approval system.
