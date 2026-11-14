import {
  EXPECTED_NFL_TEAM_COUNT,
  normalizeMsfTeamRecords,
  validateTeamRecords,
} from "./teamRecordSnapshots";

function createRecords(count = EXPECTED_NFL_TEAM_COUNT) {
  return Array.from({ length: count }, (_value, index) => ({
    _id: index + 1,
    wins: index,
    losses: 0,
    ties: 0,
    pointsFor: 100,
    pointsAgainst: 80,
  }));
}

describe("team record snapshots", () => {
  it("normalizes a complete provider response with 32 unique teams", () => {
    const records = createRecords();
    const normalized = normalizeMsfTeamRecords({
      teams: records.map((record) => ({
        team: { id: record._id },
        stats: { standings: record },
      })),
    });

    expect(normalized).toHaveLength(EXPECTED_NFL_TEAM_COUNT);
    expect(normalized[0]).toEqual(records[0]);
  });

  it.each([
    ["empty", []],
    ["partial", createRecords(EXPECTED_NFL_TEAM_COUNT - 1)],
    ["duplicate IDs", [...createRecords().slice(0, -1), { ...createRecords()[0] }]],
    ["negative stats", [{ ...createRecords()[0], wins: -1 }, ...createRecords().slice(1)]],
    ["fractional stats", [{ ...createRecords()[0], pointsFor: 1.5 }, ...createRecords().slice(1)]],
    ["missing stats", [{ ...createRecords()[0], losses: undefined }, ...createRecords().slice(1)]],
  ])("rejects %s team-record data", (_description, records) => {
    expect(() => validateTeamRecords(records)).toThrow();
  });

  it("rejects a provider payload that does not contain a team array", () => {
    expect(() => normalizeMsfTeamRecords({})).toThrow("invalid team-record response");
  });
});
