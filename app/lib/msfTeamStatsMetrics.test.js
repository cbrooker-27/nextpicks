/** @jest-environment node */
import { connectToDatabase } from "@/app/utils/db";
import { getTeamStatsMetrics, recordMsfRequest } from "./msfTeamStatsMetrics";

jest.mock("@/app/utils/db", () => ({
  connectToDatabase: jest.fn(),
}));

describe("MSF request metrics", () => {
  let updateOne;
  let findOne;
  let close;
  let database;

  beforeEach(() => {
    jest.clearAllMocks();
    updateOne = jest.fn().mockResolvedValue({});
    findOne = jest.fn().mockResolvedValue(null);
    close = jest.fn().mockResolvedValue(undefined);
    database = {
      collection: jest.fn(() => ({ updateOne, findOne })),
    };
    connectToDatabase.mockResolvedValue({
      db: jest.fn(() => database),
      close,
    });
  });

  it("increments the successful request totals", async () => {
    await recordMsfRequest({
      requestType: "team_stats",
      status: "success",
      season: 2026,
      durationMs: 120,
      httpStatus: 200,
    });

    expect(updateOne).toHaveBeenCalledWith(
      { _id: "msf_team_stats" },
      expect.objectContaining({
        $inc: { requestCount: 1, totalDurationMs: 120, successCount: 1 },
        $set: expect.objectContaining({
          lastStatus: "success",
          lastRequestAt: expect.any(Date),
          lastSuccessAt: expect.any(Date),
        }),
      }),
      { upsert: true },
    );
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("increments timeout totals and retains the failure details", async () => {
    await recordMsfRequest({
      requestType: "games",
      status: "timeout",
      season: 2026,
      week: 3,
      durationMs: 10000,
      error: { name: "TimeoutError", message: "Request timed out" },
    });

    expect(updateOne).toHaveBeenCalledWith(
      { _id: "msf_team_stats" },
      expect.objectContaining({
        $inc: { requestCount: 1, totalDurationMs: 10000, timeoutCount: 1 },
        $push: {
          recentFailures: {
            $each: [
              expect.objectContaining({
                requestType: "games",
                season: 2026,
                week: 3,
                status: "timeout",
                errorName: "TimeoutError",
                message: "Request timed out",
                at: expect.any(Date),
              }),
            ],
            $slice: -50,
          },
        },
      }),
      { upsert: true },
    );
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("returns persisted metrics and closes the database connection", async () => {
    const metrics = { requestCount: 3, successCount: 3 };
    findOne.mockResolvedValueOnce(metrics);

    await expect(getTeamStatsMetrics()).resolves.toBe(metrics);

    expect(database.collection).toHaveBeenCalledWith("msfTeamStatsMetrics");
    expect(findOne).toHaveBeenCalledWith({ _id: "msf_team_stats" });
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("logs metric persistence errors without throwing", async () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    connectToDatabase.mockRejectedValueOnce(new Error("Mongo unavailable"));

    await expect(
      recordMsfRequest({
        requestType: "games",
        status: "error",
        season: 2026,
        durationMs: 100,
        error: { name: "Error", message: "Request failed" },
      }),
    ).resolves.toBeUndefined();

    expect(error).toHaveBeenCalledWith(
      "Unable to persist MSF request metrics:",
      expect.objectContaining({ message: "Mongo unavailable" }),
    );
    error.mockRestore();
  });
});
