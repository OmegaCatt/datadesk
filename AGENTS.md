# DataDesk project instructions

Read docs/PROJECT.md and docs/STATUS.md before continuing work. Record material decisions in docs/DECISIONS.md and update STATUS.md with verified results and unfinished work before handoff.

This repository contains DataDesk; the other portfolio applications are maintained in independent repositories. This portfolio demonstration uses explicitly fictional data. Never add personal CV data, credentials or real customer records. No AI API is required for DataDesk's deterministic core.

Keep validation independent of the UI and usable from the CLI. Preserve source rows and original values. Treat conflicting duplicates as unresolved, not as permission to select an arbitrary record. Use integer minor units for money. Do not aggregate different currencies. Escape exported spreadsheet-formula inputs. Never render imported values as HTML.

Validate actual behavior with adversarial cases, browser interaction and a measured larger dataset. Report test and performance results accurately; passing checks do not establish universal correctness or complete security. Do not fabricate outcomes or imply unimplemented Python/SQL features exist.

