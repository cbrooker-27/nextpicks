import { ensurePickEditHistoryIndexes } from "./pickEditHistory";

describe("ensurePickEditHistoryIndexes", () => {
  it("creates indexes for period and player history queries", async () => {
    const createIndex = jest.fn().mockResolvedValue("index");

    await ensurePickEditHistoryIndexes({ createIndex } as never);

    expect(createIndex).toHaveBeenNthCalledWith(
      1,
      { season: 1, week: 1, changedAt: -1 },
      { name: "period_changedAt" },
    );
    expect(createIndex).toHaveBeenNthCalledWith(2, { userId: 1, changedAt: -1 }, { name: "user_changedAt" });
  });
});
