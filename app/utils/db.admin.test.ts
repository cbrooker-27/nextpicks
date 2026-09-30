/** @jest-environment node */
import { auth } from "../../auth";
import { updateCurrentWeek, updateGameScoresInDb } from "./db";

jest.mock("../../auth", () => ({
  auth: jest.fn(),
}));

describe("change-week database actions", () => {
  const originalAdminEmails = process.env.ADMIN_EMAILS;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_EMAILS = "admin@example.com";
    (auth as jest.Mock).mockResolvedValue({ user: { email: "user@example.com" } });
  });

  afterAll(() => {
    if (originalAdminEmails === undefined) {
      delete process.env.ADMIN_EMAILS;
    } else {
      process.env.ADMIN_EMAILS = originalAdminEmails;
    }
  });

  it("rejects week changes before accessing the database for non-admins", async () => {
    await expect(updateCurrentWeek({ week: 4, season: 2026 })).rejects.toThrow(
      "You are not authorized to change the current week.",
    );
  });

  it("rejects score changes before accessing the database for non-admins", async () => {
    await expect(
      updateGameScoresInDb("game-id" as never, { homeScore: 10, awayScore: 7, playedStatus: "COMPLETED" }),
    ).rejects.toThrow("You are not authorized to update game scores.");
  });
});