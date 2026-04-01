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
};

export const ALL_BOARDS = [
  "Marketing",
  "Strategy & Direction",
  "Revenue & Business Model",
  "Execution & Momentum",
  "Systems Change",
  "Personal",
];

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

export function getAllAdvisors(): Advisor[] {
  const advisorsDir = path.join(DATA_ROOT, "advisors");
  const files = fs.readdirSync(advisorsDir).filter((f) => f.endsWith(".md"));

  return files.map((file) => {
    const slug = file.replace(".md", "");
    const content = fs.readFileSync(path.join(advisorsDir, file), "utf-8");
    if (BOARD_ROSTER[slug]) {
      const meta = BOARD_ROSTER[slug];
      const name = slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      return { slug, name, focus: meta.focus, boards: meta.boards, content };
    }
    const { name, focus, boards } = parseMarkdownMeta(slug, content);
    return { slug, name, focus, boards, content };
  });
}

export function getAdvisor(slug: string): Advisor | null {
  const filePath = path.join(DATA_ROOT, "advisors", `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf-8");
  if (BOARD_ROSTER[slug]) {
    const meta = BOARD_ROSTER[slug];
    const name = slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    return { slug, name, focus: meta.focus, boards: meta.boards, content };
  }
  const { name, focus, boards } = parseMarkdownMeta(slug, content);
  return { slug, name, focus, boards, content };
}

export function getAdvisorsByBoard(board: string): Advisor[] {
  return getAllAdvisors().filter((a) => a.boards.includes(board));
}
