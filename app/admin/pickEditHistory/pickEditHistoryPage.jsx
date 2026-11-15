import { auth } from "../../../auth";
import { isAdminEmail } from "@/app/lib/admin";
import { getPickEditHistory } from "@/app/serverActions/pickEditHistory";
import PickEditHistory from "./pickEditHistory";

export default async function PickEditHistoryPage() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return <p>You are not authorized to view pick-edit history.</p>;
  }

  const initialData = await getPickEditHistory();
  return <PickEditHistory initialData={initialData} />;
}
