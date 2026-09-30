import { auth } from "../../../auth";
import { isAdminEmail } from "@/app/lib/admin";
import ChangeWeek from "./changeWeek";

export default async function ChangeWeekPage() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return <p>You are not authorized to change the current week.</p>;
  }

  return <ChangeWeek />;
}
