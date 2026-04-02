import { cookies } from "next/headers";
import { getAllAdvisors, ALL_BOARDS } from "@/lib/advisors";
import { getBusinessContext } from "@/lib/context";
import BoardroomClient from "./BoardroomClient";

export const dynamic = "force-dynamic";

export default async function BoardroomPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("boardroom-id")?.value ?? "anonymous";
  const [advisors, business, project, personal] = await Promise.all([
    getAllAdvisors(userId),
    getBusinessContext(userId, "business"),
    getBusinessContext(userId, "project"),
    getBusinessContext(userId, "personal"),
  ]);
  const hasContext = !!(business || project || personal);
  return <BoardroomClient advisors={advisors} boards={ALL_BOARDS} hasContext={hasContext} />;
}
