# Tasks

## 1. Persist user pick-change events

- [x] 1.1 Define the pick-edit event shape and add indexed storage for `userId`, `gameId`, `season`, `week`, and `changedAt`; verify the indexes and types with focused tests or a schema-level check.
- [x] 1.2 Update the authenticated user pick-save flow to compare each submitted choice with its existing saved non-admin choice and transactionally write history events only for changed outcomes. Verify initial picks and unchanged resubmits create no event, changed picks record previous/new values and server time, admin overrides are excluded, and a failed transaction persists neither change.

## 2. Add protected admin history queries

- [x] 2.1 Implement admin-authorized server actions to filter event rows by season/week and player, sort newest first, paginate results, and calculate total event and distinct player/game counts for the same filters. Verify authorization, filter behavior, pagination, and both counts in server-action tests.

## 3. Build the admin history view

- [x] 3.1 Add a separate admin-only route and navigation entry that displays the summary counts, filters, and event details without changing regular pick views. Verify unauthorized users cannot see the page or retrieve history, and admins can filter and page through events with UI tests.

## 4. Verify integration

- [x] 4.1 Run the pick-save, event storage, admin query, and admin page tests together, then lint the changed implementation files and run the relevant existing pick-entry/admin-override tests to confirm those flows remain unchanged.
