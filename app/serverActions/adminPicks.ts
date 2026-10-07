"use server";

import { ObjectId } from "mongodb";
import { auth } from "../../auth";
import { isAdminEmail } from "../lib/admin";
import { connectToDatabase } from "../utils/db";

type PickChoice = "ff" | "uf" | "uu";

function getMongoIdCandidates(gameId: string) {
  const candidates: (string | number | ObjectId)[] = [gameId];
  if (ObjectId.isValid(gameId)) {
    candidates.push(new ObjectId(gameId));
  } else if (/^-?\d+$/.test(gameId)) {
    const numericId = Number(gameId);
    if (Number.isSafeInteger(numericId)) candidates.push(numericId);
  }
  return candidates;
}

async function requireAdmin() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    throw new Error("You are not authorized to manage player picks.");
  }
}

function assertWeekAndSeason(week: number, season: number) {
  if (!Number.isInteger(week) || week < 1 || week > 30 || !Number.isInteger(season) || season < 1900 || season > 2200) {
    throw new Error("A valid week and season are required.");
  }
}

export async function getAdminPickOptions() {
  await requireAdmin();
  const client = await connectToDatabase();

  try {
    const database = client.db(process.env.MONGODB_DB || "picks");
    const [users, allGames] = await Promise.all([
      database.collection("users").find({}, { projection: { name: 1 } }).toArray(),
      database.collection("games").find({}, { projection: { season: 1, week: 1, startTime: 1 } }).toArray(),
    ]);
    const lockedPeriods = new Map<string, { week: number; season: number }>();

    // Check timestamps in JavaScript because existing game records may store either strings or Date values.
    allGames.forEach((game) => {
      const startTime = new Date(game.startTime).getTime();
      if (!Number.isFinite(startTime) || startTime > Date.now()) return;
      const period = { week: Number(game.week), season: Number(game.season) };
      if (!Number.isInteger(period.week) || !Number.isInteger(period.season)) return;
      lockedPeriods.set(`${period.season}-${period.week}`, period);
    });

    return {
      users: users
        .filter((user) => typeof user.name === "string" && user.name.length > 0)
        .map((user) => ({ name: user.name }))
        .sort((first, second) => first.name.localeCompare(second.name)),
      periods: [...lockedPeriods.values()].sort(
        (first, second) => second.season - first.season || second.week - first.week,
      ),
    };
  } finally {
    await client.close();
  }
}

export async function getAdminPickGames({ week, season, userId }: { week: number; season: number; userId: string }) {
  await requireAdmin();
  assertWeekAndSeason(week, season);
  if (typeof userId !== "string" || !userId.trim()) throw new Error("A player is required.");

  const client = await connectToDatabase();
  try {
    const database = client.db(process.env.MONGODB_DB || "picks");
    const games = await database.collection("games").find({ week, season }).toArray();
    const lockedGames = games.filter((game) => new Date(game.startTime).getTime() <= Date.now());
    const gameIds = lockedGames.map((game) => game._id);
    const choices = gameIds.length
      ? await database.collection("userChoices").find({ userId, gameId: { $in: gameIds } }).toArray()
      : [];
    const choicesByGame = new Map(choices.map((choice) => [String(choice.gameId), choice]));

    return lockedGames
      .sort((first, second) => new Date(first.startTime).getTime() - new Date(second.startTime).getTime())
      .map((game) => {
        const existingChoice = choicesByGame.get(String(game._id));
        return {
          id: String(game._id),
          startTime: new Date(game.startTime).toISOString(),
          location: game.location || "",
          homeName: game.home?.name || game.home?.abbreviation || "Home",
          awayName: game.away?.name || game.away?.abbreviation || "Away",
          favoriteName: game.awayFavorite
            ? game.away?.name || game.away?.abbreviation || "Away"
            : game.home?.name || game.home?.abbreviation || "Home",
          underdogName: game.awayFavorite
            ? game.home?.name || game.home?.abbreviation || "Home"
            : game.away?.name || game.away?.abbreviation || "Away",
          spread: game.spread,
          choice: existingChoice?.choice || "",
          adminOverride: existingChoice?.adminOverride === true,
        };
      });
  } finally {
    await client.close();
  }
}

export async function saveAdminOverridePicks({
  week,
  season,
  userId,
  picks,
}: {
  week: number;
  season: number;
  userId: string;
  picks: { gameId: string; choice: PickChoice }[];
}) {
  await requireAdmin();
  assertWeekAndSeason(week, season);
  if (typeof userId !== "string" || !userId.trim()) throw new Error("A player is required.");
  if (!Array.isArray(picks) || picks.length === 0) throw new Error("Choose at least one pick to save.");
  if (
    picks.some(
      (pick) =>
        !pick || typeof pick.gameId !== "string" || !pick.gameId || !["ff", "uf", "uu"].includes(pick.choice),
    )
  ) {
    throw new Error("One or more picks are invalid.");
  }
  if (new Set(picks.map((pick) => pick.gameId)).size !== picks.length) {
    throw new Error("A game can only be included once per save.");
  }

  const client = await connectToDatabase();
  try {
    const database = client.db(process.env.MONGODB_DB || "picks");
    const users = database.collection("users");
    if (!(await users.findOne({ name: userId }, { projection: { _id: 1 } }))) {
      throw new Error("The selected player was not found.");
    }

    // Client-visible IDs are strings even when the stored game ID is numeric or a BSON ObjectId.
    const requestedIds = picks.flatMap(({ gameId }) => getMongoIdCandidates(gameId));
    const games = await database
      .collection("games")
      .find({ _id: { $in: requestedIds as any[] }, week, season })
      .project({ _id: 1, startTime: 1 })
      .toArray();
    const gamesById = new Map(games.map((game) => [String(game._id), game]));

    for (const pick of picks) {
      const game = gamesById.get(pick.gameId);
      if (!game) throw new Error(`Game ${pick.gameId} is not part of Week ${week}, ${season}.`);
      const startTime = new Date(game.startTime).getTime();
      if (!Number.isFinite(startTime) || startTime > Date.now()) {
        throw new Error(`Game ${pick.gameId} has not locked yet.`);
      }
    }

    const selectionTime = new Date().toISOString();
    const result = await database.collection("userChoices").bulkWrite(
      picks.map((pick) => {
        const game = gamesById.get(pick.gameId)!;
        return {
          updateOne: {
            filter: { gameId: game._id, userId },
            update: { $set: { choice: pick.choice, selectionTime, adminOverride: true } },
            upsert: true,
          },
        };
      }),
    );
    return { modifiedCount: result.modifiedCount, upsertedCount: result.upsertedCount };
  } finally {
    await client.close();
  }
}