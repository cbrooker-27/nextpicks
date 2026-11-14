"use server";

import type { AnyBulkWriteOperation, ClientSession, Db } from "mongodb";
import { auth } from "../../auth";
import { isAdminEmail } from "../lib/admin";
import { logInfo } from "../lib/logger";
import { fetchTeamRecordsForSnapshot } from "../lib/msf";
import { createNpcChoices } from "../lib/npcChoices";
import {
  EXPECTED_NFL_TEAM_COUNT,
  SeasonTeamRecordSnapshots,
  WeeklyTeamRecordSnapshot,
  validateWeeklyTeamRecordSnapshot,
} from "../lib/teamRecordSnapshots";
import { connectToDatabase, getPickedGames } from "../utils/db";
import type { Game, UserChoice, WeekConfig } from "../../types";

type Period = { week: number; season: number };
function isValidPeriod(period: Period) {
  return (
    Number.isInteger(period.week) &&
    period.week >= 1 &&
    period.week <= 22 &&
    Number.isInteger(period.season) &&
    period.season >= 1900 &&
    period.season <= 2200
  );
}

function samePeriod(first: Period, second: Period) {
  return first.week === second.week && first.season === second.season;
}

function hasSnapshot(stored: SeasonTeamRecordSnapshots | null, week: number) {
  const matches = stored?.weeks?.filter((snapshot) => snapshot.week === week) || [];
  if (matches.length > 1) {
    throw new Error(`Multiple snapshots exist for week ${week}. Resolve the stored duplicate before proceeding.`);
  }
  if (!matches.length) {
    return false;
  }
  validateWeeklyTeamRecordSnapshot(matches[0]);
  return true;
}

async function fetchSnapshotIfMissing(db: Db, period: Period): Promise<WeeklyTeamRecordSnapshot | null> {
  const stored = await db
    .collection<SeasonTeamRecordSnapshots>("teamRecordSnapshots")
    .findOne({ _id: period.season }, { projection: { weeks: 1 } });
  if (hasSnapshot(stored, period.week)) {
    return null;
  }

  const teams = await fetchTeamRecordsForSnapshot(period);
  return { week: period.week, teams, fetchedAt: new Date() };
}

async function persistSnapshotIfMissing(
  db: Db,
  period: Period,
  snapshot: WeeklyTeamRecordSnapshot | null,
  session: ClientSession,
) {
  const collection = db.collection<SeasonTeamRecordSnapshots>("teamRecordSnapshots");
  const stored = await collection.findOne({ _id: period.season }, { session, projection: { weeks: 1 } });
  if (hasSnapshot(stored, period.week)) {
    return;
  }
  if (!snapshot) {
    throw new Error(`The snapshot for week ${period.week}, season ${period.season} is missing.`);
  }

  await collection.updateOne(
    { _id: period.season },
    { $setOnInsert: { season: period.season }, $push: { weeks: snapshot } },
    { upsert: true, session },
  );
}

function getNpcChoiceOperations(games: Game[]): AnyBulkWriteOperation<UserChoice>[] {
  return games.flatMap((game) =>
    createNpcChoices(game).map((choice) => ({
      updateOne: {
        filter: { gameId: choice.gameId, userId: choice.userId },
        update: { $setOnInsert: choice },
        upsert: true,
      },
    })),
  );
}

async function requireCurrentPeriod(db: Db) {
  const current = await db.collection<WeekConfig>("currentWeek").findOne();
  if (!current) {
    throw new Error("The current week configuration is missing.");
  }

  const period = { week: Number(current.week), season: Number(current.season) };
  if (!isValidPeriod(period)) {
    throw new Error("The current week configuration is invalid.");
  }
  return { current, period };
}

async function requireAdmin() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    throw new Error("You are not authorized to change the current week.");
  }
  return session;
}

export async function updateCurrentWeek(newWeekOrConfig: WeekConfig) {
  const session = await requireAdmin();
  if (!newWeekOrConfig || typeof newWeekOrConfig !== "object") {
    throw new Error("A selected week and season are required.");
  }

  const destination = {
    week: Number(newWeekOrConfig.week),
    season: Number(newWeekOrConfig.season),
  };
  if (!isValidPeriod(destination)) {
    throw new Error("The selected week and season are invalid.");
  }

  const client = await connectToDatabase();
  try {
    const db = client.db(process.env.MONGODB_DB || "picks");
    const { current, period: source } = await requireCurrentPeriod(db);
    if (samePeriod(source, destination)) {
      return { modifiedCount: 1 };
    }

    const snapshot = await fetchSnapshotIfMissing(db, source);
    const games = JSON.parse(await getPickedGames(source)) as Game[];
    const npcOperations = getNpcChoiceOperations(games);
    const mongoSession = client.startSession();
    try {
      await mongoSession.withTransaction(async () => {
        const { period: latestSource } = await requireCurrentPeriod(db);
        if (!samePeriod(source, latestSource)) {
          throw new Error("The current week changed while records were being fetched. Reload and retry.");
        }

        await persistSnapshotIfMissing(db, source, snapshot, mongoSession);
        if (npcOperations.length) {
          await db.collection<UserChoice>("userChoices").bulkWrite(npcOperations, { session: mongoSession });
        }

        const update = await db.collection<WeekConfig>("currentWeek").updateOne(
          { _id: current._id },
          { $set: destination },
          { session: mongoSession },
        );
        if (update.matchedCount !== 1) {
          throw new Error("The current week configuration could not be updated.");
        }
      });
    } finally {
      await mongoSession.endSession();
    }

    logInfo("week.changed", {
      week: destination.week,
      season: destination.season,
      ...(session.user?.name ? { userId: session.user.name } : {}),
    });
    return { modifiedCount: 1 };
  } finally {
    await client.close();
  }
}

export async function captureCurrentWeekTeamRecords() {
  await requireAdmin();

  const client = await connectToDatabase();
  try {
    const db = client.db(process.env.MONGODB_DB || "picks");
    const { period } = await requireCurrentPeriod(db);
    const snapshot = await fetchSnapshotIfMissing(db, period);
    if (!snapshot) {
      return { status: "already-exists", ...period, teamCount: EXPECTED_NFL_TEAM_COUNT };
    }

    const mongoSession = client.startSession();
    try {
      await mongoSession.withTransaction(async () => {
        const { period: latestPeriod } = await requireCurrentPeriod(db);
        if (!samePeriod(period, latestPeriod)) {
          throw new Error("The current week changed while records were being fetched. Reload and retry.");
        }
        await persistSnapshotIfMissing(db, period, snapshot, mongoSession);
      });
    } finally {
      await mongoSession.endSession();
    }

    return { status: "captured", ...period, teamCount: snapshot.teams.length };
  } finally {
    await client.close();
  }
}
