/** @jest-environment node */
import { auth } from "../../auth";
import { connectToDatabase } from "../utils/db";
import { getPickEditHistory } from "./pickEditHistory";

jest.mock("../../auth", () => ({ auth: jest.fn() }));
jest.mock("../utils/db", () => ({ connectToDatabase: jest.fn() }));

describe("getPickEditHistory", () => {
  const originalAdminEmails = process.env.ADMIN_EMAILS;
  const close = jest.fn();
  const createIndex = jest.fn().mockResolvedValue("index");
  const countDocuments = jest.fn().mockResolvedValue(3);
  const distinct = jest.fn().mockResolvedValue(["Player B", "Player A"]);
  const toArray = jest.fn();
  const sort = jest.fn();
  const skip = jest.fn();
  const limit = jest.fn();
  const database = {
    collection: jest.fn(() => ({
      createIndex,
      countDocuments,
      distinct,
      aggregate: jest.fn(() => ({ toArray: jest.fn().mockResolvedValue([{ count: 2 }]) })),
      find: jest.fn(() => ({ sort, skip, limit, toArray })),
    })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_EMAILS = "admin@example.com";
    (auth as jest.Mock).mockResolvedValue({ user: { email: "admin@example.com" } });
    sort.mockReturnValue({ skip });
    skip.mockReturnValue({ limit });
    limit.mockReturnValue({ toArray });
    toArray.mockResolvedValue([
      {
        _id: "event-id",
        userId: "Player A",
        gameId: 123,
        season: 2026,
        week: 4,
        previousChoice: "ff",
        newChoice: "uu",
        changedAt: new Date("2026-10-01T12:00:00.000Z"),
      },
    ]);
    (connectToDatabase as jest.Mock).mockResolvedValue({ db: () => database, close });
  });

  afterAll(() => {
    if (originalAdminEmails === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = originalAdminEmails;
  });

  it("returns filtered, paginated history and matching counts", async () => {
    const result = await getPickEditHistory({ season: 2026, week: 4, userId: "Player A", page: 2 });

    expect(countDocuments).toHaveBeenCalledWith({ season: 2026, week: 4, userId: "Player A" });
    expect(sort).toHaveBeenCalledWith({ changedAt: -1, _id: -1 });
    expect(skip).toHaveBeenCalledWith(25);
    expect(limit).toHaveBeenCalledWith(25);
    expect(result).toMatchObject({
      totalEvents: 3,
      distinctPicks: 2,
      players: ["Player A", "Player B"],
      page: 2,
      pageSize: 25,
      events: [
        {
          id: "event-id",
          gameId: "123",
          changedAt: "2026-10-01T12:00:00.000Z",
          previousChoice: "ff",
          newChoice: "uu",
        },
      ],
    });
    expect(close).toHaveBeenCalled();
  });

  it("rejects non-admins before connecting to the database", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { email: "user@example.com" } });

    await expect(getPickEditHistory()).rejects.toThrow("not authorized");
    expect(connectToDatabase).not.toHaveBeenCalled();
  });

  it("rejects invalid filters before connecting to the database", async () => {
    await expect(getPickEditHistory({ week: 31 })).rejects.toThrow("Week must be between");
    expect(connectToDatabase).not.toHaveBeenCalled();
  });
});
