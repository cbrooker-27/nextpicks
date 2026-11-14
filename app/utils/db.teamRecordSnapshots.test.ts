/** @jest-environment node */
import { MongoMemoryServer } from "mongodb-memory-server";
import type { TeamRecord, WeeklyTeamRecordSnapshot } from "../lib/teamRecordSnapshots";

jest.mock("../../auth", () => ({ auth: jest.fn() }));

interface TeamRecordSeasonDocument {
  _id: number;
  season: number;
  weeks: WeeklyTeamRecordSnapshot[];
}

let mongoServer: MongoMemoryServer;
let dbUtils: typeof import("./db");
const originalMongoUri = process.env.MONGODB_URI;
const originalMongoDb = process.env.MONGODB_DB;

function createRecords(): TeamRecord[] {
  return Array.from({ length: 32 }, (_value, index) => ({
    _id: index + 1,
    wins: 1,
    losses: 0,
    ties: 0,
    pointsFor: 20,
    pointsAgainst: 10,
  }));
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.MONGODB_DB = "picks";
  jest.resetModules();
  dbUtils = require("./db");
});

afterAll(async () => {
  await mongoServer.stop();
  if (originalMongoUri === undefined) {
    delete process.env.MONGODB_URI;
  } else {
    process.env.MONGODB_URI = originalMongoUri;
  }
  if (originalMongoDb === undefined) {
    delete process.env.MONGODB_DB;
  } else {
    process.env.MONGODB_DB = originalMongoDb;
  }
});

afterEach(async () => {
  const client = await dbUtils.connectToDatabase();
  await client.db("picks").collection("teamRecordSnapshots").deleteMany({});
  await client.close();
});

describe("team-record snapshot database reads", () => {
  it("round-trips the latest snapshot's week, team stats, and capture timestamp", async () => {
    const fetchedAt = new Date("2026-10-15T12:30:00.000Z");
    const client = await dbUtils.connectToDatabase();
    await client.db("picks").collection<TeamRecordSeasonDocument>("teamRecordSnapshots").insertOne({
      _id: 2026,
      season: 2026,
      weeks: [
        { week: 9, teams: createRecords(), fetchedAt: new Date("2026-10-08T12:30:00.000Z") },
        { week: 10, teams: createRecords(), fetchedAt },
      ],
    });
    await client.close();

    await expect(dbUtils.getLatestTeamRecordSnapshot(2026)).resolves.toEqual({
      season: 2026,
      week: 10,
      teams: createRecords(),
      fetchedAt,
    });
  });

  it("does not read records from another season", async () => {
    const client = await dbUtils.connectToDatabase();
    await client.db("picks").collection<TeamRecordSeasonDocument>("teamRecordSnapshots").insertOne({
      _id: 2025,
      season: 2025,
      weeks: [{ week: 18, teams: createRecords(), fetchedAt: new Date() }],
    });
    await client.close();

    await expect(dbUtils.getLatestTeamRecordSnapshot(2026)).resolves.toBeNull();
  });

  it("does not fall back to an older week when the latest snapshot is corrupt", async () => {
    const client = await dbUtils.connectToDatabase();
    await client.db("picks").collection<TeamRecordSeasonDocument>("teamRecordSnapshots").insertOne({
      _id: 2026,
      season: 2026,
      weeks: [
        { week: 9, teams: createRecords(), fetchedAt: new Date("2026-10-08T12:30:00.000Z") },
        { week: 10, teams: createRecords().slice(1), fetchedAt: new Date("2026-10-15T12:30:00.000Z") },
      ],
    });
    await client.close();

    await expect(dbUtils.getLatestTeamRecordSnapshot(2026)).rejects.toThrow("Expected 32 team records");
  });
});
