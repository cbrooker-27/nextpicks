import { MongoClient } from "mongodb";

export async function connectToDatabase() {
  const client = await MongoClient.connect(
    `mongodb+srv://cbrooker27:${process.env.MONGODB_PWD}@nextpicksdb.vakyhkk.mongodb.net/picks?retryWrites=true&w=majority`
  );
  return client;
}
