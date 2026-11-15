# weekly-score-history Specification

## Purpose

Lets users compare active-season players' scores across the weeks played so far and open the pick view for a selected week.

## Requirements

### Requirement: Display the current season's weekly score grid
The application SHALL display one row for each week from week 1 through the configured current week, inclusive, with the current season's week number and season available for navigation.

#### Scenario: Open the grid during a season
- **WHEN** a user opens Previous Weeks
- **THEN** the grid shows every week from week 1 through the configured current week, including the current week

#### Scenario: Open a week's picks from the grid
- **WHEN** a user selects a week in the grid
- **THEN** the application opens `/picks/view` with that row's `week` and `season` query parameters

### Requirement: Display active-season players as score columns
The grid SHALL provide a column for each player active in the configured current season, include NPC players by default, and let users show or hide NPC players.

#### Scenario: View all players by default
- **WHEN** a user opens the grid
- **THEN** columns are shown for active-season players, including NPC players

#### Scenario: Hide NPC players
- **WHEN** a user turns off NPC visibility
- **THEN** NPC columns are omitted while non-NPC active-season player columns remain

### Requirement: Show completed-game points in each weekly score cell
Each player-and-week cell SHALL show that player's points earned from completed games in that week, including current-week completed games but excluding points from games that are still live.

#### Scenario: Display a completed week's score
- **WHEN** a week has completed games for a player
- **THEN** that player's cell shows the points earned from those completed games

#### Scenario: Display the current week's score while games remain
- **WHEN** the current week has games that are not completed
- **THEN** its row remains visible, the player's cell includes only points from completed games, and the row is identified as in progress

### Requirement: Filter points from admin-overridden picks
The grid SHALL include points from admin-overridden picks by default and, when such points exist, let users exclude them from displayed weekly scores.

#### Scenario: Exclude admin-overridden points
- **WHEN** admin-overridden picks contributed points and a user turns off admin-pick points
- **THEN** the affected weekly cells exclude points earned from those overridden picks
