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

