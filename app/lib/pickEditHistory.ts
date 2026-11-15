import type { BulkWriteResult, Collection, Db, MongoClient } from "mongodb";
import type { Game, PickEditHistoryEvent, UserChoice } from "../../types";

export async function ensurePickEditHistoryIndexes(collection: Collection<PickEditHistoryEvent>) {
  await Promise.all([
    collection.createIndex({ season: 1, week: 1, changedAt: -1 }, { name: "period_changedAt" }),
    collection.createIndex({ userId: 1, changedAt: -1 }, { name: "user_changedAt" }),
  ]);
}

export async function saveUserChoicesWithHistory(
  db: Db,
  client: MongoClient,
  choices: UserChoice[],
  userId: string,
): Promise<{ writeResult: BulkWriteResult | null; periods: { season: number; week: number }[] }> {
  const gameIds = choices.map((choice) => choice.gameId);
  const userChoices = db.collection<UserChoice>("userChoices");
  const history = db.collection<PickEditHistoryEvent>("pickEditHistory");
  await ensurePickEditHistoryIndexes(history);
  const mongoSession = client.startSession();
  let writeResult: BulkWriteResult | null = null;
  let periods: { season: number; week: number }[] = [];
  try {
    await mongoSession.withTransaction(async () => {
      const games = await db
        .collection<Game>("games")
        .find({ _id: { $in: gameIds as any[] } }, { session: mongoSession })
        .project({ _id: 1, startTime: 1, week: 1, season: 1 })
        .toArray();
      const gamesById = new Map(games.map((game) => [String(game._id), game]));

      for (const choice of choices) {
        const game = gamesById.get(String(choice.gameId));
        if (!game) {
          throw new Error(`Game ${choice.gameId} was not found.`);
        }
        if (new Date(game.startTime).getTime() <= Date.now()) {
          throw new Error(`Game ${choice.gameId} has already started.`);
        }
      }

      const existingChoices = await userChoices
        .find({ gameId: { $in: gameIds as any[] }, userId }, { session: mongoSession })
        .toArray();
      const existingChoicesByGame = new Map(existingChoices.map((choice) => [String(choice.gameId), choice]));
      const changedAt = new Date();
      const events = choices.flatMap((choice) => {
        const existingChoice = existingChoicesByGame.get(String(choice.gameId));
        const game = gamesById.get(String(choice.gameId));
        if (
          !existingChoice ||
          existingChoice.adminOverride === true ||
          existingChoice.choice === choice.choice ||
          !game
        ) {
          return [];
        }
        return [
          {
            userId,
            gameId: game._id!,
            season: game.season,
            week: game.week,
            previousChoice: existingChoice.choice,
            newChoice: choice.choice,
            changedAt,
          },
        ];
      });

      const operations = choices.map((choice) => ({
        updateOne: {
          filter: { gameId: choice.gameId, userId: choice.userId },
          update: { $set: { choice: choice.choice, selectionTime: choice.selectionTime, adminOverride: false } },
          upsert: true,
        },
      }));
      writeResult = operations.length ? await userChoices.bulkWrite(operations, { session: mongoSession }) : null;
      if (events.length) {
        await history.insertMany(events, { session: mongoSession });
      }
      periods = [
        ...new Map(
          games.map((game) => [`${game.season}-${game.week}`, { season: game.season, week: game.week }]),
        ).values(),
      ];
    });
  } finally {
    await mongoSession.endSession();
  }
  return { writeResult, periods };
}
