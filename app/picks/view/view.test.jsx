import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ViewPicks from "./view";
import { getMsfFeed } from "@/app/lib/msfClient";
import { getPickedGames, getThisYearsActiveUsers, getLatestTeamRecordSnapshot } from "@/app/utils/db";
import { spyOnConsole } from "@/app/testUtils/console";

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
  useSession: () => ({ data: { user: { name: "TestUser" } }, status: "authenticated" }),
}));

jest.mock("@/app/lib/msfClient", () => ({
  getMsfFeed: jest.fn(() => new Promise(() => {})),
}));

jest.mock("@/app/utils/db", () => ({
  getCurrentWeek: jest.fn().mockResolvedValue({ week: 1, season: 2025 }),
  getPickedGames: jest.fn().mockResolvedValue(
    JSON.stringify([
      {
        _id: 101,
        week: 1,
        season: 2025,
        startTime: "2025-09-07T13:00:00.000Z",
        awayFavorite: true,
        spread: 3.5,
        homeScore: 20,
        awayScore: 24,
        playedStatus: "COMPLETED",
        location: "Test Stadium",
        away: { id: 1, name: "Eagles", teamColoursHex: ["#000", "#fff"], officialLogoImageSrc: "/eagles.png" },
        home: { id: 2, name: "Cowboys", teamColoursHex: ["#000", "#fff"], officialLogoImageSrc: "/cowboys.png" },
        userChoices: [],
      },
    ]),
  ),
  getThisYearsActiveUsers: jest.fn().mockResolvedValue("[]"),
  getAllGames: jest.fn().mockResolvedValue([]),
  getLatestTeamRecordSnapshot: jest.fn().mockResolvedValue({ teams: [] }),
}));

jest.mock("@/app/components/games/gameScoreTile", () => {
  function MockGameScoreTile({ game, liveDetails, teamDetails }) {
    return (
      <div data-testid="game-score" data-team-count={teamDetails.length}>
        {`${game.home.name}: ${liveDetails.homeScore}`}
      </div>
    );
  }

  return MockGameScoreTile;
});

jest.mock("@/app/context/SeasonStatistics", () => {
  function MockProvider({ children }) {
    return children;
  }

  return { SeasonStatisticsContext: { Provider: MockProvider } };
});

describe("ViewPicks incremental loading", () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    getMsfFeed.mockImplementation(() => new Promise(() => {}));
    getLatestTeamRecordSnapshot.mockResolvedValue({ teams: [] });
  });

  it("renders Mongo game data before MSF requests resolve", async () => {
    render(<ViewPicks />);

    expect(screen.getByRole("button", { name: /0 of 6 calls succeeded/ })).toHaveAttribute("aria-expanded", "true");
    const summary = await screen.findByRole("button", { name: /5 of 6 calls succeeded/ });
    expect(summary).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByRole("switch", { name: "Show points from admin picks" })).not.toBeInTheDocument();
    expect(screen.getByText("Refresh live game scores")).toBeInTheDocument();
    expect(screen.getAllByText("Loading").length).toBeGreaterThan(0);
    expect(await screen.findByText("Cowboys: 20")).toBeInTheDocument();
  });

  it("auto-collapses and shows elapsed time when all calls succeed", async () => {
    getMsfFeed.mockResolvedValue({ data: [], source: "live" });

    render(<ViewPicks />);

    const summary = await screen.findByRole("button", { name: /6 of 6 calls succeeded/ });
    await waitFor(() => expect(summary).toHaveAttribute("aria-expanded", "false"));
    expect(summary).toHaveTextContent(/resolved in \d+\.\d+s/);
  });

  it("stays expanded when a call fails", async () => {
    getMsfFeed.mockImplementation((feed) =>
      Promise.resolve({ data: [], source: feed === "games" ? "unavailable" : "live" }),
    );

    render(<ViewPicks />);

    const summaryText = await screen.findByText(/5 of 6 calls succeeded/);
    const summary = summaryText.closest("button");
    expect(summary).toHaveAttribute("aria-expanded", "true");
    expect(await screen.findByText("Live game scores are unavailable. Showing the latest scores we have.")).toBeInTheDocument();
    fireEvent.click(summary);
    expect(summary).toHaveAttribute("aria-expanded", "false");
  });

  it("refreshes scores while local team records are still pending without requesting them from MSF", async () => {
    getLatestTeamRecordSnapshot.mockImplementation(() => new Promise(() => {}));
    getMsfFeed.mockImplementation((feed) =>
      feed === "games"
        ? Promise.resolve({ data: [{ _id: 101, homeScore: 25 }], source: "live" })
        : new Promise(() => {}),
    );

    render(<ViewPicks />);

    expect(await screen.findByText("Cowboys: 25")).toBeInTheDocument();
    expect(screen.getByText("Loading local team-record snapshot")).toBeInTheDocument();
    expect(getMsfFeed).toHaveBeenCalledWith("games", { week: 1, season: 2025 });
    expect(getLatestTeamRecordSnapshot).toHaveBeenCalledWith(2025);
    expect(getMsfFeed).not.toHaveBeenCalledWith("team-stats", expect.anything());
  });

  it("keeps historical picks available when the local season snapshot is missing", async () => {
    getLatestTeamRecordSnapshot.mockResolvedValue(null);
    getMsfFeed.mockResolvedValue({ data: [], source: "live" });

    render(<ViewPicks />);

    expect(await screen.findByRole("status")).toHaveTextContent("Team records are not available for this season");
    expect(screen.getByText("Cowboys: 20")).toBeInTheDocument();
    expect(getMsfFeed).not.toHaveBeenCalledWith("team-stats", expect.anything());
  });

  it("passes the active-season local snapshot to the pick view", async () => {
    getLatestTeamRecordSnapshot.mockResolvedValue({ teams: [{ _id: 1, wins: 1 }] });
    getMsfFeed.mockResolvedValue({ data: [], source: "live" });

    render(<ViewPicks />);

    expect(await screen.findByTestId("game-score")).toHaveAttribute("data-team-count", "1");
    expect(getLatestTeamRecordSnapshot).toHaveBeenCalledWith(2025);
  });

  it("reports an unreadable local snapshot without blocking the picks view", async () => {
    spyOnConsole(
      "error",
      (message, error) =>
        message === "Error loading local team-record snapshot:" &&
        error instanceof Error &&
        error.message === "snapshot unavailable",
    );
    getLatestTeamRecordSnapshot.mockRejectedValue(new Error("snapshot unavailable"));
    getMsfFeed.mockImplementation((feed) =>
      feed === "games"
        ? Promise.resolve({ data: [], source: "live" })
        : new Promise(() => {}),
    );

    render(<ViewPicks />);
    expect(await screen.findByRole("button", { name: /5 of 6 calls succeeded/ })).toBeInTheDocument();
    expect(screen.getByText("Loading local team-record snapshot").parentElement).toHaveTextContent("Failed");
    expect(await screen.findByRole("status")).toHaveTextContent("Team records could not be loaded");
    expect(screen.getByText("Cowboys: 20")).toBeInTheDocument();
  });

  it("subtracts admin points and marks the score when admin picks are excluded", async () => {
    getThisYearsActiveUsers.mockResolvedValue(
      JSON.stringify([{ name: "AdminPlayer" }, { name: "RegularPlayer" }]),
    );
    getPickedGames.mockResolvedValue(
      JSON.stringify([
        {
          _id: 101,
          week: 1,
          season: 2025,
          startTime: "2025-09-07T13:00:00.000Z",
          awayFavorite: true,
          spread: 5,
          homeScore: 20,
          awayScore: 24,
          playedStatus: "COMPLETED",
          location: "Test Stadium",
          away: { id: 1, name: "Eagles", teamColoursHex: ["#000", "#fff"], officialLogoImageSrc: "/eagles.png" },
          home: { id: 2, name: "Cowboys", teamColoursHex: ["#000", "#fff"], officialLogoImageSrc: "/cowboys.png" },
          userChoices: [
            { userId: "AdminPlayer", choice: "ff", adminOverride: true },
            { userId: "RegularPlayer", choice: "uf" },
          ],
        },
      ]),
    );

    render(<ViewPicks />);

    const includedScore = await screen.findByText("1*");
    const adminChip = includedScore.closest(".MuiChip-root");
    expect(adminChip).toHaveStyle({ border: "2px solid rgb(211, 47, 47)" });
    fireEvent.mouseOver(adminChip);
    expect(await screen.findByText("AdminPlayer: 1 points from admin picks")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("switch", { name: "Show points from admin picks" }));

    expect(await screen.findByText("0*")).toBeInTheDocument();
    expect(screen.getByText("2").compareDocumentPosition(screen.getByText("0*")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
