import { getAllAdvisors, ALL_BOARDS } from "@/lib/advisors";
import BoardroomClient from "./BoardroomClient";

export default function BoardroomPage() {
  const advisors = getAllAdvisors();
  return <BoardroomClient advisors={advisors} boards={ALL_BOARDS} />;
}
