import { auth } from "../../../auth";
import { isAdminEmail } from "@/app/lib/admin";
import AdminOverridePicks from "./adminOverridePicks";

export default async function AdminOverridePicksPage() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return <p>You are not authorized to make player picks.</p>;
  }

  return <AdminOverridePicks />;
}
