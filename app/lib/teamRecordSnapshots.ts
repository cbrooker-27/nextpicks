export interface TeamRecord {
  _id: number | string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
}

export interface WeeklyTeamRecordSnapshot {
  week: number;
  teams: TeamRecord[];
  fetchedAt: Date | string;
}

export interface SeasonTeamRecordSnapshots {
  _id?: number;
  season: number;
  weeks: WeeklyTeamRecordSnapshot[];
}

export const EXPECTED_NFL_TEAM_COUNT = 32;

export function normalizeMsfTeamRecords(response: unknown): TeamRecord[] {
  if (!response || typeof response !== "object" || !("teams" in response) || !Array.isArray(response.teams)) {
    throw new Error("MySportsFeeds returned an invalid team-record response.");
  }

  const teams = response.teams.map((team) => {
    if (!team || typeof team !== "object") {
      throw new Error("MySportsFeeds returned an invalid team record.");
    }

    const record = team as {
      team?: { id?: number | string };
      stats?: {
        standings?: {
          wins?: number;
          losses?: number;
          ties?: number;
          pointsFor?: number;
          pointsAgainst?: number;
        };
      };
    };
    const id = record.team?.id;
    const stats = record.stats?.standings;

    if ((typeof id !== "number" && typeof id !== "string") || String(id).trim() === "") {
      throw new Error("MySportsFeeds returned a team record without a valid team ID.");
    }

    if (
      !stats ||
      typeof stats.wins !== "number" ||
      typeof stats.losses !== "number" ||
      typeof stats.ties !== "number" ||
      typeof stats.pointsFor !== "number" ||
      typeof stats.pointsAgainst !== "number"
    ) {
      throw new Error(`MySportsFeeds returned incomplete statistics for team ${id}.`);
    }

    return {
      _id: id,
      wins: stats?.wins,
      losses: stats?.losses,
      ties: stats?.ties,
      pointsFor: stats?.pointsFor,
      pointsAgainst: stats?.pointsAgainst,
    };
  });

  return validateTeamRecords(teams);
}

export function validateTeamRecords(records: unknown): TeamRecord[] {
  if (!Array.isArray(records) || records.length !== EXPECTED_NFL_TEAM_COUNT) {
    throw new Error(`Expected ${EXPECTED_NFL_TEAM_COUNT} team records.`);
  }

  const ids = new Set<string>();
  return records.map((record) => {
    if (!record || typeof record !== "object") {
      throw new Error("A team record is invalid.");
    }

    const team = record as Partial<TeamRecord>;
    if (
      (typeof team._id !== "number" && typeof team._id !== "string") ||
      String(team._id).trim() === ""
    ) {
      throw new Error("A team record is missing a valid team ID.");
    }

    const id = String(team._id);
    if (ids.has(id)) {
      throw new Error(`Duplicate team ID in team records: ${id}.`);
    }
    ids.add(id);

    const stats = {
      wins: team.wins,
      losses: team.losses,
      ties: team.ties,
      pointsFor: team.pointsFor,
      pointsAgainst: team.pointsAgainst,
    };
    for (const [field, value] of Object.entries(stats)) {
      if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
        throw new Error(`Team record ${id} has an invalid ${field} value.`);
      }
    }

    if (
      typeof stats.wins !== "number" ||
      typeof stats.losses !== "number" ||
      typeof stats.ties !== "number" ||
      typeof stats.pointsFor !== "number" ||
      typeof stats.pointsAgainst !== "number"
    ) {
      throw new Error(`Team record ${id} has incomplete statistics.`);
    }

    return {
      _id: team._id,
      ...stats,
    };
  });
}

export function validateWeeklyTeamRecordSnapshot(snapshot: unknown): WeeklyTeamRecordSnapshot {
  if (!snapshot || typeof snapshot !== "object") {
    throw new Error("A weekly team-record snapshot is invalid.");
  }

  const entry = snapshot as Partial<WeeklyTeamRecordSnapshot>;
  const week = entry.week;
  if (typeof week !== "number" || !Number.isInteger(week) || week < 1 || week > 22) {
    throw new Error("A weekly team-record snapshot has an invalid week.");
  }
  const fetchedAt = entry.fetchedAt;
  if (
    (fetchedAt instanceof Date && !Number.isFinite(fetchedAt.getTime())) ||
    (typeof fetchedAt === "string" && !Number.isFinite(Date.parse(fetchedAt))) ||
    !(fetchedAt instanceof Date || typeof fetchedAt === "string")
  ) {
    throw new Error(`The snapshot for week ${week} has an invalid capture timestamp.`);
  }

  return {
    week,
    teams: validateTeamRecords(entry.teams),
    fetchedAt,
  };
}
