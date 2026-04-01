export const dynamic = "force-dynamic";

import { getBusinessContext } from "@/lib/context";
import ContextEditor from "./ContextEditor";

export default async function ContextPage() {
  const content = await getBusinessContext();
  return <ContextEditor initial={content} />;
}
