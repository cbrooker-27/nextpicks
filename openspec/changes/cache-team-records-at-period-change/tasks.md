# Tasks

## 1. Season-scoped weekly snapshots

- [x] 1.1 Add a season-keyed MongoDB document with a `weeks` array of complete team-record snapshots; verify round-trip reads retain season, week, teams, and capture timestamp.
- [x] 1.2 Add exact-season/week lookup and prevent duplicate or silent overwrite of an existing weekly snapshot; verify existing entries remain unchanged when a period is revisited.
- [x] 1.3 Validate exactly 32 unique NFL team IDs and finite, non-negative integer W/L/T/PF/PA fields; verify empty, partial, duplicate, and malformed payloads are rejected without changing stored history.

## 2. Period-change gate and recovery

- [x] 2.1 Update the administrator period-change action to check for the configured source season/week snapshot first and fetch blocking, bounded standings only when that exact entry is absent; verify an existing entry avoids an MSF request and a missing entry makes one awaited request.
- [x] 2.2 Commit a newly validated weekly entry and the selected current period in one MongoDB transaction; verify provider, validation, and transaction failures preserve the configured period and all existing snapshots.
- [x] 2.3 Update the change-week UI to show progress and actionable failure feedback and permit retry; verify retries reuse a persisted exact-period entry and successful changes update the displayed period.
- [x] 2.4 Cover authorization and completed-score finalization; verify non-administrators are rejected and a failed snapshot gate can be retried without losing already-saved game scores.
- [x] 2.5 Verify season transitions snapshot the source season/week only and never copy entries into the destination season.

## 3. Local snapshot consumers

- [x] 3.1 Replace pick-entry and pick-view team-record feed requests with the latest snapshot for the active season; verify team details come from local data and no page-load team-record request is made.
- [x] 3.2 Surface a missing or unreadable active-season snapshot while keeping pick entry and viewing usable; verify another season's records are not shown and no live fallback occurs.
- [x] 3.3 Update pick-entry and pick-view tests for cached records, missing-season data, and provider independence; verify Add Games retains its separate games and odds behavior.

## 4. Bootstrap and operational documentation

- [x] 4.1 Add an admin-only bootstrap action that fetches, validates, and stores an explicitly week-keyed snapshot for the currently configured season; verify it reports the stored season, week, and team count and refuses invalid data.
- [x] 4.2 Document the required pre-cutover backfill, source-period indexing, no-overwrite/retry behavior, and no-cross-season rollover; verify the documented steps match the implementation.
- [x] 4.3 Run targeted snapshot, period-change, and page-consumer tests plus strict OpenSpec validation; verify all pass before local-only readers are enabled.
