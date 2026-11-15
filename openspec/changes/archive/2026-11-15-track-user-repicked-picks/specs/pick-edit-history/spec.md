# Spec Delta

## Purpose

Records user-initiated changes to saved picks and lets administrators review their frequency and history without adding edit details to ordinary pick views.

## ADDED Requirements

### Requirement: Record changes to a user's saved pick
The application SHALL record an event when a user successfully saves a different outcome for their existing non-admin pick before the game starts.

#### Scenario: User changes a saved outcome
- **WHEN** a user saves a different valid outcome for an existing pick and the save succeeds
- **THEN** the application records the player, game, season and week, previous outcome, new outcome, and change timestamp

#### Scenario: User submits an initial pick
- **WHEN** a user saves a pick for a game with no existing saved pick
- **THEN** the application saves the pick without recording a change event

#### Scenario: User resubmits the same outcome
- **WHEN** a user saves the same outcome as their existing pick
- **THEN** the application does not record a change event

#### Scenario: Administrative override is saved
- **WHEN** an administrator saves or changes a pick using the override workflow
- **THEN** the application does not record a user-initiated change event

### Requirement: Provide an administrative pick-change history
The application SHALL provide an admin-only view of user-initiated pick-change events with summary counts and filterable event details.

#### Scenario: Administrator reviews pick changes
- **WHEN** an administrator opens the history view
- **THEN** the view shows the count of distinct player/game picks changed, the number of change events, and event details including player, game, season/week, previous outcome, new outcome, and timestamp

#### Scenario: Administrator filters history
- **WHEN** an administrator filters the history by season/week or player
- **THEN** the summary counts and event details reflect the selected filters

#### Scenario: Non-administrator opens history
- **WHEN** a signed-in user is not authorized as an administrator
- **THEN** the application denies access to the history view and its data
