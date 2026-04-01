import { getAllAdvisors, ALL_BOARDS } from "@/lib/advisors";
import AdvisorsClient from "./AdvisorsClient";

export default async function AdvisorsPage() {
  const advisors = await getAllAdvisors();
  return <AdvisorsClient advisors={advisors} boards={ALL_BOARDS} />;
}
