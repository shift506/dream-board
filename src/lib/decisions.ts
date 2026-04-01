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

function blobAvailable() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

async function fetchBlob(url: string): Promise<Response> {
  return fetch(url, {
    headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    cache: "no-store",
  });
}

function slugToTitle(slug: string) {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// ── Read all decisions ──────────────────────────────────────────────────────

export async function getAllDecisions(): Promise<Decision[]> {
  if (blobAvailable()) {
    try {
      const { list } = await import("@vercel/blob");
      const { blobs } = await list({ prefix: "sessions/" });
      const jsonBlobs = blobs.filter((b) => b.pathname.endsWith(".json"));
      const sessions = await Promise.all(
        jsonBlobs.map(async (b) => {
          try {
            const res = await fetchBlob(b.url);
            const data = (await res.json()) as SessionData;
            const slug = b.pathname.replace("sessions/", "").replace(".json", "");
            return {
              slug,
              title: slugToTitle(slug),
              date: data.date,
              question: data.question,
              files: [{ name: "session.json", content: "" }],
            } as Decision;
          } catch {
            return null;
          }
        })
      );
      return sessions
        .filter((d): d is Decision => d !== null)
        .sort((a, b) => (a.date < b.date ? 1 : -1));
    } catch {}
  }
  return getAllDecisionsFromFs();
}

function getAllDecisionsFromFs(): Decision[] {
  const decisionsDir = path.join(DATA_ROOT, "decisions");
  if (!fs.existsSync(decisionsDir)) return [];
  const slugs = fs
    .readdirSync(decisionsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  return slugs
    .map((slug) => readDecisionFromFs(slug))
    .filter((d): d is Decision => d !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

// ── Read one session ────────────────────────────────────────────────────────

export async function readSessionData(slug: string): Promise<SessionData | null> {
  if (blobAvailable()) {
    try {
      const { list } = await import("@vercel/blob");
      const { blobs } = await list({ prefix: `sessions/${slug}.json` });
      if (blobs.length > 0) {
        const res = await fetchBlob(blobs[0].url);
        return (await res.json()) as SessionData;
      }
    } catch {}
  }
  return readSessionDataFromFs(slug);
}

function readSessionDataFromFs(slug: string): SessionData | null {
  const jsonPath = path.join(DATA_ROOT, "decisions", slug, "session.json");
  if (!fs.existsSync(jsonPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as SessionData;
  } catch {
    return null;
  }
}

// ── Read decision (markdown fallback) ──────────────────────────────────────

export function readDecision(slug: string): Decision | null {
  return readDecisionFromFs(slug);
}

function readDecisionFromFs(slug: string): Decision | null {
  const dir = path.join(DATA_ROOT, "decisions", slug);
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  if (files.length === 0) return null;
  const fileContents = files.map((f) => ({
    name: f,
    content: fs.readFileSync(path.join(dir, f), "utf-8"),
  }));
  const primary = fileContents[0].content;
  const dateMatch = primary.match(/\*\*Date:\*\*\s*(.+)/);
  const questionMatch = primary.match(/\*\*Question:\*\*\s*(.+)/);
  return {
    slug,
    title: slugToTitle(slug),
    date: dateMatch?.[1]?.trim() ?? "",
    question: questionMatch?.[1]?.trim() ?? slugToTitle(slug),
    files: fileContents,
  };
}

// ── Write session ───────────────────────────────────────────────────────────

export async function writeSession(
  slug: string,
  session: SessionData,
  markdown: string
): Promise<void> {
  if (blobAvailable()) {
    const { put } = await import("@vercel/blob");
    await Promise.all([
      put(`sessions/${slug}.json`, JSON.stringify(session, null, 2), {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      }),
      put(`sessions/${slug}.md`, markdown, {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "text/plain",
      }),
    ]);
    return;
  }
  // Local filesystem fallback
  const dir = path.join(DATA_ROOT, "decisions", slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "session.json"), JSON.stringify(session, null, 2), "utf-8");
  fs.writeFileSync(path.join(dir, "session.md"), markdown, "utf-8");
}
