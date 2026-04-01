import { cookies } from "next/headers";
import { getAllAdvisors, ALL_BOARDS } from "@/lib/advisors";
import BoardroomClient from "./BoardroomClient";

export const dynamic = "force-dynamic";

export default async function BoardroomPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("boardroom-id")?.value ?? "anonymous";
  const advisors = await getAllAdvisors(userId);
  return <BoardroomClient advisors={advisors} boards={ALL_BOARDS} />;
}
