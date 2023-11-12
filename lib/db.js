'use server'
import { MongoClient } from "mongodb";

export async function connectToDatabase() {
  const client = await MongoClient.connect(
    `mongodb+srv://cbrooker27:${process.env.MONGODB_PWD}@nextpicksdb.vakyhkk.mongodb.net/picks?retryWrites=true&w=majority`
  );
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
  //console.log('hi')
  const findResult = await db.collection("games").find({"week":week});
  //for await (const doc of findResult) {
    //games.push(doc)
    //console.log(doc);
  //}
  const games = await findResult.toArray();
    
  client.close();
  return games;
}
