# Proposal

## Why

The app already offers a Previous Weeks navigation item, but it is disabled, so users cannot browse a season's weekly scores from one place. A score grid will make week-by-week results easy to compare and provide direct access to the existing pick view for each week.

## What Changes

- Enable the Previous Weeks page and display one row per week from week 1 through the configured current week, inclusive.
- Display active-season players as columns and their completed-game points for each week in the intersecting cells.
- Include NPC players by default and provide an NPC visibility toggle.
- Include points from admin-overridden picks by default and provide an exclusion toggle when those points exist.
- Show completed-game points only for the current week, and identify that row as in progress when applicable.
- Make each week navigable to the pick view using the `week` and `season` query parameters used by the home-page historical-picks link.

## Capabilities

### New Capabilities
- `weekly-score-history`: Browse current-season weekly player scores and open a week's pick view.

### Modified Capabilities

## Impact

- Adds the `/picks/previousWeeks` route and enables its existing navigation entry in `app/responsiveDrawer.jsx`.
- Reuses current-week, active-season player, pick, and score data from `app/utils/db.ts` and `app/serverActions/users.ts` where practical.
- Links to the existing `/picks/view` route; no scoring-rule changes or new external services are intended.
