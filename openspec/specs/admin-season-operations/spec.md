# Admin Season Operations

## Purpose

Describe the existing administrator workflows for season membership, game periods, and player picks.

## Requirements

### Requirement: Restrict administrative operations
Administrative season membership, current-week changes, player-pick overrides, and MySportsFeeds diagnostics SHALL be available only to signed-in users whose email is listed in `ADMIN_EMAILS`.

#### Scenario: Non-administrator opens an administrative page
- **WHEN** the user's email is not listed in `ADMIN_EMAILS`
- **THEN** the page displays an authorization message instead of the management interface

#### Scenario: Non-administrator invokes a protected operation
- **WHEN** the user invokes a protected administrative server action
- **THEN** the operation rejects the request

### Requirement: Manage active-season membership
An administrator SHALL be able to select a season and save its complete user membership list. Saving SHALL add that season to selected users and remove it from users not selected, without changing their membership in other seasons.

#### Scenario: Save season membership
- **WHEN** an administrator saves the selected users for a season
- **THEN** that season is present for selected users and absent for all other users

### Requirement: Change the configured week and season
An administrator SHALL be able to change the current week and season. Before the period changes, completed scores available from MySportsFeeds for the current week's games SHALL be saved.

#### Scenario: Apply a new period
- **WHEN** an administrator submits a different week or season and the snapshot for the current period exists or is successfully fetched and persisted
- **THEN** the application saves available completed-game scores and updates the configured period

#### Scenario: Team-record refresh fails
- **WHEN** the current-period snapshot is missing and the team-records provider is unavailable or returns invalid data
- **THEN** the application reports the failure and leaves the configured period unchanged

#### Scenario: Team-record persistence fails
- **WHEN** the current-period snapshot is missing, valid team records are fetched, but the snapshot cannot be committed to the database
- **THEN** the application reports the failure and leaves the configured period unchanged

#### Scenario: Retry after a failed period change
- **WHEN** an administrator retries after the provider or database recovers
- **THEN** the application checks for the exact current-period snapshot, fetches it if still missing, and changes the period only after it exists in the database

#### Scenario: Current-period snapshot already exists
- **WHEN** an administrator changes the period and a snapshot already exists for the configured season and week
- **THEN** the application reuses it and does not require another MySportsFeeds team-records request

### Requirement: Require a source-period snapshot before changing the period
A period change SHALL require a complete, valid team-record snapshot for the configured season and week being left. If the exact snapshot is missing, the system SHALL fetch and persist it before changing the period. Records from another week or season SHALL NOT be used as a fallback.

#### Scenario: Capture the configured source period
- **WHEN** an administrator changes the period and no snapshot exists for the configured season and week
- **THEN** the system fetches and persists a complete valid snapshot for that exact period before updating the configured period

#### Scenario: Reuse the configured source-period snapshot
- **WHEN** an administrator changes the period and a complete valid snapshot already exists for the configured season and week
- **THEN** the system reuses that snapshot without requiring another team-records request

### Requirement: Record a player pick after kickoff
An administrator SHALL be able to load locked games for a selected player and week/season, change choices, and save those overrides. A saved override SHALL be marked as an admin override and SHALL be attributed to the selected player.

#### Scenario: Save an override for a locked game
- **WHEN** an administrator saves a valid choice for a game that has started
- **THEN** the player's choice is upserted and marked as an admin override

#### Scenario: Attempt to override an unlocked game
- **WHEN** an administrator submits an override for a game that has not started
- **THEN** the server rejects the override

### Requirement: Add the current week's games
The add-games flow SHALL load the current week's games and available spread data from MySportsFeeds. It SHALL allow a spread and favorite to be selected for each game and submit the games for storage in the current season.

#### Scenario: Add games with spreads selected
- **WHEN** spreads have been provided for all loaded games and the user submits them
- **THEN** the games are stored with the configured current season
