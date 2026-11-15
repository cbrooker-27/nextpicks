import { fireEvent, render, screen } from "@testing-library/react";
import ResponsiveDrawer from "./responsiveDrawer";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  useSession: () => ({ data: { user: { name: "Test User" } }, status: "authenticated" }),
}));

describe("ResponsiveDrawer", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("navigates to Previous Weeks from the drawer", () => {
    render(<ResponsiveDrawer />);

    const previousWeeksButtons = screen.getAllByRole("button", { name: "Previous Weeks" });
    expect(previousWeeksButtons.length).toBeGreaterThan(0);
    expect(previousWeeksButtons[0]).toBeEnabled();

    fireEvent.click(previousWeeksButtons[0]);

    expect(mockPush).toHaveBeenCalledWith("/picks/previousWeeks");
  });
});
