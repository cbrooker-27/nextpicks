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
export const getUserFromDbWithEmail = async (emailAddress) => {
  const client = await connectToDatabase();
  const db = client.db("picks");
  const user = await db.collection("users").findOne({ email: emailAddress });
  client.close();
  return user;
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
  const updatedUser = await db
    .collection("users")
    .updateOne({ _id: user._id }, { $set: user });
  console.log("updated user: " + updatedUser);
  client.close();
  return updatedUser;
};

export const updateCurrentWeek = async (newWeek) => {
  const client = await connectToDatabase();
  const db = client.db("picks");
  const updatedWeek = await db
    .collection("currentWeek")
    .updateOne({}, { $set: { week: newWeek } });
  console.log("updated week: " + updatedWeek);
  client.close();
  return updatedWeek;
};

export async function connectToDatabase() {
  const client = await MongoClient.connect(uri);
  return client;
}

export async function addGames(games) {
  const client = await connectToDatabase();
  //console.log(games);
  const db = client.db("picks");

  games.map(async (game) => {
    const insertResult = await db.collection("games").insertOne(game);
    //console.log(insertResult)
  });
  client.close();
}

export async function getPickableGames(week) {
  const client = await connectToDatabase();
  const db = client.db("picks");
  //const games = []
  //TODO Need to worry about the season too
  const findResult = db.collection("games").find({ week: week.week });
  //for await (const doc of findResult) {
  //games.push(doc)
  //console.log(doc);
  //}
  const games = await findResult.toArray();
  console.log(games);
  client.close();
  return games;
}
