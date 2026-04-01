import fs from "fs";
import path from "path";

const DATA_ROOT = process.cwd();

export function getBusinessContext(): string {
  const contextPath = path.join(DATA_ROOT, "context.md");
  if (!fs.existsSync(contextPath)) return "";
  return fs.readFileSync(contextPath, "utf-8");
}
