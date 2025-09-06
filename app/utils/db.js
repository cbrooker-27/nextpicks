"use server";
import { MongoClient } from "mongodb";

//const uri = `mongodb+srv://${process.env.MONGODB_SERVER}?retryWrites=true&w=majority`;
const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PWD}@${process.env.MONGODB_SERVER}?retryWrites=true&w=majority`;

export const getUserFromDb = async (username) => {
  const client = await connectToDatabase();
  const db = client.db("picks");
  const user = await db.collection("users").findOne({ name: username });
  client.close();
  return user;
};
export const getAllUserFromDb = async () => {
  const client = await connectToDatabase();
  const db = client.db("picks");
  const users = await db.collection("users").find().toArray();
  client.close();
  return JSON.stringify(users);
};
export const getUserFromDbWithEmail = async (emailAddress) => {
  const client = await connectToDatabase();
  const db = client.db("picks");
  const user = await db.collection("users").findOne({ email: emailAddress });
  client.close();
  return user;
};
export const getThisYearsActiveUsers = async () => {
  const users = JSON.parse(await getAllUserFromDb());
  return JSON.stringify(users.filter((user) => user.activeSeasons?.includes("2025")));
};

export const getCurrentWeek = async () => {
  const client = await connectToDatabase();
  const db = client.db("picks");
  const week = await db.collection("currentWeek").findOne();
  console.log(week);
  client.close();
  return { week: week.week, season: week.season };
};

export const updateUser = async (user) => {
  const client = await connectToDatabase();
  const db = client.db("picks");
  const updatedUser = await db.collection("users").updateOne({ _id: user._id }, { $set: user });
  console.log("updated user: " + updatedUser);
  client.close();
  return updatedUser;
};

export const updateCurrentWeek = async (newWeek) => {
  const client = await connectToDatabase();
  const db = client.db("picks");
  const updatedWeek = await db.collection("currentWeek").updateOne({}, { $set: { week: newWeek } });
  console.log("updated week: " + updatedWeek);
  client.close();
  return updatedWeek;
};

export async function connectToDatabase() {
  const client = await MongoClient.connect(uri);
  return client;
}

export async function addGames(games) {
  const week = await getCurrentWeek();
  // console.log("Adding games for week", week);
  const season = week.season;
  // console.log("Adding games for season", season);
  games.map(async (game) => {
    const client = await connectToDatabase();
    const db = client.db("picks");
    game.season = season;
    const insertResult = await db.collection("games").insertOne(game);
    client.close();
  });
}

export async function addUserChoices(choices) {
  const client = await connectToDatabase();
  const db = client.db("picks");
  const insertResult = await db.collection("userChoices").insertMany(choices);
  client.close();
  console.log("Inserted choices: ", insertResult);
  return JSON.stringify(insertResult);
}

export async function getPickableGames(week) {
  const client = await connectToDatabase();
  const db = client.db("picks");
  const findResult = db.collection("games").find({ week: week.week, season: week.season });
  const games = await findResult.toArray();
  // @ts-ignore
  games.sort((a, b) => a._id - b._id);
  client.close();
  return games;
}

export async function getThisWeeksPickedGames() {
  const week = await getCurrentWeek();
  const games = await getPickableGames(week);

  const pickedGames = await Promise.all(
    games.map(async (game) => {
      const client = await connectToDatabase();
      const db = client.db("picks");
      const findResult = db.collection("userChoices").find({ gameId: game._id });
      game.userChoices = await findResult.toArray();
      client.close();
      return game;
    })
  );
  // @ts-ignore
  pickedGames.sort((a, b) => a._id - b._id);
  return JSON.stringify(pickedGames);
}
