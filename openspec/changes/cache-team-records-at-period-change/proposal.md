# Proposal

## Why

Pick-entry and pick-view pages request team records from MySportsFeeds every time they load, making a slow or unavailable provider a recurring dependency. Saving one complete snapshot per season/week as the administrator leaves that week removes page-load requests and builds a season-scoped history for future time-series analysis.

## What Changes

- Store one document per season with a weekly array of complete team-record snapshots, each identified by the week being left and its capture timestamp.
- On a period change, reuse the exact current-season/current-week snapshot if it already exists; otherwise fetch and validate records for the current season and save them under the current week before changing the period.
- If a required snapshot is missing and cannot be fetched or persisted, block the period change. Never substitute a different week or season's records.
- Keep each season's history independent. Switching to another season does not copy or roll over records from the previous season.
- Serve the latest available snapshot for the active season to pages that show team details, and remove their direct MySportsFeeds team-record requests.
- Seed and verify a local snapshot for the currently configured season as a rollout prerequisite.

## Capabilities

### New Capabilities

- `team-record-snapshots`: Persist season-scoped weekly team-record snapshots and serve them locally to consumers.

### Modified Capabilities

- `admin-season-operations`: Period changes require the snapshot for the period being left to exist locally or be fetched and persisted successfully.

## Impact

- Affected flows include the administrator period-change page/action, MongoDB access, MySportsFeeds standings retrieval, pick entry, and pick view.
- The MySportsFeeds standings endpoint is season-scoped; each returned standings set is recorded against the configured season and week being left, regardless of the destination period.
- In the current code, pick entry and pick view call the team-records feed. Add Games calls the games and odds feeds, not the team-records feed; those independent calls remain unchanged.
- A new season has its own empty weekly history; no previous-season snapshot is carried forward. Existing score finalization may occur before a required refresh fails, but the configured period must not advance until the missing snapshot is stored.
