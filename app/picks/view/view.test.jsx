import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ViewPicks from "./view";
import { getGamesForWeekFromMsfWithStatus, getTeamStatisticsFromMsfWithStatus } from "@/app/lib/msf";

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
  useSession: () => ({ data: { user: { name: "TestUser" } }, status: "authenticated" }),
}));

jest.mock("@/app/lib/msf", () => ({
  getGamesForWeekFromMsfWithStatus: jest.fn(() => new Promise(() => {})),
  getTeamStatisticsFromMsfWithStatus: jest.fn(() => new Promise(() => {})),
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
}));

jest.mock("@/app/components/games/gameScoreTile", () => {
  function MockGameScoreTile({ game, liveDetails }) {
    return <div data-testid="game-score">{`${game.home.name}: ${liveDetails.homeScore}`}</div>;
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
  beforeEach(() => {
    jest.clearAllMocks();
    getGamesForWeekFromMsfWithStatus.mockImplementation(() => new Promise(() => {}));
    getTeamStatisticsFromMsfWithStatus.mockImplementation(() => new Promise(() => {}));
  });

  it("renders Mongo game data before MSF requests resolve", async () => {
    render(<ViewPicks />);

    const summary = screen.getByRole("button", { name: /0 of 6 calls succeeded/ });
    expect(summary).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Refresh live game scores")).toBeInTheDocument();
    expect(screen.getAllByText("Loading").length).toBeGreaterThan(0);
    expect(await screen.findByText("Cowboys: 20")).toBeInTheDocument();
  });

  it("auto-collapses and shows elapsed time when all calls succeed", async () => {
    getGamesForWeekFromMsfWithStatus.mockResolvedValue({ data: [], source: "live" });
    getTeamStatisticsFromMsfWithStatus.mockResolvedValue({ data: [], source: "live" });

    render(<ViewPicks />);

    const summary = await screen.findByRole("button", { name: /6 of 6 calls succeeded/ });
    await waitFor(() => expect(summary).toHaveAttribute("aria-expanded", "false"));
    expect(summary).toHaveTextContent(/resolved in \d+\.\d+s/);
  });

  it("stays expanded when a call fails", async () => {
    getGamesForWeekFromMsfWithStatus.mockResolvedValue({ data: [], source: "unavailable" });
    getTeamStatisticsFromMsfWithStatus.mockResolvedValue({ data: [], source: "live" });

    render(<ViewPicks />);

    const summaryText = await screen.findByText(/5 of 6 calls succeeded/);
    const summary = summaryText.closest("button");
    expect(summary).toHaveAttribute("aria-expanded", "true");
    expect(await screen.findByText("Live game scores are unavailable. Showing the latest scores we have.")).toBeInTheDocument();
    fireEvent.click(summary);
    expect(summary).toHaveAttribute("aria-expanded", "false");
  });
});
