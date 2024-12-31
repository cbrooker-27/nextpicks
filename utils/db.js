"use server";
import { MongoClient } from "mongodb";

//const uri = `mongodb+srv://${process.env.MONGODB_SERVER}?retryWrites=true&w=majority`;
const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PWD}@${process.env.MONGODB_SERVER}?retryWrites=true&w=majority`;

export const getUserFromDb = async (username) => {
  const user = await db.collection("users").findOne({ username });
};

export async function connectToDatabase() {
  const client = await MongoClient.connect(uri);
  return client;
}

export async function addGames(games) {
  games.map(async (game) => {
    const client = await connectToDatabase();
    //console.log(games);
    const db = client.db("picks");
    const insertResult = await db.collection("games").insertOne(game);
    //console.log(insertResult)
    client.close();
  });
}

export async function getPickableGames(week) {
  const client = await connectToDatabase();
  const db = client.db("picks");
  //const games = []
  console.log("hi");
  const findResult = db.collection("games").find({ week: week });
  //for await (const doc of findResult) {
  //games.push(doc)
  //console.log(doc);
  //}
  const games = await findResult.toArray();
  console.log(games);
  client.close();
  return games;
}
