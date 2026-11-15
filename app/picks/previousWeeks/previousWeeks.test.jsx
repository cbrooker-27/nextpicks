import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PreviousWeeks from "./previousWeeks";
import { getCurrentWeek } from "@/app/utils/db";
import { getUserStatsForStandings } from "@/app/serverActions/users";

jest.mock("@/app/utils/db", () => ({
  getCurrentWeek: jest.fn(),
}));

jest.mock("@/app/serverActions/users", () => ({
  getUserStatsForStandings: jest.fn(),
}));

describe("PreviousWeeks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCurrentWeek.mockResolvedValue({ week: 3, season: 2026 });
    getUserStatsForStandings.mockResolvedValue([
      {
        name: "Alpha",
        npc: false,
        week1: 6,
        week2: 4,
        week3: 2,
        weekLive3: 7,
        adminPointsWeek1: 2,
        hasAdminPicks: true,
        weekInProgress3: 1,
      },
      { name: "NPC Player", npc: true, week1: 3, week2: 5, week3: 1 },
    ]);
  });

  it("loads the current season's stats and renders one row per week through the current week", async () => {
    render(<PreviousWeeks />);

    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(getUserStatsForStandings).toHaveBeenCalledWith({ week: 3, season: 2026 }, true);
    expect(screen.getAllByRole("row")).toHaveLength(4);
    expect(screen.getByRole("columnheader", { name: "Alpha" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "NPC Player" })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Week 1/ })).toHaveTextContent("6");
    expect(screen.getByRole("row", { name: /Week 2/ })).toHaveTextContent("4");
    expect(screen.getByRole("row", { name: /Week 3/ })).toHaveTextContent("2");
    expect(screen.getByRole("link", { name: "Week 2" })).toHaveAttribute(
      "href",
      "/picks/view?week=2&season=2026",
    );
  });

  it("filters NPC columns and admin-pick points, and labels an in-progress current week", async () => {
    render(<PreviousWeeks />);

    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Week 3/ })).toHaveTextContent("2");
    expect(screen.getByRole("columnheader", { name: "NPC Player" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("switch", { name: "Include NPCs" }));
    expect(screen.queryByRole("columnheader", { name: "NPC Player" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("switch", { name: "Show points from admin picks" }));
    expect(screen.getByRole("row", { name: /Week 1/ })).toHaveTextContent("4");
    expect(screen.getByRole("row", { name: /Week 3/ })).toHaveTextContent("2");
  });

  it("shows a loading status while scores are being fetched", async () => {
    let resolveStats;
    getUserStatsForStandings.mockReturnValue(
      new Promise((resolve) => {
        resolveStats = resolve;
      }),
    );
    render(<PreviousWeeks />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading previous-week scores");

    resolveStats([]);
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
  });

  it("shows an explicit error when score loading fails", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    getUserStatsForStandings.mockRejectedValue(new Error("network unavailable"));
    render(<PreviousWeeks />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load previous-week scores");
    consoleError.mockRestore();
  });
});
