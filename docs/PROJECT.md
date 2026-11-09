## DD-1/2 – 10. 11. 2026

Hotovo: ruční oddělovač CSV (včetně svislé čáry), potvrzený výklad datumu s náhledem a profily, původní hodnoty i metadata v případu/otisku. Excel report má původní datum, použitý formát a normalizovaný den. Automatická volba nepřijímá nejednoznačná lomítka. Nové SQL analýzy: měsíční částky po měnách, otevřené nálezy podle obchodu/období a změny mezi dvěma ověřenými případy. Viz [analysis/ANALYTICS.md](../analysis/ANALYTICS.md).

Ověřeno 45 Node + 9 Python testy. Browser QA XLSX a nový CSV/formátový průchod prošly: volba svislé čáry, výklad 03/04/2026 jako 3. dubna, zachovaný originál, metadata v JSON, uložené profily, mobil a žádné JS chyby. SQL testy kontrolují měny, duplicity, chybné částky/datumy, pouhé přeuspořádání řádků, zánik nálezu, otisk a skutečný CLI export. Ostatní starší záznamy níže jsou historické.

# DD-3, DD-5, DD-6, DD-7 – XLSX a report

Hotovo místně: XLSX import ve workeru, výběr listu/hlavičky, omezení skutečné dekomprese, zachování formátovaných ID, odmítnutí vzorců a chybných buněk, Excel export s pěti listy a vzorci, opakovatelné CLI obnovení a fyzické řádky zdroje.

Ověření: 43 Node testů a 4 Python testy. Browser QA používá skutečný server s CSP: dva sešity, výběr listů a hlavičky 2, mapování, čistý výsledek, řádek zdroje 3, stažení Excel reportu, odmítnutí vzorce bez ztráty předchozího případu a mobilní šířka 390 px. SQL/JS metrika pokrytí se shodla; vzorec podílu se v nezávislém tabulkovém nástroji změnil po úpravě vstupu a vrátil po obnovení. Desktopový Excel nebyl spouštěn.

Benchmark XLSX, jeden místní běh Node 24.22.1: 20 000 řádků, komprimovaně 1 818 858 B, rozbaleně 7 337 642 B; kontrola archivu 157 ms, čtení 1 122 ms. Report pro 20 000 objednávek + 20 000 zásilek: 3 821 516 B, vytvoření 1 858 ms. Nejde o časový příslib pro jiné zařízení. Výstupní report může přesahovat vstupní limit 2 MB; není určen k opětovnému importu celého reportu jako exportu z firemního systému.

Zbývá: ruční nastavení datumových formátů/CSV oddělovače, další SQL analýzy a veřejná dostupnost dema. Automatické formáty zůstávají striktní, nejednoznačné hodnoty se neodhadují. CI je připravené; vzdálený úspěch dosud není doložený.

# Etapa 9. 11. 2026

35 Node testů a 4 Python/SQL testy prošly. Browser QA ověřilo poznámku, export a obnovení případu, přepočet, mapování přejmenovaných sloupců a nulový počet nálezů čistého importu. Desktop 1440 px a mobil 390 px bez JS chyb a vodorovného přetečení. Při prvním průchodu opraveno přetečení tlačítek. Benchmark Node 24.22.1: medián 87,08 ms pro 10 000 + 10 000 a 152,56 ms pro 20 000 + 20 000; pět vzorků, výsledek závisí na zařízení. SQL report je obnovitelný CLI/CSV postup; hotový Power BI/Excel sešit a XLSX import zůstávají další etapou.

# DataDesk - product brief

## Objective
Create an independently runnable, credible portfolio application demonstrating data validation, reconciliation, automation and quality assurance. The first version is a portfolio with prepared fictional datasets, as confirmed by the user on 2026-10-29.

## Primary scenario
Compare an order export with a shipment export. Identify missing shipments, orphan shipments, duplicate identifiers, conflicting records and invalid inputs. Preserve source provenance. Provide actionable findings and reproducible exports.

## First release
- Czech, responsive analytical interface with fictional sample scenarios.
- Overview, findings, source data and an explanation of validation rules.
- Search and filter findings; inspect source records and record review decisions.
- CSV and JSON export, with explicit distinction between original findings and review state.
- Same validation engine in the browser and Node CLI, plus automated tests.
- Measured performance on a larger fictional dataset.
- Local Git history, project notes and a private review deployment when available.

## Design direction
Light workspace, dark navy navigation, warm neutral canvas, restrained teal accent, clear status colors, generous spacing and readable tables. Convey a practical data tool rather than a promotional landing page. No invented customer logos, usage statistics or testimonials.

## Boundaries
No login, billing, customer support, live business integrations or AI API in the first version. Do not claim Excel workbook support until implemented and tested. A review decision never modifies the source record. Demo review state may be browser-local and must be identified as such. GitHub publication is a separate step from local version control.

