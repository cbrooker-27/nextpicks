"use server";
import { MongoClient } from "mongodb";

//const uri = `mongodb+srv://${process.env.MONGODB_SERVER}?retryWrites=true&w=majority`;
const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PWD}@${process.env.MONGODB_SERVER}?retryWrites=true&w=majority`;

export const getUserFromDb = async (username) => {
  const client = await connectToDatabase();
  const db = client.db(process.env.MONGODB_DB || "picks");
  const user = await db.collection("users").findOne({ name: username });
  client.close();
  return user;
};
export const getAllUserFromDb = async () => {
  const client = await connectToDatabase();
  const db = client.db(process.env.MONGODB_DB || "picks");
  const users = await db.collection("users").find().toArray();
  client.close();
  return JSON.stringify(users);
};
export const getUserFromDbWithEmail = async (emailAddress) => {
  const client = await connectToDatabase();
  const db = client.db(process.env.MONGODB_DB || "picks");
  const user = await db.collection("users").findOne({ email: emailAddress });
  client.close();
  return user;
};
export const getThisYearsActiveUsers = async () => {
  const users = JSON.parse(await getAllUserFromDb());
  return JSON.stringify(users.filter((user) => user.activeSeasons?.includes("2025")));
};

export const updateUser = async (user) => {
  const client = await connectToDatabase();
  const db = client.db(process.env.MONGODB_DB || "picks");
  const updatedUser = await db.collection("users").updateOne({ _id: user._id }, { $set: user });
  console.log("updated user: " + updatedUser);
  client.close();
  return updatedUser;
};

export const getCurrentWeek = async () => {
  const client = await connectToDatabase();
  const db = client.db(process.env.MONGODB_DB || "picks");
  const week = await db.collection("currentWeek").findOne();
  console.log(week);
  client.close();
  return { week: week.week, season: week.season };
};

export const updateCurrentWeek = async (newWeek) => {
  const lastWeeksPicks = JSON.parse(await getThisWeeksPickedGames());
  const client = await connectToDatabase();
  const db = client.db(process.env.MONGODB_DB || "picks");

  await Promise.all(
    lastWeeksPicks.map(async (game) => {
      if (!game.userChoices.some((choice) => choice.userId === "Homer")) {
        await homerChoice(game, db);
        console.log("Added Homer choice for game ", game._id);
      }
      if (!game.userChoices.some((choice) => choice.userId === "Jackie")) {
        await jackieChoice(game, db);
        console.log("Added Jackie choice for game ", game._id);
      }
      if (!game.userChoices.some((choice) => choice.userId === "Freddy")) {
        await freddyChoice(game, db);
        console.log("Added Freddy choice for game ", game._id);
      }
      if (!game.userChoices.some((choice) => choice.userId === "Underdog")) {
        await underdogChoice(game, db);
        console.log("Added Underdog choice for game ", game._id);
      }
      if (!game.userChoices.some((choice) => choice.userId === "Robbie")) {
        await robbieChoice(game, db);
        console.log("Added Robbie choice for game ", game._id);
      }
      if (!game.userChoices.some((choice) => choice.userId === "Sammy")) {
        await sammyChoice(game, db);
        console.log("Added Sammy choice for game ", game._id);
      }
    })
  );

  const updatedWeek = await db.collection("currentWeek").updateOne({}, { $set: { week: newWeek } });
  console.log("updated week: " + updatedWeek);
  client.close();
  return updatedWeek;
};
export const updateGameInDb = async (game) => {
  const client = await connectToDatabase();
  const db = client.db(process.env.MONGODB_DB || "picks");
  const updatedGame = await db.collection("games").updateOne({ _id: game._id }, { $set: game });
  console.log("updated game: " + updatedGame);
  client.close();
  return updatedGame;
};

export const getAllGames = async (season) => {
  const client = await connectToDatabase();
  const db = client.db(process.env.MONGODB_DB || "picks");
  const findResult = db.collection("games").find({ season: season });
  const games = await findResult.toArray();
  client.close();
  return games;
};

export async function connectToDatabase() {
  const client = await MongoClient.connect(uri);
  return client;
}

export async function addGames(games) {
  const week = await getCurrentWeek();
  // console.log("Adding games for week", week);
  const season = week.season;
  console.log("Adding games for season and week", season, week.week);
  try {
    await Promise.all(
      games.map(async (game) => {
        const client = await connectToDatabase();
        const db = client.db(process.env.MONGODB_DB || "picks");
        game.season = season;
        const insertResult = await db.collection("games").insertOne(game);
        if (insertResult.acknowledged) {
          console.log("Inserted game: ", game._id);
          await npcChoices(game, db);
        }
        client.close();
      })
    );
    console.log("All games added successfully.");
  } catch (error) {
    console.error("Error adding games:", error);
  }
}

async function freddyChoice(game, db) {
  await db
    .collection("userChoices")
    .insertOne({ gameId: game._id, userId: "Freddy", choice: "ff", selectionTime: new Date().toISOString() });
}
async function underdogChoice(game, db) {
  await db
    .collection("userChoices")
    .insertOne({ gameId: game._id, userId: "Underdog", choice: "uu", selectionTime: new Date().toISOString() });
}
async function sammyChoice(game, db) {
  await db
    .collection("userChoices")
    .insertOne({ gameId: game._id, userId: "Sammy", choice: "uf", selectionTime: new Date().toISOString() });
}
async function homerChoice(game, db) {
  await db.collection("userChoices").insertOne({
    gameId: game._id,
    userId: "Homer",
    choice: game.awayFavorite ? "uu" : "ff",
    selectionTime: new Date().toISOString(),
  });
}
async function jackieChoice(game, db) {
  await db.collection("userChoices").insertOne({
    gameId: game._id,
    userId: "Jackie",
    choice: game.awayFavorite ? "ff" : "uu",
    selectionTime: new Date().toISOString(),
  });
}
async function robbieChoice(game, db) {
  //need to randomize Robbie's choice
  const choices = game.spread === 0.5 ? ["ff", "uu"] : ["ff", "uf", "uu"];
  const randomChoice = choices[Math.floor(Math.random() * choices.length)];
  await db.collection("userChoices").insertOne({
    gameId: game._id,
    userId: "Robbie",
    choice: randomChoice,
    selectionTime: new Date().toISOString(),
  });
}

async function npcChoices(game, db) {
  await freddyChoice(game, db);
  await underdogChoice(game, db);
  await sammyChoice(game, db);
  await homerChoice(game, db);
  await jackieChoice(game, db);
  await robbieChoice(game, db);
}

export async function addUserChoices(choices) {
  const client = await connectToDatabase();
  const db = client.db(process.env.MONGODB_DB || "picks");
  const insertResult = await db.collection("userChoices").insertMany(choices);
  client.close();
  console.log("Inserted choices: ", insertResult);
  return JSON.stringify(insertResult);
}

export async function getPickableGames(week) {
  const client = await connectToDatabase();
  const db = client.db(process.env.MONGODB_DB || "picks");
  const findResult = db.collection("games").find({ week: week.week, season: week.season });
  const games = await findResult.toArray();
  // @ts-ignore
  games.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  // games.sort((a, b) => a._id - b._id);
  client.close();
  return games;
}

export async function getThisWeeksPickedGames() {
  const week = await getCurrentWeek();
  return await getPickedGames(week);
}

async function getAllUserChoices() {
  const client = await connectToDatabase();
  const db = client.db(process.env.MONGODB_DB || "picks");
  const findResult = db.collection("userChoices").find();
  const userChoices = await findResult.toArray();
  client.close();
  return userChoices;
}

export async function getPickedGames(week) {
  //TODO: Need to optimize this as the number of db calls is high
  const games = await getPickableGames(week);
  const allUserChoices = await getAllUserChoices();

  const pickedGames = games.map((game) => {
    // const client = await connectToDatabase();
    // const db = client.db(process.env.MONGODB_DB || "picks");
    // const findResult = db.collection("userChoices").find({ gameId: game._id });
    // game.userChoices = await findResult.toArray();
    // client.close();
    game.userChoices = allUserChoices.filter((choice) => choice.gameId === game._id);
    return game;
  });
  // @ts-ignore
  // pickedGames.sort((a, b) => a._id - b._id);
  pickedGames.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  return JSON.stringify(pickedGames);
}
