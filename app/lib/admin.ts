export function isAdminEmail(email: string | null | undefined) {
  const administrators = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return Boolean(email && administrators.includes(email.toLowerCase()));
}