import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ChangeWeek from "./changeWeek";
import { getCurrentWeek, getPickableGames, updateGameScoresInDb } from "../../utils/db";
import { getGamesForWeekFromMsfWithStatus } from "@/app/lib/msf";
import { updateCurrentWeek } from "../../serverActions/teamRecordSnapshots";

jest.mock("../../utils/db", () => ({
  getCurrentWeek: jest.fn(),
  getPickableGames: jest.fn(),
  updateGameScoresInDb: jest.fn(),
}));
jest.mock("@/app/lib/msf", () => ({
  getGamesForWeekFromMsfWithStatus: jest.fn(),
}));
jest.mock("../../serverActions/teamRecordSnapshots", () => ({
  captureCurrentWeekTeamRecords: jest.fn(),
  updateCurrentWeek: jest.fn(),
}));

describe("ChangeWeek", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCurrentWeek.mockResolvedValue({ week: 9, season: 2026 });
    getPickableGames.mockResolvedValue([{ _id: 100, homeScore: null }]);
    getGamesForWeekFromMsfWithStatus.mockResolvedValue({
      source: "live",
      data: [{ _id: 100, playedStatus: "COMPLETED", awayScore: 10, homeScore: 14 }],
    });
    updateGameScoresInDb.mockResolvedValue({ modifiedCount: 1 });
    updateCurrentWeek
      .mockRejectedValueOnce(new Error("Unable to retrieve a complete team-record snapshot"))
      .mockResolvedValueOnce({ modifiedCount: 1 });
  });

  it("shows snapshot failure, preserves the period, and allows a safe retry", async () => {
    render(<ChangeWeek />);

    expect(await screen.findByText("Current period: Week 9, 2026")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Apply Changes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to retrieve a complete team-record snapshot",
    );
    expect(screen.getByText("Current period: Week 9, 2026")).toBeInTheDocument();
    expect(updateGameScoresInDb).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Apply Changes" }));

    await waitFor(() => expect(screen.getByText("Current period: Week 10, 2026")).toBeInTheDocument());
    expect(updateCurrentWeek).toHaveBeenCalledTimes(2);
    expect(updateGameScoresInDb).toHaveBeenCalledTimes(2);
  });
});
