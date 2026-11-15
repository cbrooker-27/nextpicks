# Design

## Context

User picks are stored as one `userChoices` document per player/game pair. `addUserChoices` currently validates that games are unlocked, then upserts the latest choice, selection time, and `adminOverride: false`. The admin override flow writes the same collection but uses a separate protected server action. Admin pages use `ADMIN_EMAILS` authorization.

## Goals / Non-Goals

**Goals:**
- Keep the latest pick document and existing pick-view behavior unchanged.
- Persist every successful user-initiated outcome change, including repeated changes to a pick.
- Provide admin-only summary and detail queries that can be filtered by period and player.
- Ensure failed pick saves do not leave misleading history events.

**Non-Goals:**
- Track initial submissions, unsaved choice changes in the browser, unchanged resubmissions, or administrative overrides.
- Add edit history to normal pick views or change pick scoring.
- Allow users to edit picks after kickoff.

## Decisions

1. **Store one append-only document per changed outcome in `pickEditHistory`.** Each event records `userId`, `gameId`, `season`, `week`, `previousChoice`, `newChoice`, and a server-generated `changedAt` timestamp. A separate collection avoids an unbounded array on the current pick document and preserves multiple changes to the same pick. The current `userChoices` record remains the source of the latest choice.

2. **Compare persisted and submitted choices in the authenticated user-save operation.** After validating the user's identity and that the game is unlocked, load the existing choice. Write an event only when an existing non-admin choice differs from the submitted choice. An initial save, same-choice resubmission, or admin override does not produce an event. Do not accept history fields from the client.

3. **Commit pick writes and history events together.** Use a MongoDB session transaction for the existing-choice read, pick upserts, and event inserts. This prevents either a changed pick without its audit record or a history record for a failed pick update. Validate a transaction-capable MongoDB deployment in integration tests; do not silently fall back to non-atomic writes.

4. **Build a separate protected admin history view.** Add admin-guarded server actions for filtered event queries and summary counts, and a distinct admin route. Apply `ADMIN_EMAILS` authorization in the server actions as well as the page. Display distinct changed player/game pairs and total change events for the selected filters, with event rows sorted newest first. Filters cover season/week and player; use server-side pagination so history growth does not require loading every event into the browser.

5. **Count distinct changed picks from event identity, not from a mutable flag.** For a filtered result, the number of distinct repicked items is the count of unique `userId`/`gameId` pairs with at least one event; total edit events is the number of matching history records. This makes repeated edits visible in both metrics.

## Risks / Trade-offs

- [Transactions require a transaction-capable MongoDB deployment] → Use the repository's existing transaction conventions and validate against the project's supported MongoDB setup; fail explicitly if the transaction cannot commit.
- [The history collection grows continuously] → Keep documents small, index by period/player/change time, and fetch event rows with server-side pagination.
- [Distinct-count queries may become costly as history grows] → Scope counts to active filters and retain indexed `userId`, `gameId`, `season`, and `week` fields.
- [History contains user-linked activity data] → Restrict both page and server actions to configured administrators; do not expose event data through public pick reads.

## Migration Plan

No backfill is possible because prior pick values were overwritten. Existing picks remain valid and begin producing history only when changed after deployment. Add the collection indexes as part of deployment; rollback can remove the admin route and stop writes while leaving the event collection available for future analysis.
