# Team Record Snapshots Specification

## Purpose

Keeps complete team records as a season-scoped weekly history so page views do not depend on MySportsFeeds and future consumers can analyze changes over time.

## Requirements

### Requirement: Capture one team-record snapshot for each week
The system SHALL keep a complete team-record snapshot for each captured week within its season, including the week number, team identifiers, wins, losses, ties, points for, points against, and capture timestamp. A snapshot SHALL represent the configured week being left, not the destination week.

#### Scenario: Leave a week with no snapshot yet
- **WHEN** an administrator changes the configured period and no snapshot exists for the current season and week
- **THEN** the system fetches and validates the current season's team records and stores them as that week's snapshot before committing the period change

#### Scenario: Leave a week that already has a snapshot
- **WHEN** an administrator changes the configured period and a snapshot already exists for the current season and week
- **THEN** the system reuses the saved snapshot without fetching or overwriting that week's records

#### Scenario: A new season is selected
- **WHEN** an administrator changes the period to a different season
- **THEN** the system stores any missing snapshot under the season and week being left and does not copy records from that season into the destination season

### Requirement: Require a valid snapshot when one is missing
The system SHALL validate a newly fetched team-record set as complete before storing it. If the required snapshot is missing and retrieval, validation, or persistence fails, the system SHALL block the period change and preserve existing snapshots.

#### Scenario: Required refresh fails
- **WHEN** a missing period snapshot cannot be fetched, is empty, incomplete, duplicated, malformed, or cannot be persisted
- **THEN** the system reports the failure and does not commit the period change

### Requirement: Read team records from the active season's history
Pick entry and pick view SHALL load team details from the latest available snapshot for the active season and SHALL NOT request the MySportsFeeds team-records feed during page load. They SHALL NOT use records from another season. If the active season has no readable snapshot, those pages SHALL identify team records as unavailable while remaining usable.

#### Scenario: Active-season snapshot is available
- **WHEN** a user opens pick entry or pick view and the active season has a readable snapshot
- **THEN** team detail displays use the latest active-season snapshot without a live team-record request

#### Scenario: Active-season snapshot is missing or unreadable
- **WHEN** a user opens pick entry or pick view and the active season has no readable snapshot
- **THEN** the page identifies team records as unavailable, does not make a live team-record request, and remains usable

#### Scenario: Only another season has a snapshot
- **WHEN** the requested active season has no snapshot but another season does
- **THEN** the system does not use the other season's records
