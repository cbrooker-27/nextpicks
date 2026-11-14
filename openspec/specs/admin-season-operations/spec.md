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
- **WHEN** an administrator submits a different week or season
- **THEN** the application saves available completed-game scores and updates the configured period

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
