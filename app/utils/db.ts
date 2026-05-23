"use server";
import { MongoClient, Db, WithId } from "mongodb";
import { User, Game, UserChoice, WeekConfig } from "../../types";

const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PWD}@${process.env.MONGODB_SERVER}?retryWrites=true&w=majority`;

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
  return JSON.stringify(users.filter((user) => user.activeSeasons?.includes("2025")));
};

export const updateUser = async (user: User) => {
  const client = await connectToDatabase();
  const db: Db = client.db(process.env.MONGODB_DB || "picks");
  const updatedUser = await db.collection<User>("users").updateOne({ _id: user._id as any }, { $set: user });
  console.log("updated user: " + updatedUser);
  await client.close();
  return updatedUser;
};

export const getCurrentWeek = async (): Promise<{ week: number; season: string | number }> => {
  const client = await connectToDatabase();
  const db: Db = client.db(process.env.MONGODB_DB || "picks");
  const week = await db.collection<WeekConfig>("currentWeek").findOne();
  console.log(week);
  await client.close();
  return { week: week!.week, season: week!.season };
};

export const updateCurrentWeek = async (newWeek: number) => {
  const lastWeeksPicks: Game[] = JSON.parse(await getThisWeeksPickedGames());
  const client = await connectToDatabase();
  const db: Db = client.db(process.env.MONGODB_DB || "picks");

  await Promise.all(
    lastWeeksPicks.map(async (game) => {
      if (!game.userChoices?.some((choice) => choice.userId === "Homer")) {
        await homerChoice(game, db);
        console.log("Added Homer choice for game ", game._id);
      }
      if (!game.userChoices?.some((choice) => choice.userId === "Jackie")) {
        await jackieChoice(game, db);
        console.log("Added Jackie choice for game ", game._id);
      }
      if (!game.userChoices?.some((choice) => choice.userId === "Freddy")) {
        await freddyChoice(game, db);
        console.log("Added Freddy choice for game ", game._id);
      }
      if (!game.userChoices?.some((choice) => choice.userId === "Underdog")) {
        await underdogChoice(game, db);
        console.log("Added Underdog choice for game ", game._id);
      }
      if (!game.userChoices?.some((choice) => choice.userId === "Robbie")) {
        await robbieChoice(game, db);
        console.log("Added Robbie choice for game ", game._id);
      }
      if (!game.userChoices?.some((choice) => choice.userId === "Sammy")) {
        await sammyChoice(game, db);
        console.log("Added Sammy choice for game ", game._id);
      }
    })
  );

  const updatedWeek = await db.collection("currentWeek").updateOne({}, { $set: { week: newWeek } });
  console.log("updated week: " + updatedWeek);
  await client.close();
  return updatedWeek;
};
export const updateGameInDb = async (game: Game) => {
  const client = await connectToDatabase();
  const db: Db = client.db(process.env.MONGODB_DB || "picks");
  const updatedGame = await db.collection<Game>("games").updateOne({ _id: game._id as any }, { $set: game });
  console.log("updated game: " + updatedGame);
  await client.close();
  return updatedGame;
};

export const getAllGames = async (season: string | number): Promise<WithId<Game>[]> => {
  const client = await connectToDatabase();
  const db: Db = client.db(process.env.MONGODB_DB || "picks");
  const findResult = db.collection<Game>("games").find({ season: season });
  const games = await findResult.toArray();
  await client.close();
  return games;
};

export async function connectToDatabase(): Promise<MongoClient> {
  const options: any = {};
  if (process.env.DEV_MODE === 'true') {
    options.monitorCommands = true;
  }
  const client = new MongoClient(uri, options);
  
  if (process.env.DEV_MODE === 'true') {
    client.on('commandStarted', (event: any) => {
      const url = `mongodb://${process.env.MONGODB_SERVER}/${process.env.MONGODB_DB || "picks"}`;
      let data = "none";
      try { data = JSON.stringify(event.command); } catch(e) { data = "Unparseable"; }
      console.log(`[EXTERNAL_CALL] URL: ${url} | Data: ${event.commandName} ${data}`);
    });
    client.on('commandSucceeded', (event: any) => {
      console.log(`[EXTERNAL_CALL] Return Code: SUCCESS (${event.duration}ms)`);
    });
    client.on('commandFailed', (event: any) => {
      console.log(`[EXTERNAL_CALL] Return Code: ERROR (${event.failure})`);
    });
  }

  await client.connect();
  return client;
}

export async function addGames(games: Game[]) {
  const week = await getCurrentWeek();
  const season = week.season;
  console.log("Adding games for season and week", season, week.week);
  try {
    await Promise.all(
      games.map(async (game) => {
        const client = await connectToDatabase();
        const db: Db = client.db(process.env.MONGODB_DB || "picks");
        game.season = season;
        const insertResult = await db.collection<Game>("games").insertOne(game);
        if (insertResult.acknowledged) {
          console.log("Inserted game: ", game._id);
          await npcChoices(game, db);
        }
        await client.close();
      })
    );
    console.log("All games added successfully.");
  } catch (error) {
    console.error("Error adding games:", error);
  }
}

async function freddyChoice(game: Game, db: Db) {
  await db
    .collection<UserChoice>("userChoices")
    .insertOne({ gameId: game._id as any, userId: "Freddy", choice: "ff", selectionTime: new Date().toISOString() });
}
async function underdogChoice(game: Game, db: Db) {
  await db
    .collection<UserChoice>("userChoices")
    .insertOne({ gameId: game._id as any, userId: "Underdog", choice: "uu", selectionTime: new Date().toISOString() });
}
async function sammyChoice(game: Game, db: Db) {
  await db
    .collection<UserChoice>("userChoices")
    .insertOne({ gameId: game._id as any, userId: "Sammy", choice: "uf", selectionTime: new Date().toISOString() });
}
async function homerChoice(game: Game, db: Db) {
  await db.collection<UserChoice>("userChoices").insertOne({
    gameId: game._id as any,
    userId: "Homer",
    choice: game.awayFavorite ? "uu" : "ff",
    selectionTime: new Date().toISOString(),
  });
}
async function jackieChoice(game: Game, db: Db) {
  await db.collection<UserChoice>("userChoices").insertOne({
    gameId: game._id as any,
    userId: "Jackie",
    choice: game.awayFavorite ? "ff" : "uu",
    selectionTime: new Date().toISOString(),
  });
}
async function robbieChoice(game: Game, db: Db) {
  const choices: UserChoice['choice'][] = game.spread === 0.5 ? ["ff", "uu"] : ["ff", "uf", "uu"];
  const randomChoice = choices[Math.floor(Math.random() * choices.length)];
  await db.collection<UserChoice>("userChoices").insertOne({
    gameId: game._id as any,
    userId: "Robbie",
    choice: randomChoice,
    selectionTime: new Date().toISOString(),
  });
}

async function npcChoices(game: Game, db: Db) {
  await freddyChoice(game, db);
  await underdogChoice(game, db);
  await sammyChoice(game, db);
  await homerChoice(game, db);
  await jackieChoice(game, db);
  await robbieChoice(game, db);
}

export async function addUserChoices(choices: UserChoice[]) {
  const client = await connectToDatabase();
  const db: Db = client.db(process.env.MONGODB_DB || "picks");
  const insertResult = await db.collection<UserChoice>("userChoices").insertMany(choices);
  await client.close();
  console.log("Inserted choices: ", insertResult);
  return JSON.stringify(insertResult);
}

export async function getPickableGames(week: { week: number; season: string | number }): Promise<WithId<Game>[]> {
  const client = await connectToDatabase();
  const db: Db = client.db(process.env.MONGODB_DB || "picks");
  const findResult = db.collection<Game>("games").find({ week: week.week, season: week.season });
  const games = await findResult.toArray();
  // @ts-ignore
  games.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  await client.close();
  return games;
}

export async function getSpreadCounts(season?: string | number) {
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

export async function getSpreadOutcomeCounts(season?: string | number) {
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

async function getAllUserChoices(): Promise<WithId<UserChoice>[]> {
  const client = await connectToDatabase();
  const db: Db = client.db(process.env.MONGODB_DB || "picks");
  const findResult = db.collection<UserChoice>("userChoices").find();
  const userChoices = await findResult.toArray();
  await client.close();
  return userChoices;
}

export async function getAllPickedGames(season: string | number): Promise<string> {
  const games = await getAllGames(season);
  const allUserChoices = await getAllUserChoices();
  const pickedGames = games.map((game) => {
    game.userChoices = allUserChoices.filter((choice) => String(choice.gameId) === String(game._id));
    return game;
  });
  return JSON.stringify(pickedGames);
}

export async function getPickedGames(week: { week: number; season: string | number }): Promise<string> {
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
