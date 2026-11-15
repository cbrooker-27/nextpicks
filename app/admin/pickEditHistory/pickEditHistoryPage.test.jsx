import PickEditHistoryPage from "./pickEditHistoryPage";
import { auth } from "../../../auth";
import { getPickEditHistory } from "@/app/serverActions/pickEditHistory";
import PickEditHistory from "./pickEditHistory";

jest.mock("../../../auth", () => ({ auth: jest.fn() }));
jest.mock("@/app/serverActions/pickEditHistory", () => ({ getPickEditHistory: jest.fn() }));

describe("PickEditHistoryPage", () => {
  const originalAdminEmails = process.env.ADMIN_EMAILS;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_EMAILS = "admin@example.com";
    getPickEditHistory.mockResolvedValue({ events: [] });
  });

  afterAll(() => {
    if (originalAdminEmails === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = originalAdminEmails;
  });

  it("does not load or render history for non-admins", async () => {
    auth.mockResolvedValue({ user: { email: "user@example.com" } });

    const page = await PickEditHistoryPage();

    expect(page.type).toBe("p");
    expect(page.props.children).toMatch(/not authorized/i);
    expect(getPickEditHistory).not.toHaveBeenCalled();
  });

  it("loads the history for admins", async () => {
    auth.mockResolvedValue({ user: { email: "admin@example.com" } });

    const page = await PickEditHistoryPage();

    expect(getPickEditHistory).toHaveBeenCalled();
    expect(page.type).toBe(PickEditHistory);
    expect(page.props.initialData).toEqual({ events: [] });
  });
});
