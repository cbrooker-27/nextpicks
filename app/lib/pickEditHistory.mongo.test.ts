/** @jest-environment node */
import { MongoClient, ObjectId } from "mongodb";
import type { Db } from "mongodb";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import type { Game, UserChoice } from "../../types";
import { saveUserChoicesWithHistory } from "./pickEditHistory";

let mongoServer: MongoMemoryReplSet;
let client: MongoClient;
let database: Db;

const originalGameId = new ObjectId();
const game: Game = {
  _id: originalGameId,
  season: 2026,
  week: 4,
  startTime: new Date(Date.now() + 60_000),
  awayFavorite: true,
  spread: 3,
};

beforeAll(async () => {
  mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  client = new MongoClient(mongoServer.getUri());
  await client.connect();
  database = client.db("picks");
});

afterAll(async () => {
  await client.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  await database.dropDatabase();
  await database.collection<Game>("games").insertOne(game);
});

async function seedChoice(choice: UserChoice["choice"], adminOverride = false) {
  await database.collection<UserChoice>("userChoices").insertOne({
    gameId: originalGameId,
    userId: "Player",
    choice,
    selectionTime: new Date().toISOString(),
    adminOverride,
  });
}

async function saveChoice(choice: UserChoice["choice"]) {
  return saveUserChoicesWithHistory(
    database,
    client,
    [
      {
        gameId: originalGameId,
        userId: "Player",
        choice,
        selectionTime: new Date().toISOString(),
      },
    ],
    "Player",
  );
}

describe("saveUserChoicesWithHistory", () => {
  it("saves initial picks without creating history", async () => {
    await saveChoice("ff");

    expect(await database.collection("userChoices").findOne({ gameId: originalGameId, userId: "Player" })).toMatchObject({
      choice: "ff",
      adminOverride: false,
    });
    expect(await database.collection("pickEditHistory").countDocuments()).toBe(0);
  });

  it("does not create history when a user resubmits the same outcome", async () => {
    await seedChoice("ff");

    await saveChoice("ff");

    expect(await database.collection("pickEditHistory").countDocuments()).toBe(0);
  });

  it("records each changed outcome with old/new choices and server time", async () => {
    await seedChoice("ff");

    await saveChoice("uu");

    const events = await database.collection("pickEditHistory").find().toArray();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      userId: "Player",
      gameId: originalGameId,
      season: 2026,
      week: 4,
      previousChoice: "ff",
      newChoice: "uu",
    });
    expect(events[0].changedAt).toBeInstanceOf(Date);
    expect(await database.collection("userChoices").findOne({ gameId: originalGameId, userId: "Player" })).toMatchObject({
      choice: "uu",
      adminOverride: false,
    });

    await saveChoice("uf");
    expect(await database.collection("pickEditHistory").countDocuments()).toBe(2);
  });

  it("does not record a user edit when replacing an admin override", async () => {
    await seedChoice("ff", true);

    await saveChoice("uu");

    expect(await database.collection("pickEditHistory").countDocuments()).toBe(0);
  });

  it("rolls back the pick update if the history event cannot be inserted", async () => {
    await seedChoice("ff");
    await database.createCollection("pickEditHistory", {
      validator: { $jsonSchema: { bsonType: "object", required: ["requiredByTest"] } },
    });

    await expect(saveChoice("uu")).rejects.toThrow();

    expect(await database.collection("userChoices").findOne({ gameId: originalGameId, userId: "Player" })).toMatchObject({
      choice: "ff",
    });
    expect(await database.collection("pickEditHistory").countDocuments()).toBe(0);
  });
});
