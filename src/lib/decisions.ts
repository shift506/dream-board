import fs from "fs";
import path from "path";
import type { TensionData } from "@/components/TensionMap";

const DATA_ROOT = path.join(process.cwd());

export interface SessionAdvisor {
  slug: string;
  name: string;
  focus: string;
  boards: string[];
  round1: string;
  round2: string;
}

export interface SessionData {
  question: string;
  date: string;
  mode: "decision" | "advisory";
  advisors: SessionAdvisor[];
  synthesis: string;
  tension: TensionData | null;
}

export interface Decision {
  slug: string;
  title: string;
  date: string;
  question: string;
  files: { name: string; content: string }[];
}

export function getAllDecisions(): Decision[] {
  const decisionsDir = path.join(DATA_ROOT, "decisions");
  if (!fs.existsSync(decisionsDir)) return [];

  const slugs = fs
    .readdirSync(decisionsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  return slugs
    .map((slug) => readDecision(slug))
    .filter((d): d is Decision => d !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function readDecision(slug: string): Decision | null {
  const dir = path.join(DATA_ROOT, "decisions", slug);
  if (!fs.existsSync(dir)) return null;

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  if (files.length === 0) return null;

  const fileContents = files.map((f) => ({
    name: f,
    content: fs.readFileSync(path.join(dir, f), "utf-8"),
  }));

  // Try to extract date + question from the first file
  const primary = fileContents[0].content;
  const dateMatch = primary.match(/\*\*Date:\*\*\s*(.+)/);
  const questionMatch = primary.match(/\*\*Question:\*\*\s*(.+)/);

  const title = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    slug,
    title,
    date: dateMatch?.[1]?.trim() ?? "",
    question: questionMatch?.[1]?.trim() ?? title,
    files: fileContents,
  };
}

export function readSessionData(slug: string): SessionData | null {
  const jsonPath = path.join(DATA_ROOT, "decisions", slug, "session.json");
  if (!fs.existsSync(jsonPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as SessionData;
  } catch {
    return null;
  }
}

export function writeDecisionFile(slug: string, filename: string, content: string): void {
  const dir = path.join(DATA_ROOT, "decisions", slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), content, "utf-8");
}
