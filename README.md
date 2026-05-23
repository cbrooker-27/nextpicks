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

## Getting Started

First, ensure you have your MongoDB instance and Google OAuth credentials set up.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
