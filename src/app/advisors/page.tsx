import { cookies } from "next/headers";
import { getAllAdvisors, ALL_BOARDS } from "@/lib/advisors";
import AdvisorsClient from "./AdvisorsClient";

export const dynamic = "force-dynamic";

export default async function AdvisorsPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("boardroom-id")?.value ?? "anonymous";
  const advisors = await getAllAdvisors(userId);
  return <AdvisorsClient advisors={advisors} boards={ALL_BOARDS} />;
}
