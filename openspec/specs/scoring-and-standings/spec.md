# Scoring and Standings

## Purpose

Describe the existing spread-based scoring, standings, and weekly score summaries.

## Requirements

### Requirement: Score picks against the game spread
For completed games, the application SHALL award points based on the favorite's and underdog's scores and the stored spread:
- When the favorite covers, `ff` earns 2 points, `uf` earns 1, and `uu` earns 0.
- When the favorite wins without covering, `ff` earns 1 point, `uf` earns 2, and `uu` earns 1.
- When the teams tie and the favorite does not cover, `ff` earns 0 points, `uf` earns 1, and `uu` earns 1.
- In the remaining score cases, `ff` earns 0 points, `uf` earns 1, and `uu` earns 2.

#### Scenario: A completed game is scored
- **WHEN** standings are calculated for a completed game
- **THEN** each active user's saved choice receives the points assigned to that outcome by the spread scoring rules

#### Scenario: A game is in progress
- **WHEN** current-week pick-view scores are calculated for a game marked `LIVE`
- **THEN** its points are kept separate from completed-game points and can be included or excluded by the in-progress control

### Requirement: Display current-season standings
The standings page SHALL rank active-season users by total completed-game points through the most recently completed week and display weekly point charts. It SHALL allow NPCs to be included or excluded. When admin-overridden picks exist, it SHALL allow their points to be included or excluded and identify affected scores.

#### Scenario: Toggle NPC visibility
- **WHEN** the user disables “Include NPCs”
- **THEN** NPC users are omitted from the standings and charts

#### Scenario: No admin overrides exist
- **WHEN** no standings record contains admin-pick points
- **THEN** the admin-points toggle is not displayed

#### Scenario: Exclude admin-pick points
- **WHEN** admin overrides exist and the user disables “Show points from admin picks”
- **THEN** those points are subtracted from displayed totals and weekly chart values

### Requirement: Display weekly score summaries
The home page SHALL show the signed-in user's current-week pick completion state and, after the first week, a prior-week score summary and leaderboard widgets. It SHALL show active-season users who have and have not picked for the current week.

#### Scenario: User has unpicked future games
- **WHEN** the signed-in user has not picked every not-yet-started current-week game
- **THEN** the current-week score card prompts the user to make picks

#### Scenario: User completed current-week picks
- **WHEN** the signed-in user has picked every not-yet-started current-week game
- **THEN** the current-week score card offers a link to view all picks
