# Spec Delta

## MODIFIED Requirements

### Requirement: Change the configured week and season
An administrator SHALL be able to change the current week and season only after a complete, valid team-record snapshot exists for the configured season and week being left. If that exact snapshot is missing, the system SHALL fetch and persist it before changing the period. Before the period changes, completed scores available from MySportsFeeds for the current week's games SHALL be saved. If the required snapshot cannot be fetched or persisted, the configured period SHALL remain unchanged; records from another week or season SHALL NOT be used as a fallback.

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
