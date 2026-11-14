# NextPicks

NextPicks is a weekly American Football picking application built with Next.js (App Router), MongoDB, NextAuth, and Material UI.

## Overview

- **Purpose**: Users pick weekly American Football game outcomes against a spread.
- **Framework**: Next.js 16 App Router.
- **Styling**: `@mui/material` and Emotion.
- **Database**: MongoDB (via `mongodb` driver and `@auth/mongodb-adapter`).
- **Authentication**: NextAuth.js (v5 beta) with Google Provider.

## Architecture & Conventions

To make this repository easy for developers and AI agents to navigate, follow these conventions:

- **Database Access**: Core data fetching and mutation functions reside in `app/utils/db.ts` or `app/serverActions/`. Use `app/serverActions` for Next.js actions directly invoked by client components.
- **Types**: We are migrating core models (Game, User, Choice) to TypeScript to ensure strict schema adherence. Core types are defined in `types/index.ts`.
- **Environment Variables**: Create a `.env.local` file by copying `.env.example`.
- **Logging**: Structured application events are logged at `info`; set `LOG_LEVEL=debug` to include MySportsFeeds and MongoDB diagnostics. `DEV_MODE=true` also enables debug logs.
- **Admin access**: Set `ADMIN_EMAILS` to a comma-separated list of email addresses allowed to manage active seasons.

## Team-record snapshots

Team records are stored in the `teamRecordSnapshots` MongoDB collection as one document per season, with weekly snapshots in its `weeks` array. Before opening pick entry/view to users during rollout, an administrator should open **Change Week** and choose **Capture current-week records**. Confirm that the action reports the configured season, week, and 32 teams. This captures the configured week as the baseline; it does not reconstruct earlier weeks.

When changing the configured period, the application captures the period being left only if that exact season/week entry is missing. Existing entries are reused and never overwritten. A failed fetch, validation, or database transaction blocks the period change; resolve the underlying issue and retry. A new season has independent history and will not use another season's records. If a local snapshot is missing or unreadable, pick pages remain usable but report team records as unavailable and do not fall back to MySportsFeeds.

## Getting Started

First, ensure you have your MongoDB instance and Google OAuth credentials set up.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
