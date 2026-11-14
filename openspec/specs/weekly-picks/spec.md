# Weekly Picks

## Purpose

Describe how users load, submit, and review weekly game picks.

## Requirements

### Requirement: Load the current week's games and saved picks
The application SHALL use the configured current week and season to load games and any saved choices for the pick-entry and pick-view flows.

#### Scenario: A signed-in user opens pick entry
- **WHEN** the user opens the pick-entry page
- **THEN** the application loads the current week's games and the user's saved choice for each game

#### Scenario: A signed-out visitor opens pick entry
- **WHEN** no user session is present
- **THEN** the application starts sign-in and directs the visitor back to pick entry

### Requirement: Choose an outcome for an unlocked game
For a game that has not started, a user SHALL be able to choose whether the favorite covers, the favorite wins without covering, or the underdog wins. The favorite-wins-without-covering choice SHALL not be offered for a half-point spread.

#### Scenario: Choose an outcome before kickoff
- **WHEN** the user selects an available outcome for a game before its start time
- **THEN** the choice is recorded in the pick-entry form

#### Scenario: Game has started
- **WHEN** the game start time has passed
- **THEN** the user's pick controls are locked

### Requirement: Submit picks for future games
The application SHALL enable submission only when every not-yet-started game in the loaded set has a choice. Submission SHALL save choices for the signed-in user only for games that have not started; a successful save SHALL navigate to the pick view.

#### Scenario: Future games still need choices
- **WHEN** at least one not-yet-started game has no choice
- **THEN** the submit action is unavailable

#### Scenario: All future games have choices
- **WHEN** every not-yet-started game has a choice and the user submits
- **THEN** the application saves those choices and navigates to the pick view

#### Scenario: A submitted pick is edited before kickoff
- **WHEN** the user chooses to edit a saved pick for a game that has not started
- **THEN** the pick controls become available for that game

#### Scenario: A submitted game has started
- **WHEN** the user attempts to save a choice for a game that has started
- **THEN** the server rejects that choice

### Requirement: View picks for a week
The pick view SHALL show game outcomes and player choices for the current week by default. A `week` query parameter SHALL select a week in the current season. The view SHALL identify missing choices as `NP` and provide controls to filter NPC users and, for the current week, in-progress scoring.

#### Scenario: Open the current week's pick view
- **WHEN** the user opens the pick view without a week parameter
- **THEN** the application displays picks for the configured current week

#### Scenario: Open a prior week
- **WHEN** the user opens the pick view with a different week parameter
- **THEN** the application displays picks for that week in the current season without requesting live scores for that week

#### Scenario: A player has not picked a game
- **WHEN** the selected game has no saved choice for a listed player
- **THEN** the pick view shows `NP` for that player
