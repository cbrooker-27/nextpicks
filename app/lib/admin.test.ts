import { isAdminEmail } from "./admin";

describe("isAdminEmail", () => {
  const originalAdminEmails = process.env.ADMIN_EMAILS;

  afterEach(() => {
    if (originalAdminEmails === undefined) {
      delete process.env.ADMIN_EMAILS;
    } else {
      process.env.ADMIN_EMAILS = originalAdminEmails;
    }
  });

  it("matches allowlisted addresses case-insensitively and ignores whitespace", () => {
    process.env.ADMIN_EMAILS = " first@example.com, Admin@Example.com ";

    expect(isAdminEmail("admin@example.com")).toBe(true);
    expect(isAdminEmail(" outsider@example.com ")).toBe(false);
  });

  it("denies missing emails and an empty allowlist", () => {
    process.env.ADMIN_EMAILS = " ";

    expect(isAdminEmail(undefined)).toBe(false);
    expect(isAdminEmail("admin@example.com")).toBe(false);
  });
});