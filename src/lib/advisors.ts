import fs from "fs";
import path from "path";

const DATA_ROOT = path.join(process.cwd());

export interface Advisor {
  slug: string;
  name: string;
  focus: string;
  boards: string[];
  content: string; // raw markdown for AI prompting
}

// Board membership defined in advisors.md — replicated here as source of truth for the UI
const BOARD_ROSTER: Record<string, { focus: string; boards: string[] }> = {
  "seth-godin": { focus: "Positioning & Tribes", boards: ["Marketing", "Personal"] },
  "alex-hormozi": { focus: "Offers & Conversion", boards: ["Marketing"] },
  "dan-koe": { focus: "Leverage & Personal Monopoly", boards: ["Marketing", "Personal"] },
  "reid-hoffman": { focus: "Networks & Scale", boards: ["Marketing", "Strategy & Direction"] },
  "arlene-dickinson": { focus: "Market Reality & Buyers", boards: ["Marketing"] },
  "brene-brown": { focus: "Authenticity & Trust", boards: ["Marketing", "Personal"] },
  "steve-jobs": { focus: "Taste & Simplicity", boards: ["Marketing", "Execution & Momentum"] },
  "donella-meadows": { focus: "Systems Thinking", boards: ["Strategy & Direction"] },
  "roger-martin": { focus: "Integrative Strategy", boards: ["Strategy & Direction"] },
  "indy-johar": { focus: "Institutional Innovation", boards: ["Strategy & Direction"] },
  "jennifer-pahlka": { focus: "Public Sector Delivery", boards: ["Strategy & Direction"] },
  "barack-obama": { focus: "Narrative & Leadership", boards: ["Strategy & Direction", "Personal"] },
  "nassim-taleb": { focus: "Risk & Fragility", boards: ["Strategy & Direction", "Personal"] },
  "jason-fried": { focus: "Simplicity & Profitability", boards: ["Revenue & Business Model"] },
  "paul-graham": { focus: "Clarity & Simplicity", boards: ["Revenue & Business Model"] },
  "thomas-sowell": { focus: "Economic Reality", boards: ["Revenue & Business Model"] },
  "mel-robbins": { focus: "Action & Momentum", boards: ["Execution & Momentum", "Personal"] },
  "christian-bason": { focus: "Structured Innovation", boards: ["Execution & Momentum"] },
  "peter-senge": { focus: "Learning Organizations", boards: ["Systems Change"] },
  "everett-rogers": { focus: "Adoption Dynamics", boards: ["Systems Change"] },
  "marshall-ganz": { focus: "Movement Building", boards: ["Systems Change", "Personal"] },
  "henry-mintzberg": { focus: "Organizational Reality", boards: ["Systems Change"] },
  "andrew-bedford": { focus: "Narrative & Leadership", boards: ["Marketing", "Personal"] },
  "nick-scott": { focus: "Narrative & Leadership", boards: ["Systems Change", "Personal"] },
  "clayton-christensen": { focus: "Disruptive Innovation", boards: ["Strategy & Direction", "Revenue & Business Model"] },
  "adrienne-maree-brown": { focus: "Movement Building", boards: ["Strategy & Direction", "Systems Change"] },
  "adam-grant": { focus: "Rethinking, Generosity & Organizational Psychology", boards: ["Strategy & Direction", "Marketing", "Personal"] },
  "andrea-gibson": { focus: "Language, Vulnerability & the Political Heart", boards: ["Personal", "Marketing"] },
  "fred-rogers": { focus: "Presence & Human Dignity", boards: ["Personal", "Systems Change"] },
  "leonardo-da-vinci": { focus: "Curiosity, Synthesis & Making", boards: ["Strategy & Direction", "Execution & Momentum", "Marketing"] },
  "nelson-mandela": { focus: "Moral Leadership & Reconciliation", boards: ["Strategy & Direction", "Systems Change", "Personal"] },
  "viktor-frankl": { focus: "Meaning, Suffering & Human Freedom", boards: ["Personal", "Systems Change"] },
  "adam-smith": { focus: "Markets & Moral Sentiments", boards: ["Revenue & Business Model", "Strategy & Direction", "Systems Change"] },
  "amy-poehler": { focus: "Generosity, Collaboration & Joyful Leadership", boards: ["Personal", "Marketing"] },
  "ann-handley": { focus: "Writing, Content & Voice", boards: ["Marketing", "Strategy & Direction"] },
  "anne-marie-slaughter": { focus: "Networks, Power & Architecture of Change", boards: ["Strategy & Direction", "Systems Change", "Personal"] },
  "aristotle": { focus: "Virtue, Flourishing & Living Well", boards: ["Personal", "Strategy & Direction", "Marketing"] },
  "aswath-damodaran": { focus: "Valuation & Narrative", boards: ["Revenue & Business Model", "Strategy & Direction"] },
  "bell-hooks": { focus: "Love, Power & Liberatory Thinking", boards: ["Personal", "Systems Change", "Strategy & Direction"] },
  "byron-sharp": { focus: "Evidence-Based Marketing", boards: ["Marketing", "Revenue & Business Model"] },
  "esther-perel": { focus: "Desire, Relationship & Erotic Intelligence", boards: ["Personal", "Marketing"] },
  "fat-mike": { focus: "DIY Business & Punk Integrity", boards: ["Revenue & Business Model", "Strategy & Direction", "Marketing"] },
  "jon-stewart": { focus: "Accountability & Speaking Truth", boards: ["Marketing", "Personal", "Strategy & Direction"] },
  "karl-marx": { focus: "Capital, Class & Structural Critique", boards: ["Systems Change", "Revenue & Business Model", "Strategy & Direction"] },
  "kate-tarling": { focus: "Service Organizations & Structural Change", boards: ["Strategy & Direction", "Systems Change", "Execution & Momentum"] },
  "kathleen-eisenhardt": { focus: "Strategy & Competing on the Edge", boards: ["Revenue & Business Model", "Strategy & Direction"] },
  "lou-downe": { focus: "Service Design & Organizational Transformation", boards: ["Strategy & Direction", "Systems Change", "Marketing"] },
  "mike-michalowicz": { focus: "Profit First & Small Business", boards: ["Revenue & Business Model", "Execution & Momentum"] },
  "mohnish-pabrai": { focus: "Value Investing & Dhandho", boards: ["Revenue & Business Model", "Strategy & Direction"] },
  "ramit-sethi": { focus: "Pricing & Psychology of Money", boards: ["Revenue & Business Model", "Marketing", "Personal"] },
  "ray-dalio": { focus: "Principles & Radical Transparency", boards: ["Revenue & Business Model", "Strategy & Direction", "Systems Change"] },
  "richard-pope": { focus: "Platforms & Public Technology", boards: ["Strategy & Direction", "Systems Change", "Execution & Momentum"] },
  "rick-rubin": { focus: "Creative Process & Reduction", boards: ["Personal", "Strategy & Direction", "Marketing"] },
  "russell-ackoff": { focus: "Systems Thinking & Problem Dissolving", boards: ["Systems Change", "Strategy & Direction"] },
  "ruth-porat": { focus: "Capital Discipline & Financial Leadership", boards: ["Revenue & Business Model", "Strategy & Direction"] },
  "tina-fey": { focus: "Craft, Leadership & Execution", boards: ["Personal", "Marketing", "Execution & Momentum"] },
  "zohran-mamdani": { focus: "Political Organizing & Democratic Socialism", boards: ["Systems Change", "Strategy & Direction", "Marketing"] },
};

export const ALL_BOARDS = [
  "Marketing",
  "Strategy & Direction",
  "Revenue & Business Model",
  "Execution & Momentum",
  "Systems Change",
  "Personal",
];

function blobAvailable() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

async function fetchBlob(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Blob fetch failed: ${res.status}`);
  return res.text();
}

// Parse name, focus, and boards from markdown for advisors not in BOARD_ROSTER
function parseMarkdownMeta(slug: string, content: string): { name: string; focus: string; boards: string[] } {
  // Title line: "# Name – Focus" (em dash or regular dash)
  const titleMatch = content.match(/^#\s+(.+?)(?:\s+[–-]\s+(.+))?$/m);
  const name = titleMatch?.[1]?.trim() ??
    slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const focus = titleMatch?.[2]?.trim() ?? "Advisor";

  // Boards section: lines starting with "- " under "## Boards"
  const boardsMatch = content.match(/##\s+Boards\s*\n((?:[-*]\s+.+\n?)+)/);
  const boards: string[] = [];
  if (boardsMatch) {
    boardsMatch[1].split("\n").forEach((line) => {
      const b = line.replace(/^[-*]\s+/, "").trim();
      if (b) {
        // Match against ALL_BOARDS (handles trailing "Board" suffix)
        const match = ALL_BOARDS.find(
          (known) => b === known || b === `${known} Board` || b.startsWith(known)
        );
        if (match) boards.push(match);
      }
    });
  }

  return { name, focus, boards };
}

function buildAdvisorFromContent(slug: string, content: string): Advisor {
  if (BOARD_ROSTER[slug]) {
    const meta = BOARD_ROSTER[slug];
    const name = slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    return { slug, name, focus: meta.focus, boards: meta.boards, content };
  }
  const { name, focus, boards } = parseMarkdownMeta(slug, content);
  return { slug, name, focus, boards, content };
}

export async function getAllAdvisors(userId?: string): Promise<Advisor[]> {
  const advisorsDir = path.join(DATA_ROOT, "advisors");
  const files = fs.readdirSync(advisorsDir).filter((f) => f.endsWith(".md"));
  const advisors = new Map<string, Advisor>();

  for (const file of files) {
    const slug = file.replace(".md", "");
    const content = fs.readFileSync(path.join(advisorsDir, file), "utf-8");
    advisors.set(slug, buildAdvisorFromContent(slug, content));
  }

  if (blobAvailable() && userId) {
    try {
      const { list } = await import("@vercel/blob");
      const { blobs } = await list({ prefix: `users/${userId}/advisors/` });
      for (const blob of blobs) {
        const slug = blob.pathname
          .replace(`users/${userId}/advisors/`, "")
          .replace(".md", "");
        if (!advisors.has(slug)) {
          const content = await fetchBlob(blob.url);
          advisors.set(slug, buildAdvisorFromContent(slug, content));
        }
      }
    } catch {
      // Non-critical — use filesystem advisors only
    }
  }

  return Array.from(advisors.values());
}

export async function getAdvisor(slug: string, userId?: string): Promise<Advisor | null> {
  const filePath = path.join(DATA_ROOT, "advisors", `${slug}.md`);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    return buildAdvisorFromContent(slug, content);
  }

  if (blobAvailable() && userId) {
    try {
      const { list } = await import("@vercel/blob");
      const { blobs } = await list({ prefix: `users/${userId}/advisors/${slug}.md` });
      if (blobs.length > 0) {
        const content = await fetchBlob(blobs[0].url);
        return buildAdvisorFromContent(slug, content);
      }
    } catch {
      // Not found
    }
  }

  return null;
}

export async function getAdvisorsByBoard(board: string, userId?: string): Promise<Advisor[]> {
  const all = await getAllAdvisors(userId);
  return all.filter((a) => a.boards.includes(board));
}
