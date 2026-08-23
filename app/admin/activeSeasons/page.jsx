import { auth } from "../../../auth";
import { getAllUserFromDb, getCurrentWeek } from "../../utils/db";
import ActiveSeasonsForm from "./activeSeasonsForm";

function isAdmin(email) {
  // This value is read only on the server, so the allowlist cannot be changed by the browser.
  const administrators = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return Boolean(email && administrators.includes(email.toLowerCase()));
}

export default async function ActiveSeasonsPage() {
  const session = await auth();
  // Check access before loading the complete user list or rendering the management form.
  if (!isAdmin(session?.user?.email)) {
    return <p>You are not authorized to manage active seasons.</p>;
  }

  const [usersJson, currentWeek] = await Promise.all([getAllUserFromDb(), getCurrentWeek()]);
  const users = JSON.parse(usersJson).sort((firstUser, secondUser) => firstUser.name.localeCompare(secondUser.name));
  // Offer existing seasons plus the current season, even when no user has joined it yet.
  const seasons = [...new Set(users.flatMap((user) => user.activeSeasons || []))].sort((first, second) => second - first);
  if (!seasons.includes(Number(currentWeek.season))) {
    seasons.unshift(Number(currentWeek.season));
  }

  return <ActiveSeasonsForm users={users} seasons={seasons} />;
}