# Pick Analytics

## Purpose

Describe the authenticated current-season pick analytics views.

## Requirements

### Requirement: View current-season pick analytics
An authenticated user SHALL be able to view pick analytics grouped by team, selected outcome, and spread. Spread analytics SHALL be available in summarized bucket and individual-spread views.

#### Scenario: Open analytics while signed in
- **WHEN** an authenticated user opens the analytics page
- **THEN** the page displays team, outcome, and spread charts for the current season

#### Scenario: Change spread grouping
- **WHEN** the user switches the spread view
- **THEN** the chart changes between summarized spread buckets and individual spread values

#### Scenario: Open analytics without a session
- **WHEN** the analytics data action is called without a session
- **THEN** the request is rejected and the page displays an error
