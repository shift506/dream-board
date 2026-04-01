import { getAllAdvisors, ALL_BOARDS } from "@/lib/advisors";
import BoardroomClient from "./BoardroomClient";

export default async function BoardroomPage() {
  const advisors = await getAllAdvisors();
  return <BoardroomClient advisors={advisors} boards={ALL_BOARDS} />;
}
