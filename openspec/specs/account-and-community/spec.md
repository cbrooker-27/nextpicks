# Account and Community

## Purpose

Describe the existing sign-in, account creation, and current-season profile behavior.

## Requirements

### Requirement: Sign in and sign out
The application SHALL expose sign-in and sign-out actions in the navigation according to the current session state. Google sign-in SHALL be limited to email addresses already associated with an application user.

#### Scenario: Signed-out visitor opens the navigation
- **WHEN** no user session is present
- **THEN** the navigation identifies the visitor as a guest and offers sign-in

#### Scenario: Signed-in user opens the navigation
- **WHEN** a user session is present
- **THEN** the navigation shows the user's name and offers sign-out

#### Scenario: Google account has no application user
- **WHEN** a Google sign-in is attempted for an email that has no matching application user
- **THEN** the sign-in callback rejects the account

### Requirement: Create an account with credentials
The sign-up form SHALL submit the entered name and password to the account-creation endpoint. On successful creation, the endpoint SHALL store a hashed password and return a created response.

#### Scenario: Account creation succeeds
- **WHEN** the account-creation request completes successfully
- **THEN** the form displays an account-created confirmation

### Requirement: Browse active-season profiles
The profile directory SHALL show users active in the current season and allow case-insensitive filtering by name. Selecting a user SHALL open a profile with available profile details and season statistics.

#### Scenario: Search the current-season directory
- **WHEN** a visitor enters a name in the profile search
- **THEN** the directory shows current-season users whose names contain that text without regard to case

#### Scenario: Open a profile
- **WHEN** a visitor selects a user from the directory or standings
- **THEN** the application opens that user's profile and loads season statistics
