export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { getBusinessContext } from "@/lib/context";
import ContextEditor from "./ContextEditor";

export default async function ContextPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("boardroom-id")?.value ?? "anonymous";
  const content = await getBusinessContext(userId);
  return <ContextEditor initial={content} userId={userId} />;
}
