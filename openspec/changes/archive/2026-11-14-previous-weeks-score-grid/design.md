# Design

## Context

The Previous Weeks navigation item already targets `/picks/previousWeeks` but is disabled, and no route exists there. `getUserStatsForStandings` returns active-season users with per-week completed points and per-week admin-pick points. When asked to include the current week, it refreshes that week's game scores and records live-game points separately from completed-game points. The existing pick view uses `week` and `season` query parameters in its historical-picks link.

## Goals / Non-Goals

**Goals:**
- Reuse existing season, player, scoring, and admin-pick data rather than creating a parallel scoring path.
- Keep the requested player-by-week grid usable when the roster has more columns than fit the viewport.
- Keep the route consistent with the app's thin route-page wrapper pattern.

**Non-Goals:**
- Change scoring rules, store score history, or add a new data endpoint.
- Add cross-season browsing; the grid covers the configured current season.
- Change how the pick-view page interprets its existing query parameters.

## Decisions

1. **Use the standings score action as the grid's data source.** Load the configured current week and call `getUserStatsForStandings` with current-week inclusion enabled. Read each user's `weekN` for displayed completed-game points and `adminPointsWeekN` for the exclusion toggle. This preserves current score semantics and includes finished games in the current week without counting live points. Reimplementing scoring in the page was rejected because it could drift from standings.

2. **Build the grid from the configured season and current week.** Create week rows from 1 through the configured week, in ascending order, and player columns from the returned active-season users. Include NPCs initially; filter them client-side with a toggle. A separate data query for the roster was rejected because the score action already returns that same active-season population.

3. **Apply the admin-points switch to each weekly score.** Start with all points included; show the switch only if the returned users have admin overrides. When disabled, subtract the corresponding `adminPointsWeekN` from each `weekN` value. This follows the existing standings behavior without changing stored scores.

4. **Use a horizontally scrollable semantic table.** Keep week labels in a leading column and player names in headers; use the existing CSS Module convention for overflow and responsive presentation. A card per player or week was rejected because it would no longer provide a directly comparable row-and-column grid.

5. **Link each week label to the existing pick view.** Build `/picks/view?week=<week>&season=<season>` from the row and configured season, matching the home-page historical-picks link. No new view route or navigation state is needed.

## Risks / Trade-offs

- [Many player columns can exceed the viewport] → Place the table in a horizontally scrollable container and retain an identifiable week column.
- [Current-week scores depend on the existing current-week score refresh] → Reuse the established standings action and surface loading or failure rather than rendering a success-shaped empty grid.
- [The current pick view selects the configured season when loading a `week` parameter] → The grid is limited to that same configured season and includes the matching `season` parameter in every link.

## Migration Plan

No data migration is needed. Enable the existing navigation item and add the route; rollback consists of disabling the item and removing the route.
