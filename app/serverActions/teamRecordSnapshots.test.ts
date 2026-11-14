/** @jest-environment node */
import { auth } from "../../auth";
import { fetchTeamRecordsForSnapshot } from "../lib/msf";
import type { SeasonTeamRecordSnapshots, TeamRecord } from "../lib/teamRecordSnapshots";
import { connectToDatabase, getPickedGames } from "../utils/db";
import { captureCurrentWeekTeamRecords, updateCurrentWeek } from "./teamRecordSnapshots";

jest.mock("../../auth", () => ({ auth: jest.fn() }));
jest.mock("../utils/db", () => ({
  connectToDatabase: jest.fn(),
  getPickedGames: jest.fn(),
}));
jest.mock("../lib/msf", () => ({ fetchTeamRecordsForSnapshot: jest.fn() }));

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

function createDatabase(initialSnapshot?: SeasonTeamRecordSnapshots, failCommit = false) {
  let current = { _id: "current", week: 9, season: 2026 };
  let storedSnapshot = initialSnapshot;
  const currentWeek = {
    findOne: jest.fn(async () => current),
    updateOne: jest.fn(async (_filter, update) => {
      current = { ...current, ...update.$set };
      return { matchedCount: 1 };
    }),
  };
  const snapshots = {
    findOne: jest.fn(async () => storedSnapshot ?? null),
    updateOne: jest.fn(async (_filter, update) => {
      if (!storedSnapshot) {
        storedSnapshot = { _id: 2026, season: 2026, weeks: [] };
      }
      storedSnapshot.weeks.push(update.$push.weeks);
      return { matchedCount: 1 };
    }),
  };
  const choices = { bulkWrite: jest.fn() };
  const database = {
    collection: jest.fn((name: string) => {
      if (name === "currentWeek") return currentWeek;
      if (name === "teamRecordSnapshots") return snapshots;
      if (name === "userChoices") return choices;
      throw new Error(`Unexpected collection: ${name}`);
    }),
  };
  const session = {
    withTransaction: jest.fn(async (callback) => {
      const previousCurrent = { ...current };
      const previousSnapshot = storedSnapshot ? structuredClone(storedSnapshot) : undefined;
      try {
        const result = await callback();
        if (failCommit) {
          throw new Error("transaction commit failed");
        }
        return result;
      } catch (error) {
        current = previousCurrent;
        storedSnapshot = previousSnapshot;
        throw error;
      }
    }),
    endSession: jest.fn(),
  };
  const client = {
    db: jest.fn(() => database),
    startSession: jest.fn(() => session),
    close: jest.fn(),
  };

  return { client, currentWeek, snapshots, choices, session, getCurrent: () => current, getSnapshot: () => storedSnapshot };
}

describe("team-record snapshot server actions", () => {
  const originalAdminEmails = process.env.ADMIN_EMAILS;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_EMAILS = "admin@example.com";
    (auth as jest.Mock).mockResolvedValue({ user: { email: "admin@example.com" } });
    (getPickedGames as jest.Mock).mockResolvedValue("[]");
    (fetchTeamRecordsForSnapshot as jest.Mock).mockResolvedValue(createRecords());
  });

  afterAll(() => {
    if (originalAdminEmails === undefined) {
      delete process.env.ADMIN_EMAILS;
    } else {
      process.env.ADMIN_EMAILS = originalAdminEmails;
    }
  });

  it("saves the source-week snapshot and advances the configured period", async () => {
    const database = createDatabase();
    (connectToDatabase as jest.Mock).mockResolvedValue(database.client);
    (getPickedGames as jest.Mock).mockResolvedValueOnce(
      JSON.stringify([
        {
          _id: "game-1",
          awayFavorite: true,
          spread: 0.5,
          userChoices: [{ userId: "Homer" }],
        },
      ]),
    );

    await expect(updateCurrentWeek({ week: 10, season: 2026 })).resolves.toEqual({ modifiedCount: 1 });

    expect(fetchTeamRecordsForSnapshot).toHaveBeenCalledWith({ week: 9, season: 2026 });
    expect(database.getSnapshot()?.weeks[0]).toMatchObject({ week: 9, teams: createRecords() });
    expect(database.getCurrent()).toMatchObject({ week: 10, season: 2026 });
    expect(database.session.withTransaction).toHaveBeenCalledTimes(1);
    const operations = database.choices.bulkWrite.mock.calls[0][0];
    expect(operations).toContainEqual(
      expect.objectContaining({ updateOne: expect.objectContaining({ filter: { gameId: "game-1", userId: "Freddy" } }) }),
    );
    expect(operations).not.toContainEqual(
      expect.objectContaining({ updateOne: expect.objectContaining({ filter: { gameId: "game-1", userId: "Homer" } }) }),
    );
  });

  it("reuses an exact existing snapshot without requesting MySportsFeeds", async () => {
    const existing = {
      week: 9,
      teams: createRecords(),
      fetchedAt: new Date("2026-10-01T00:00:00.000Z"),
    };
    const database = createDatabase({ _id: 2026, season: 2026, weeks: [existing] });
    (connectToDatabase as jest.Mock).mockResolvedValue(database.client);

    await updateCurrentWeek({ week: 10, season: 2026 });

    expect(fetchTeamRecordsForSnapshot).not.toHaveBeenCalled();
    expect(database.getSnapshot()?.weeks).toEqual([existing]);
    expect(database.getCurrent()).toMatchObject({ week: 10, season: 2026 });
  });

  it("treats a retry after an already-committed transition as successful", async () => {
    const database = createDatabase();
    (connectToDatabase as jest.Mock).mockResolvedValue(database.client);
    await database.currentWeek.updateOne({}, { $set: { week: 10, season: 2026 } });

    await expect(updateCurrentWeek({ week: 10, season: 2026 })).resolves.toEqual({ modifiedCount: 1 });

    expect(fetchTeamRecordsForSnapshot).not.toHaveBeenCalled();
    expect(database.getSnapshot()).toBeUndefined();
  });

  it("keeps source-season records separate when changing seasons", async () => {
    const database = createDatabase();
    (connectToDatabase as jest.Mock).mockResolvedValue(database.client);

    await updateCurrentWeek({ week: 1, season: 2027 });

    expect(database.getSnapshot()).toMatchObject({
      _id: 2026,
      season: 2026,
      weeks: [{ week: 9 }],
    });
    expect(database.getCurrent()).toMatchObject({ week: 1, season: 2027 });
  });

  it("leaves the configured period unchanged when provider retrieval fails", async () => {
    const database = createDatabase();
    (connectToDatabase as jest.Mock).mockResolvedValue(database.client);
    (fetchTeamRecordsForSnapshot as jest.Mock).mockRejectedValue(new Error("provider unavailable"));

    await expect(updateCurrentWeek({ week: 10, season: 2026 })).rejects.toThrow("provider unavailable");

    expect(database.getCurrent()).toMatchObject({ week: 9, season: 2026 });
    expect(database.getSnapshot()).toBeUndefined();
    expect(database.session.withTransaction).not.toHaveBeenCalled();
  });

  it("rolls back both the snapshot and period if the transaction fails", async () => {
    const existing = {
      week: 8,
      teams: createRecords(),
      fetchedAt: new Date("2026-10-01T00:00:00.000Z"),
    };
    const database = createDatabase({ _id: 2026, season: 2026, weeks: [existing] }, true);
    (connectToDatabase as jest.Mock).mockResolvedValue(database.client);

    await expect(updateCurrentWeek({ week: 10, season: 2026 })).rejects.toThrow("transaction commit failed");

    expect(database.getCurrent()).toMatchObject({ week: 9, season: 2026 });
    expect(database.getSnapshot()?.weeks).toEqual([existing]);
  });

  it("captures the current period without advancing it", async () => {
    const database = createDatabase();
    (connectToDatabase as jest.Mock).mockResolvedValue(database.client);

    await expect(captureCurrentWeekTeamRecords()).resolves.toMatchObject({
      status: "captured",
      week: 9,
      season: 2026,
      teamCount: 32,
    });

    expect(database.getCurrent()).toMatchObject({ week: 9, season: 2026 });
    expect(database.getSnapshot()?.weeks[0].week).toBe(9);
  });

  it("rejects non-administrators before opening the database", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { email: "user@example.com" } });

    await expect(updateCurrentWeek({ week: 10, season: 2026 })).rejects.toThrow(
      "You are not authorized to change the current week.",
    );
    expect(connectToDatabase).not.toHaveBeenCalled();
  });
});
