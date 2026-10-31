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
