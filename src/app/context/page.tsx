export const dynamic = "force-dynamic";

import { getBusinessContext } from "@/lib/context";
import ContextEditor from "./ContextEditor";

export default function ContextPage() {
  const content = getBusinessContext();
  return <ContextEditor initial={content} />;
}
