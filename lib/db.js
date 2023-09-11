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
    client.close();
  });
}
