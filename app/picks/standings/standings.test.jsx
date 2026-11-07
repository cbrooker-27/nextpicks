import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Standings from "./standings";
import { getCurrentWeek } from "@/app/utils/db";
import { getUserStatsForStandings } from "@/app/serverActions/users";

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
  useSession: () => ({ data: { user: { name: "Alpha" } }, status: "authenticated" }),
}));

jest.mock("@/app/utils/db", () => ({
  getCurrentWeek: jest.fn(),
}));

jest.mock("@/app/serverActions/users", () => ({
  getUserStatsForStandings: jest.fn(),
}));

jest.mock("@/app/components/profileModal", () => () => null);
jest.mock("./StandingsLineChart", () => {
  function MockStandingsLineChart({ userStats }) {
    return (
      <div data-testid="line-chart-data">
        {userStats.map((user) => `${user.name}:${user.totalPoints}`).join(",")}
      </div>
    );
  }
  return MockStandingsLineChart;
});
jest.mock("@mui/x-charts", () => ({ LineChart: () => null }));
jest.mock("@mui/x-charts/BarChart", () => ({
  BarChart: function MockBarChart({ dataset }) {
    return (
      <div data-testid="bar-chart-data">
        {dataset.map((user) => `${user.name}:${user.totalPoints},${user.week1}`).join(",")}
      </div>
    );
  },
}));

describe("Standings admin picks toggle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCurrentWeek.mockResolvedValue({ week: 3, season: 2025 });
    getUserStatsForStandings.mockResolvedValue([
      {
        name: "Alpha",
        totalPoints: 5,
        adminPoints: 3,
        hasAdminPicks: true,
        week1: 3,
        adminPointsWeek1: 2,
        week2: 2,
        adminPointsWeek2: 1,
      },
      {
        name: "Beta",
        totalPoints: 4,
        adminPoints: 0,
        hasAdminPicks: false,
        week1: 2,
        adminPointsWeek1: 0,
        week2: 2,
        adminPointsWeek2: 0,
      },
    ]);
  });

  it("excludes admin-pick points and reorders players when toggled off", async () => {
    render(<Standings />);

    const adminPlayerChip = (await screen.findByText("Alpha - 5*")).closest(".MuiChip-root");
    expect(adminPlayerChip).toHaveClass("MuiChip-colorPrimary");
    expect(adminPlayerChip).toHaveStyle({ border: "2px solid rgb(211, 47, 47)" });
    expect(screen.getByText("Beta - 4").closest(".MuiChip-root")).toHaveClass("MuiChip-colorDefault");
    expect(screen.getByTestId("bar-chart-data")).toHaveTextContent("Alpha:5,3,Beta:4,2");

    fireEvent.click(screen.getByRole("switch", { name: "Show points from admin picks" }));

    await waitFor(() => {
      expect(screen.getByText("Beta - 4")).toBeInTheDocument();
      expect(screen.getByText("Alpha - 2*")).toBeInTheDocument();
    });
    expect(screen.getByTestId("bar-chart-data")).toHaveTextContent("Beta:4,2,Alpha:2,1");
    expect(screen.getByTestId("line-chart-data")).toHaveTextContent("Beta:4,Alpha:2");
  });

  it("does not render the admin-picks toggle when no picks were made by an admin", async () => {
    getUserStatsForStandings.mockResolvedValue([
      { name: "Alpha", totalPoints: 5, adminPoints: 0, hasAdminPicks: false, week1: 3, adminPointsWeek1: 0 },
    ]);

    render(<Standings />);

    await screen.findByText("Alpha - 5");
    expect(screen.queryByRole("switch", { name: "Show points from admin picks" })).not.toBeInTheDocument();
  });
});
