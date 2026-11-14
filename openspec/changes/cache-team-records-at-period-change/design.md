# Design

## Context

See `proposal.md` for motivation. `makePicks` and `view` currently call the MySportsFeeds standings endpoint; `addGames` currently requests games and odds, not standings. The standings URL is season-scoped and returns team IDs with W/L/T/PF/PA. The existing status helper may return `unavailable` at its short page wait while the upstream request continues asynchronously, so it is not sufficient when a missing snapshot is a prerequisite for a period change.

## Goals / Non-Goals

**Goals:**

- Keep a queryable weekly history inside one record per season.
- Capture and preserve the records for the period being left, using an existing exact-period snapshot when available.
- Keep each season's history independent.
- Remove page-load dependence on the MySportsFeeds standings endpoint.
- Preserve the configured period and existing snapshots when a required refresh or write fails.

**Non-Goals:**

- Removing the independent MySportsFeeds games and odds requests used by Add Games.
- Reconstructing historical snapshots for weeks before this feature is deployed.
- Carrying standings forward between seasons or providing an administrator bypass for a missing snapshot.

## Decisions

### Store a weekly array inside one season document

Use one MongoDB document per season with a `weeks` array. Each entry contains the week being recorded, the full team set (provider team ID, wins, losses, ties, points for, points against), and `fetchedAt`. Enforce one entry per week in application logic. The entry is a point-in-time capture, not a mutable live standings record.

Before calling MySportsFeeds on a period change, check for the exact `(season, week)` entry for the currently configured period. If present, use it and do not refresh or overwrite it. If absent, make one blocking request for the current season's standings, validate the entire response, and stage the new entry. The destination period does not affect the snapshot's season/week key.

**Alternative considered:** Replace one season-wide current snapshot on every transition. That would lose the historical points needed for future time-series analysis.

### Validate the complete provider response

Before persistence, require exactly 32 distinct NFL team IDs and finite, non-negative integer values for wins, losses, ties, points for, and points against. Reject empty, partial, duplicated, or malformed responses, even when the HTTP response succeeds. Keep the expected count explicit and covered by tests so a league-size change is deliberate.

### Gate period changes on the exact period being left

Authorize the administrator, finalize any available completed-game scores as today, then require the exact current-period snapshot. If it is missing, use a blocking, bounded request; do not reuse the page helper's short wait plus background continuation. Once a missing snapshot is validated, commit its insertion and the `currentWeek` update in one MongoDB transaction. If an exact snapshot already exists, only the period update is needed.

The UI stays in a submitting state while this work completes. A provider, validation, or database failure displays an actionable error and leaves the period unchanged. The administrator can retry; a retry checks the exact period again, so a snapshot successfully committed during a prior interrupted attempt is reusable without another provider call.

**Alternative considered:** Always refetch even when the exact snapshot exists. That makes retries unnecessarily dependent on MySportsFeeds and can overwrite an already captured historical point.

### Keep snapshots separate by season

Every `weeks` array belongs to exactly one season document. On a season change, record a missing snapshot for the source season/week; do not copy it to or initialize the destination season. A season with no captured weeks has no local records yet, so pages show records unavailable rather than displaying another season's data or making a live fallback call. Its history starts independently as that season's weeks are left and captured.

### Read locally on page loads

Replace the `makePicks` and `view` standings-feed requests with a MongoDB read of the latest available snapshot in the active season. For a historical pick view, retain the current behavior of showing the latest season standings, since the current provider endpoint is itself season-scoped rather than week-specific. If there is no readable snapshot, keep pick entry and viewing usable, show an unavailable status, and use the existing no-team-details presentation. Do not make a live fallback request.

**Alternative considered:** Fetch live standings when the local season has no snapshot. This would restore the page-load dependency and conceal a missing new-season history.

### Preserve failure recovery

- Provider timeout/error or invalid data: do not insert a snapshot or update the period; show the error and allow a fresh retry.
- Database/transaction failure: retain the prior period and existing snapshots; allow retry.
- Snapshot already exists for the exact source period: it is valid data for that period, not a stale fallback, and the period change does not require the provider.
- Completed-game score writes may precede the failed snapshot gate as in the current flow; those writes are safe to repeat and do not change the configured period.

### Bootstrap the active season

An administrator-only **Capture current-week records** action on the Change Week page fetches, validates, and stores the configured season/week without advancing the period. During rollout, use it to create the active-season baseline before opening the pick pages to users; verify the reported season, week, and team count (32). This baseline does not reconstruct missing earlier weeks. If it has not yet been captured, pick pages remain usable but display team records as unavailable. New seasons start with no previous-season data.

## Risks / Trade-offs

- [The provider may be unavailable when the exact period snapshot is missing] → Keep the period unchanged, preserve all existing snapshots, display an error, and allow retry. If the exact snapshot already exists, no provider request is needed.
- [A transaction can fail after a successful provider response] → Commit the new snapshot and period together; leave both unchanged on transaction failure.
- [An active season may have no local snapshot during rollout or a new season] → Backfill and verify the current season before switching readers; keep pages usable and visibly report missing data without a live fallback.
- [An existing snapshot is intentionally not refreshed] → Treat each period entry as a historical capture; correcting it requires an explicit future maintenance path rather than silently rewriting history.
- [The provider may return standings that reflect ongoing-season updates] → Save the capture timestamp with the week key; the snapshot represents the provider's data at capture time, not a guaranteed official end-of-week freeze.
- [The league may expand beyond 32 teams] → Keep the expected count explicit, document it, and cover it in validation tests; update deliberately when the supported league changes.

## Migration Plan

1. Add the season document with weekly snapshots, exact-period lookup, complete-set validation, persistence, and the admin bootstrap action.
2. Use the bootstrap action to capture one explicitly keyed snapshot for the configured season; verify the captured week and all 32 team records before opening pick pages to users.
3. Switch pick entry and pick view to the latest local snapshot for the active season and remove their team-record provider requests.
4. Update period changes to reuse an exact existing source-period snapshot or fetch and transactionally persist a missing one before updating the period.
5. Test that provider failure, malformed/partial data, and database failure block period changes only when the exact snapshot is missing; test that retries reuse a persisted snapshot and that seasons never share records.

Rollback: restore the previous page consumers and period-change flow if local snapshot reads or transition failures cause an operational issue. Retain the additive season documents; previous code can ignore them. Do not roll back to a flow that advances a period despite a missing required snapshot without explicitly revisiting this requirement.
