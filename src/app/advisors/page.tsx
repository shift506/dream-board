import { getAllAdvisors, ALL_BOARDS } from "@/lib/advisors";
import AdvisorsClient from "./AdvisorsClient";

export default function AdvisorsPage() {
  const advisors = getAllAdvisors();
  return <AdvisorsClient advisors={advisors} boards={ALL_BOARDS} />;
}
