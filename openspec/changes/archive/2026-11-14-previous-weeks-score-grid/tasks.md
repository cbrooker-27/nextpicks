# Tasks

## 1. Add the previous-weeks route and score data

- [x] 1.1 Add a thin `/picks/previousWeeks` route wrapper and a sibling page component that loads the configured current week and active-season score stats; generate rows from week 1 through the current week and display completed-game score values. Add loading and explicit failure states. Verify with focused page tests that the row range and score cells match the loaded stats.

## 2. Implement grid interactions and navigation

- [x] 2.1 Render the scores in a horizontally scrollable table with players as columns; add the default-on NPC filter and conditional admin-points exclusion switch, and identify an in-progress current-week row. Verify with page tests that NPC filtering and admin-point subtraction update the visible cells and that current-week live points are not included.
- [x] 2.2 Link each week label to `/picks/view?week=<week>&season=<season>` and enable the existing Previous Weeks drawer item. Verify with a page test that each row link carries the correct parameters and confirm the drawer item is enabled and opens the route.

## 3. Verify feature integration

- [x] 3.1 Run the previous-weeks page tests and the existing pick-view and weekly-score-card tests with `npm test -- --runInBand app/picks/previousWeeks app/picks/view/view.test.jsx app/components/WeeklyScoreCard.test.jsx`, then lint the changed route and navigation files with `npx eslint app/picks/previousWeeks app/responsiveDrawer.jsx`.
