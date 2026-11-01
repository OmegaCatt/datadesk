# Decisions

## 2026-11-01: Document a realistic adoption path

Keep the GitHub README explicit about the implemented browser/CLI workflow and technology. Separate proposed company integrations, shared review history, and access control from features already present. Preserve fictional examples and the distinction between findings and human review notes.

## 2026-10-31: Explain the implementation and export the active selection

Show a native expandable technical note in the interface so the data flow and limits are inspectable without leaving the app. Add a CSV export derived from the same severity, review, and search filters as the findings view. Export every matching row across pagination, while keeping the complete report and separate open-work queue available.

## 2026-10-31: Open work queue

Export unreviewed findings as a separate CSV queue with priority and source references. Keep the complete findings export and original reconciliation result intact. Review status reflects human triage, never data correction. Use the existing spreadsheet-safe CSV writer for both exports.

## 2026-10-29
- Build an entirely new portfolio; no dependency on prior applications.
- First deliverable uses fictional demonstration data, per user choice.
- Start with a browser-local deterministic engine and matching Node CLI. This makes the demonstration reproducible without API keys or server-side data storage.
- Keep findings immutable and review decisions separate. Acknowledging a finding does not make invalid data valid.
- Create a dedicated local Git repository. External GitHub publication is not assumed.
- Defer additional formats until core reconciliation has meaningful tests.

## 2026-10-30: Bilingual repository description

Keep Czech first in the GitHub README and add an English section with the same product scope. The app interface remains Czech; the English text explains it to international employers without claiming an English UI.

