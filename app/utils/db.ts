"use server";
import { MongoClient, Db, WithId } from "mongodb";
import { User, Game, UserChoice, WeekConfig } from "../../types";
import { auth } from "../../auth";
import { isAdminEmail } from "../lib/admin";
import { isDebugEnabled, logDebug, logError, logInfo } from "../lib/logger";
import { saveUserChoicesWithHistory } from "../lib/pickEditHistory";
import {
  SeasonTeamRecordSnapshots,
  validateWeeklyTeamRecordSnapshot,
} from "../lib/teamRecordSnapshots";
import { createNpcChoices } from "../lib/npcChoices";

const uri =
  process.env.MONGODB_URI ||
  `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PWD}@${process.env.MONGODB_SERVER}?retryWrites=true&w=majority`;

export const getUserFromDb = async (username: string): Promise<WithId<User> | null> => {
  const client = await connectToDatabase();
  const db: Db = client.db(process.env.MONGODB_DB || "picks");
  const user = await db.collection<User>("users").findOne({ name: username });
  await client.close();
  return user;
};
export const getAllUserFromDb = async (): Promise<string> => {
  const client = await connectToDatabase();
  const db: Db = client.db(process.env.MONGODB_DB || "picks");
  const users = await db.collection<User>("users").find().toArray();
  await client.close();
  users.forEach((user) => {
    if (user.activeSeasons) {
      user.activeSeasons = user.activeSeasons.map((season) => Number(season));
    }
  });
  return JSON.stringify(users);
};
export const getUserFromDbWithEmail = async (emailAddress: string): Promise<WithId<User> | null> => {
  const client = await connectToDatabase();
  const db: Db = client.db(process.env.MONGODB_DB || "picks");
  const user = await db.collection<User>("users").findOne({ email: emailAddress });
  await client.close();
  return user;
};
export const getThisYearsActiveUsers = async (): Promise<string> => {
  const users: User[] = JSON.parse(await getAllUserFromDb());
  const currentWeek = await getCurrentWeek();
  return JSON.stringify(users.filter((user) => user.activeSeasons?.some((season) => Number(season) === currentWeek.season)));
};

export const updateUser = async (user: User) => {
  const client = await connectToDatabase();
  const db: Db = client.db(process.env.MONGODB_DB || "picks");
  const updatedUser = await db.collection<User>("users").updateOne({ _id: user._id as any }, { $set: user });
  await client.close();
  return updatedUser;
};

export const getCurrentWeek = async (): Promise<{ week: number; season: number }> => {
  const client = await connectToDatabase();
  const db: Db = client.db(process.env.MONGODB_DB || "picks");
  const week = await db.collection<WeekConfig>("currentWeek").findOne();
  await client.close();
  return { week: week!.week, season: Number(week!.season) };
};

export const updateGameInDb = async (game: Game) => {
  const client = await connectToDatabase();
  const db: Db = client.db(process.env.MONGODB_DB || "picks");
  const updatedGame = await db.collection<Game>("games").updateOne({ _id: game._id as any }, { $set: game });
  await client.close();
  return updatedGame;
};

export const updateGameScoresInDb = async (
  gameId: Game["_id"],
  scores: Pick<Game, "homeScore" | "awayScore" | "playedStatus">
) => {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    throw new Error("You are not authorized to update game scores.");
  }

  const client = await connectToDatabase();
  try {
    const db: Db = client.db(process.env.MONGODB_DB || "picks");
    return await db.collection<Game>("games").updateOne({ _id: gameId as any }, { $set: scores });
  } finally {
    await client.close();
  }
};

export const getAllGames = async (season: number): Promise<WithId<Game>[]> => {
  const client = await connectToDatabase();
  const db: Db = client.db(process.env.MONGODB_DB || "picks");
  const findResult = db.collection<Game>("games").find({ season: season });
  const games = await findResult.toArray();
  await client.close();
  return games;
};

export const getLatestTeamRecordSnapshot = async (season: number) => {
  if (!Number.isInteger(season) || season < 1900 || season > 2200) {
    throw new Error("A valid season is required to load team records.");
  }

  const client = await connectToDatabase();
  try {
    const db: Db = client.db(process.env.MONGODB_DB || "picks");
    const stored = await db.collection<SeasonTeamRecordSnapshots>("teamRecordSnapshots").findOne({ _id: season });
    if (!stored) {
      return null;
    }
    if (Number(stored.season) !== season) {
      throw new Error(`Stored team records do not match season ${season}.`);
    }
    if (!Array.isArray(stored.weeks)) {
      throw new Error(`Stored team records for season ${season} have an invalid weekly history.`);
    }
    if (!stored.weeks.length) return null;

    const seenWeeks = new Set<number>();
    for (const snapshot of stored.weeks) {
      if (!Number.isInteger(snapshot.week) || snapshot.week < 1 || snapshot.week > 22 || seenWeeks.has(snapshot.week)) {
        throw new Error(`Stored team records for season ${season} have an invalid or duplicate week.`);
      }
      seenWeeks.add(snapshot.week);
    }
    const latest = [...stored.weeks]
      .sort((first, second) => second.week - first.week)[0];
    const snapshot = validateWeeklyTeamRecordSnapshot(latest);

    return {
      season,
      ...snapshot,
    };
  } finally {
    await client.close();
  }
}

export async function connectToDatabase(): Promise<MongoClient> {
  const options: any = {};
  if (isDebugEnabled()) {
    options.monitorCommands = true;
  }
  const client = new MongoClient(uri, options);
  
  if (isDebugEnabled()) {
    client.on('commandStarted', (event: any) => {
      logDebug("mongodb.command.started", {
        command: event.commandName,
        database: event.databaseName,
      });
    });
    client.on('commandSucceeded', (event: any) => {
      logDebug("mongodb.command.succeeded", {
        command: event.commandName,
        durationMs: event.duration,
      });
    });
    client.on('commandFailed', (event: any) => {
      logDebug("mongodb.command.failed", {
        command: event.commandName,
        durationMs: event.duration,
        failure: event.failure?.message || String(event.failure),
      });
    });
  }

  await client.connect();
  return client;
}

export async function addGames(games: Game[]) {
  const week = await getCurrentWeek();
  const season = week.season;
  try {
    await Promise.all(
      games.map(async (game) => {
        const client = await connectToDatabase();
        try {
          const db: Db = client.db(process.env.MONGODB_DB || "picks");
          game.season = season;
          const insertResult = await db.collection<Game>("games").insertOne(game);
          if (insertResult.acknowledged) {
            await Promise.all(
              createNpcChoices(game).map((choice) => db.collection<UserChoice>("userChoices").insertOne(choice)),
            );
          }
        } finally {
          await client.close();
        }
      })
    );
    logInfo("games.added", { gameCount: games.length, week: week.week, season });
  } catch (error) {
    logError("games.add_failed", error, { gameCount: games.length, week: week.week, season });
    throw error;
  }
}

export async function addUserChoices(choices: UserChoice[]) {
  const session = await auth();
  const userId = session?.user?.name;
  if (!userId) {
    throw new Error("You must be signed in to submit picks.");
  }
  if (!Array.isArray(choices) || choices.some((choice) => !choice || choice.userId !== userId)) {
    throw new Error("You can only submit picks for your own account.");
  }

  const client = await connectToDatabase();
  try {
    const db: Db = client.db(process.env.MONGODB_DB || "picks");
    const { writeResult, periods } = await saveUserChoicesWithHistory(db, client, choices, userId);
    logInfo("picks.saved", { userId, pickCount: choices.length, periods });
    return JSON.stringify(writeResult);
  } finally {
    await client.close();
  }
}

export async function getPickableGames(week: { week: number; season: number }): Promise<WithId<Game>[]> {
  const client = await connectToDatabase();
  const db: Db = client.db(process.env.MONGODB_DB || "picks");
  const findResult = db.collection<Game>("games").find({ week: week.week, season: week.season });
  const games = await findResult.toArray();
  // @ts-ignore
  games.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  await client.close();
  return games;
}

export async function getSpreadCounts(season?: number) {
  const client = await connectToDatabase();
  const db: Db = client.db(process.env.MONGODB_DB || "picks");

  const pipeline: any[] = [];
  if (season) {
    pipeline.push({ $match: { season } });
  }

  pipeline.push(
    {
      $group: {
        _id: "$spread",
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } }
  );

  const result = await db.collection("games").aggregate(pipeline).toArray();
  await client.close();
  return result;
}

export async function getSpreadOutcomeCounts(season?: number) {
  const client = await connectToDatabase();
  const db: Db = client.db(process.env.MONGODB_DB || "picks");

  const filter: any = { playedStatus: { $regex: "^COMPLETED" } };
  if (season) filter.season = season;

  const games = await db.collection<Game>("games").find(filter).toArray();
  await client.close();

  const statsMap = new Map();

  games.forEach((g) => {
    const spread = g.spread;
    const favScore = g.awayFavorite ? g.awayScore! : g.homeScore!;
    const undScore = g.awayFavorite ? g.homeScore! : g.awayScore!;

    const ff = favScore - spread > undScore;
    const uu = favScore < undScore;
    const uf = favScore - spread < undScore && favScore > undScore;
    const favoriteHome = !g.awayFavorite;

    const key = String(spread);
    if (!statsMap.has(key)) {
      statsMap.set(key, {
        spread,
        total: 0,
        ff: 0,
        uf: 0,
        uu: 0,
        favHome: { total: 0, ff: 0, uf: 0, uu: 0 },
        favAway: { total: 0, ff: 0, uf: 0, uu: 0 },
      });
    }
    const rec = statsMap.get(key);
    rec.total += 1;
    if (ff) rec.ff += 1;
    else if (uf) rec.uf += 1;
    else rec.uu += 1;

    if (favoriteHome) {
      rec.favHome.total += 1;
      if (ff) rec.favHome.ff += 1;
      else if (uf) rec.favHome.uf += 1;
      else rec.favHome.uu += 1;
    } else {
      rec.favAway.total += 1;
      if (ff) rec.favAway.ff += 1;
      else if (uf) rec.favAway.uf += 1;
      else rec.favAway.uu += 1;
    }
  });

  const results = Array.from(statsMap.values()).sort((a, b) => a.spread - b.spread);
  return results;
}

export async function getThisWeeksPickedGames(): Promise<string> {
  const week = await getCurrentWeek();
  return await getPickedGames(week);
}

export async function getAllUserChoices(): Promise<WithId<UserChoice>[]> {
  const client = await connectToDatabase();
  const db: Db = client.db(process.env.MONGODB_DB || "picks");
  const findResult = db.collection<UserChoice>("userChoices").find();
  const userChoices = await findResult.toArray();
  await client.close();
  return userChoices;
}

export async function getAllPickedGames(season: number): Promise<string> {
  const games = await getAllGames(season);
  const allUserChoices = await getAllUserChoices();
  const pickedGames = games.map((game) => {
    game.userChoices = allUserChoices.filter((choice) => String(choice.gameId) === String(game._id));
    return game;
  });
  return JSON.stringify(pickedGames);
}

export async function getPickedGames(week: { week: number; season: number }): Promise<string> {
  const games = await getPickableGames(week);
  const allUserChoices = await getAllUserChoices();

  const pickedGames = games.map((game) => {
    game.userChoices = allUserChoices.filter((choice) => String(choice.gameId) === String(game._id));
    return game;
  });
  // @ts-ignore
  pickedGames.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  return JSON.stringify(pickedGames);
}
