# Proposal

## Why

Users can change their saved picks before kickoff, but the application overwrites the prior choice and does not record that a different outcome was selected. Recording those changes will let administrators understand how often picks are edited without exposing the information on regular pick views.

## What Changes

- Record a durable event when a user successfully changes an already-saved pick to a different outcome.
- Keep each event's player, game and season/week, previous and new choices, and timestamp; do not record initial submissions, unchanged choices, or administrative overrides.
- Add a separate admin-only view with counts of distinct picks changed and total edit events, plus a filterable event log.
- Preserve the existing current-pick data and ordinary pick-view presentation.

## Capabilities

### New Capabilities
- `pick-edit-history`: Record and inspect user-initiated changes to saved picks.

### Modified Capabilities

## Impact

- Updates the user pick-save flow and its persistence model.
- Adds durable pick-edit event storage and a protected administrative history view.
- No change to scoring, pick outcomes, or the existing admin override workflow.
