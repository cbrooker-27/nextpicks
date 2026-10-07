/** @jest-environment node */
import { ObjectId } from "mongodb";
import { auth } from "../../auth";
import { connectToDatabase } from "../utils/db";
import { saveAdminOverridePicks } from "./adminPicks";

jest.mock("../../auth", () => ({ auth: jest.fn() }));
jest.mock("../utils/db", () => ({ connectToDatabase: jest.fn() }));

describe("admin override picks", () => {
  const originalAdminEmails = process.env.ADMIN_EMAILS;
  const gameId = "507f1f77bcf86cd799439011";
  const bulkWrite = jest.fn();
  const close = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_EMAILS = "admin@example.com";
    (auth as jest.Mock).mockResolvedValue({ user: { email: "admin@example.com" } });

    const database = {
      collection: jest.fn((name: string) => {
        if (name === "users") return { findOne: jest.fn().mockResolvedValue({ _id: new ObjectId() }) };
        if (name === "games") {
          return {
            find: jest.fn().mockReturnValue({
              project: jest.fn().mockReturnValue({
                toArray: jest.fn().mockResolvedValue([{ _id: new ObjectId(gameId), startTime: "2020-09-07T13:00:00.000Z" }]),
              }),
            }),
          };
        }
        return { bulkWrite };
      }),
    };
    (connectToDatabase as jest.Mock).mockResolvedValue({ db: () => database, close });
  });

  afterAll(() => {
    if (originalAdminEmails === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = originalAdminEmails;
  });

  it("stores server time and marks the choice as an admin override", async () => {
    bulkWrite.mockResolvedValue({ modifiedCount: 0, upsertedCount: 1 });

    await saveAdminOverridePicks({
      week: 1,
      season: 2020,
      userId: "Player",
      picks: [{ gameId, choice: "ff" }],
    });

    const operations = bulkWrite.mock.calls[0][0];
    expect(operations[0].updateOne.update.$set).toEqual({
      choice: "ff",
      selectionTime: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      adminOverride: true,
    });
    expect(operations[0].updateOne.filter).toEqual({ gameId: new ObjectId(gameId), userId: "Player" });
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("matches numeric game IDs and stores the choice with the original ID type", async () => {
    const numericBulkWrite = jest.fn().mockResolvedValue({ modifiedCount: 0, upsertedCount: 1 });
    const numericGame = { _id: 163557, startTime: "2020-09-07T13:00:00.000Z" };
    const findGames = jest.fn();
    const database = {
      collection: jest.fn((name: string) => {
        if (name === "users") return { findOne: jest.fn().mockResolvedValue({ _id: new ObjectId() }) };
        if (name === "games") {
          return {
            find: findGames.mockReturnValue({
              project: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([numericGame]) }),
            }),
          };
        }
        return { bulkWrite: numericBulkWrite };
      }),
    };
    (connectToDatabase as jest.Mock).mockResolvedValueOnce({ db: () => database, close });

    await saveAdminOverridePicks({
      week: 2,
      season: 2026,
      userId: "Chris",
      picks: [{ gameId: "163557", choice: "ff" }],
    });

    expect(findGames).toHaveBeenCalledWith({
      _id: { $in: expect.arrayContaining(["163557", 163557]) },
      week: 2,
      season: 2026,
    });
    expect(numericBulkWrite.mock.calls[0][0][0].updateOne.filter).toEqual({ gameId: 163557, userId: "Chris" });
  });

  it("rejects non-admins before connecting to the database", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { email: "other@example.com" } });

    await expect(
      saveAdminOverridePicks({ week: 1, season: 2020, userId: "Player", picks: [{ gameId, choice: "ff" }] }),
    ).rejects.toThrow("You are not authorized to manage player picks.");
    expect(connectToDatabase).not.toHaveBeenCalled();
  });

  it("rejects games that have not locked yet", async () => {
    (connectToDatabase as jest.Mock).mockResolvedValueOnce({
      db: () => ({
        collection: (name: string) => {
          if (name === "users") return { findOne: jest.fn().mockResolvedValue({ _id: new ObjectId() }) };
          if (name === "games") {
            return {
              find: () => ({
                project: () => ({
                  toArray: async () => [{ _id: new ObjectId(gameId), startTime: "2999-09-07T13:00:00.000Z" }],
                }),
              }),
            };
          }
          return { bulkWrite };
        },
      }),
      close,
    });

    await expect(
      saveAdminOverridePicks({ week: 1, season: 2020, userId: "Player", picks: [{ gameId, choice: "ff" }] }),
    ).rejects.toThrow("has not locked yet");
    expect(bulkWrite).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledTimes(1);
  });
});