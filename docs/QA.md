# Regrese DOC-5: fokus po zavření nápovědy - 12. 11. 2026

Opožděná událost close už nepřepisuje mezitím výslovně přesunutý fokus. Původní chování se prokázalo v prohlížeči: technický dialog → zavření a okamžité zaměření tlačítka používání → starý close vracel fokus na technické tlačítko. Oprava zachová nové zaměření; Enter otevře správný návod. Stejná regrese je součástí skutečných browser kontrol, původní očekávání klávesnice ani rychlého reloadu nejsou oslabená. Záložní návrat fokusu zůstává zachovaný, pokud nové zaměření neexistuje.

První neúspěšné OfferLens CI je [zachované v historii](https://github.com/OmegaCatt/offerlens/actions/runs/43320912740). Jde o omezenou opravu nápovědy, obchodní výpočty a data nemění.

# Ověření jednoduchého spuštění - 12. 11. 2026

README začíná návodem pro netechnického zájemce: stažení a rozbalení ZIP, otevření PowerShellu ve složce, přesný příkaz, adresa v prohlížeči a ukončení Ctrl+C. Vývojové testy jsou oddělené, volitelné AI/PDF požadavky popsané samostatně.

Ověřena nová kopie sledovaných zdrojů bez místních env souborů, uživatelských databází a předem instalovaného node_modules. Místní HTTP server vrátil 200 a správnou stránku aplikace. Pro zachování běžících služeb byla zvolena náhodná loopback adresa; hodnoty běžných portů v README odpovídají vstupním serverovým skriptům. ReleaseGuard doinstaloval runtime závislosti přes npm; CompanyAtlas použil nový Python venv a instalaci requirements.txt. Ostatní aplikace nepotřebují runtime balíčky pro základní ukázku.

Znovu prošlo **46 Node + 9 Python testů**. Běžné pracovní průchody mají samostatné prohlížečové regrese v tomto repozitáři. Toto ověření nenahrazuje kontrolu instalátoru Node/Python na každém počítači ani nepředstavuje obecnou záruku správnosti.

# Regrese UX-1b – rychlé zavření a reload

První Linux main CI odhalilo závod: potvrzení úvodu v události close se někdy nestihlo zapsat před reloadem. Nyní se zapisuje synchronně v Escape/cancel a tlačítkách před zavřením; close je záložní cesta. Původní neúspěšný běh zůstává v Actions. Browser test stále provádí okamžitý reload, očekávání nebylo oslabeno ani přidán čekací čas.

# UX-1 až UX-7 – 11. 11. 2026

Místně ověřené unit testy: **46 Node + 9 Python**.

Pískové a grafitové pracovní rozhraní s okrovým akcentem. Dekorativní gradient, blur, stíny a animace byly odstraněné; výpočet, zdroje, kontrolní stavy a exporty zůstávají stejné.

Všech sedm aplikací má první přístupný dialog a stálé ovládání nápovědy v hlavičce. Playwright ověřuje skutečný první vstup, obě části, GitHub odkaz, Tab/Shift+Tab, Escape, návrat fokusu, potvrzení po reloadu a mobil. CompanyAtlas čeká s přihlášením na zavření úvodu; hlavička se testuje po přihlášení. Legacy pracovní průchody pokračují po skutečném zavření úvodu. Aktuální commit, CI a přesný rozsah ověření této etapy jsou vedené v hlavním Portfolio_PROGRESS.md; starší zápisy níže jsou historické.

# Ukázky 11. 11. 2026 – DEMO-3/4/6

Přidaný průchod skutečný nález → původní řádky → poznámka → Excel. Štítek vstupu odráží CSV/XLSX. Galerie má tři hlavní případy, čtyři rozbalitelné technické projekty a 27,48s skutečný místní záznam CompanyAtlasu s osmi českými titulky. AI při nahrávání vypnutá. Lokální server má správné MIME, adresářové indexy a jednorozsahové HTTP Range pro posun videa.

Místně prošlo: 46 Node + 9 Python testů, XLSX, CSV/formáty, nový průchod a galerie (přehrání/seek/titulky/obrázky/kotvy/mobil/klávesnice). Veřejné nasazení této etapy a přesné CI se zaznamenávají samostatně v hlavním protokolu; starší audit níže zůstává historický.

# Opakované ověření 10. 11. 2026

**45 Node + 9 Python testů prošlo.** Znovu spuštěné prohlížečové QA ověřilo skutečný pracovní postup na dočasných fiktivních podkladech, desktop i mobil a JavaScript chyby. Nová kontrola zopakovala běžné i připravené chybové toky. Původní počet testů zůstává beze změny.

Ověřený předchozí commit 75ec08f: [GitHub Actions](https://github.com/OmegaCatt/datadesk/actions/runs/42730927126); dostupnost jeho artefaktů byla ověřena. Aktuální revize dokumentace/oprav je kontrolována novým CI. Jeho přesný commit a výsledek jsou v hlavním Portfolio_PROGRESS.md. Staré věty o čekající publikaci v rozbaleném archivu platily jen pro dobu daného zápisu.

<details>
<summary>Historické výsledky, původní metriky a omezení</summary>

## DD-1/2 – 10. 11. 2026

Hotovo: ruční oddělovač CSV (včetně svislé čáry), potvrzený výklad datumu s náhledem a profily, původní hodnoty i metadata v případu/otisku. Excel report má původní datum, použitý formát a normalizovaný den. Automatická volba nepřijímá nejednoznačná lomítka. Nové SQL analýzy: měsíční částky po měnách, otevřené nálezy podle obchodu/období a změny mezi dvěma ověřenými případy. Viz [analysis/ANALYTICS.md](../analysis/ANALYTICS.md).

Ověřeno 45 Node + 9 Python testy. Browser QA XLSX a nový CSV/formátový průchod prošly: volba svislé čáry, výklad 03/04/2026 jako 3. dubna, zachovaný originál, metadata v JSON, uložené profily, mobil a žádné JS chyby. SQL testy kontrolují měny, duplicity, chybné částky/datumy, pouhé přeuspořádání řádků, zánik nálezu, otisk a skutečný CLI export. Ostatní starší záznamy níže jsou historické.

## Ověřený vzdálený běh

GitHub Actions úspěšně ověřily kód `eae6629`: [výsledek kontroly](https://github.com/OmegaCatt/datadesk/actions/runs/42679919818). Výsledek se vztahuje k uvedenému commitu; změny pouze dokumentace nepřidávají nové funkce.

# DD-3, DD-5, DD-6, DD-7 – XLSX a report

Hotovo místně: XLSX import ve workeru, výběr listu/hlavičky, omezení skutečné dekomprese, zachování formátovaných ID, odmítnutí vzorců a chybných buněk, Excel export s pěti listy a vzorci, opakovatelné CLI obnovení a fyzické řádky zdroje.

Ověření: 43 Node testů a 4 Python testy. Browser QA používá skutečný server s CSP: dva sešity, výběr listů a hlavičky 2, mapování, čistý výsledek, řádek zdroje 3, stažení Excel reportu, odmítnutí vzorce bez ztráty předchozího případu a mobilní šířka 390 px. SQL/JS metrika pokrytí se shodla; vzorec podílu se v nezávislém tabulkovém nástroji změnil po úpravě vstupu a vrátil po obnovení. Desktopový Excel nebyl spouštěn.

Benchmark XLSX, jeden místní běh Node 24.22.1: 20 000 řádků, komprimovaně 1 818 858 B, rozbaleně 7 337 642 B; kontrola archivu 157 ms, čtení 1 122 ms. Report pro 20 000 objednávek + 20 000 zásilek: 3 821 516 B, vytvoření 1 858 ms. Nejde o časový příslib pro jiné zařízení. Výstupní report může přesahovat vstupní limit 2 MB; není určen k opětovnému importu celého reportu jako exportu z firemního systému.

Zbývá: ruční nastavení datumových formátů/CSV oddělovače, další SQL analýzy a veřejná dostupnost dema. Automatické formáty zůstávají striktní, nejednoznačné hodnoty se neodhadují. Vzdálený úspěch kódu je doložen odkazem v úvodu.

# Ověření 9. 11. 2026

35 Node testů a 4 Python/SQL testy prošly. Browser QA ověřilo poznámku, export a obnovení případu, přepočet, mapování přejmenovaných sloupců a nulový počet nálezů čistého importu. Desktop 1440 px a mobil 390 px bez JS chyb a vodorovného přetečení. Při prvním průchodu opraveno přetečení tlačítek. Benchmark Node 24.22.1: medián 87,08 ms pro 10 000 + 10 000 a 152,56 ms pro 20 000 + 20 000; pět vzorků, výsledek závisí na zařízení. SQL report je obnovitelný CLI/CSV postup; hotový Power BI/Excel sešit a XLSX import zůstávají další etapou.

# Verification record — 2026-10-29

## Regression check — 2026-10-31

After the filtered-export and technical-note update, `node --test` passed 33/33. Browser QA opened the technical note, selected error findings, downloaded the filtered CSV with eight findings plus header, and checked the 390 px viewport for horizontal overflow. This check does not cover every possible imported CSV.

## Functionality

- Node test runner: 32 tests passed, 0 failed after the duplicate-group fix. Coverage includes reconciliation outcomes, invalid dates and money, CSV quoting/schema, formula-safe export, input immutability and duplicate-heavy groups.
- Browser exercised on the prepared issue, clean and large scenarios. Checked finding detail, review note and reopening, search/filter controls, source pages, JSON download, and a 390 px mobile viewport. The large browser scenario contained 20,000 total records.
- Browser import of two fictional CSV files produced one matched order and no findings. Both sample CSV downloads were checked separately. The original combined-download control was corrected because the browser saved only its first file.
- Default fictional scenario: 49 orders, 47 shipments, 8 errors, 4 warnings and 44 matched orders. Clean scenario: no findings.

## Performance

Node.js 24.22.1, local development machine. Five measured runs after warmup: 20,000 orders + 20,000 shipments, median 211.4 ms (range 174.99–264.69 ms). A single duplicate-heavy run at the same size took 206.64 ms. These measurements are not a latency guarantee across devices.

## Security and limits

- A standard source audit of the initial snapshot found one low-severity local availability issue: repeated expansion of duplicate groups. It was fixed after the audit, and the targeted test plus benchmark pass. The archived report describes the pre-fix snapshot.
- Imported values and review notes render as text. CSV export neutralizes spreadsheet formula prefixes. Import size, row count and field length are bounded; no API credentials are required or stored.
- The source audit does not establish how a future static host enforces response headers. The private preview must be checked independently.
- CSV is supported; XLSX, authenticated multi-user review, live integrations, AI features and a tamper-proof audit log are outside this version.

## Veřejná dostupnost 10. 11. 2026

https://omegacatt.github.io/datadesk/ ověřeno v prázdném browser kontextu bez přihlášení: HTTP 200, moduly/ukázka, uložení případu a mobil bez chyb/přetečení. Celá XLSX regrese proti skutečné veřejné URL prošla: worker, import dvou sešitů, list/hlavička, mapování, čistý výsledek, stažení reportu, odmítnutí vzorce bez ztráty stavu. Sada podporuje DATADESK_QA_BASE_URL; výchozí CI zůstává lokální. Galerie portfolio/ výslovně označuje serverové snímky jako zaznamenané výsledky.


</details>
