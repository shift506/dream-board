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
  // Brand & Positioning
  "seth-godin":        { focus: "Positioning & Tribes",                          boards: ["Brand & Positioning"] },
  "alex-hormozi":      { focus: "Offers & Conversion",                           boards: ["Brand & Positioning", "Revenue & Business Model"] },
  "arlene-dickinson":  { focus: "Market Reality & Buyers",                       boards: ["Brand & Positioning"] },
  "ann-handley":       { focus: "Writing, Content & Voice",                      boards: ["Brand & Positioning"] },
  "byron-sharp":       { focus: "Evidence-Based Marketing",                      boards: ["Brand & Positioning"] },
  "dan-koe":           { focus: "Leverage & Personal Monopoly",                  boards: ["Brand & Positioning"] },
  // Narrative & Voice
  "andrea-gibson":     { focus: "Language, Vulnerability & the Political Heart", boards: ["Narrative & Voice"] },
  "rick-rubin":        { focus: "Creative Process & Reduction",                  boards: ["Narrative & Voice", "Meaning & Inner Life"] },
  "jon-stewart":       { focus: "Accountability & Speaking Truth",               boards: ["Narrative & Voice"] },
  "tina-fey":          { focus: "Craft, Leadership & Execution",                 boards: ["Narrative & Voice"] },
  "andrew-bedford":    { focus: "Narrative & Leadership",                        boards: ["Narrative & Voice"] },
  "amy-poehler":       { focus: "Generosity, Collaboration & Joyful Leadership", boards: ["Narrative & Voice", "Growth & Influence"] },
  // Growth & Influence
  "brene-brown":       { focus: "Authenticity & Trust",                          boards: ["Growth & Influence", "Meaning & Inner Life"] },
  "adam-grant":        { focus: "Rethinking & Organizational Psychology",        boards: ["Growth & Influence", "Strategy & Decisions"] },
  "esther-perel":      { focus: "Desire, Relationship & Erotic Intelligence",    boards: ["Growth & Influence"] },
  "reid-hoffman":      { focus: "Networks & Scale",                              boards: ["Growth & Influence"] },
  "ramit-sethi":       { focus: "Pricing & Psychology of Money",                 boards: ["Growth & Influence"] },
  // Strategy & Decisions
  "roger-martin":      { focus: "Integrative Strategy",                          boards: ["Strategy & Decisions"] },
  "nassim-taleb":      { focus: "Risk & Fragility",                              boards: ["Strategy & Decisions", "Meaning & Inner Life"] },
  "clayton-christensen": { focus: "Disruptive Innovation",                       boards: ["Strategy & Decisions"] },
  "kathleen-eisenhardt": { focus: "Strategy & Competing on the Edge",            boards: ["Strategy & Decisions"] },
  "donella-meadows":   { focus: "Systems Thinking",                              boards: ["Strategy & Decisions"] },
  // Leadership & Power
  "barack-obama":      { focus: "Narrative & Leadership",                        boards: ["Leadership & Power"] },
  "nelson-mandela":    { focus: "Moral Leadership & Reconciliation",             boards: ["Leadership & Power"] },
  "anne-marie-slaughter": { focus: "Networks, Power & Architecture of Change",   boards: ["Leadership & Power"] },
  "bell-hooks":        { focus: "Love, Power & Liberatory Thinking",             boards: ["Leadership & Power"] },
  "marshall-ganz":     { focus: "Movement Building",                             boards: ["Leadership & Power", "Public & Civic"] },
  "adrienne-maree-brown": { focus: "Emergent Strategy & Movement Building",      boards: ["Leadership & Power", "Public & Civic"] },
  // Economics & Capital
  "adam-smith":        { focus: "Markets & Moral Sentiments",                    boards: ["Economics & Capital"] },
  "karl-marx":         { focus: "Capital, Class & Structural Critique",          boards: ["Economics & Capital"] },
  "thomas-sowell":     { focus: "Economic Reality",                              boards: ["Economics & Capital"] },
  "aswath-damodaran":  { focus: "Valuation & Narrative",                         boards: ["Economics & Capital"] },
  "ray-dalio":         { focus: "Principles & Radical Transparency",             boards: ["Economics & Capital"] },
  "ruth-porat":        { focus: "Capital Discipline & Financial Leadership",     boards: ["Economics & Capital"] },
  // Revenue & Business Model
  "jason-fried":       { focus: "Simplicity & Profitability",                   boards: ["Revenue & Business Model"] },
  "paul-graham":       { focus: "Clarity & Simplicity",                         boards: ["Revenue & Business Model"] },
  "fat-mike":          { focus: "DIY Business & Punk Integrity",                 boards: ["Revenue & Business Model"] },
  "mike-michalowicz":  { focus: "Profit First & Small Business",                 boards: ["Revenue & Business Model"] },
  "mohnish-pabrai":    { focus: "Value Investing & Dhandho",                     boards: ["Revenue & Business Model"] },
  // Systems Change
  "peter-senge":       { focus: "Learning Organizations",                        boards: ["Systems Change"] },
  "russell-ackoff":    { focus: "Systems Thinking & Problem Dissolving",         boards: ["Systems Change"] },
  "henry-mintzberg":   { focus: "Organizational Reality",                        boards: ["Systems Change"] },
  "everett-rogers":    { focus: "Adoption Dynamics",                             boards: ["Systems Change"] },
  "nick-scott":        { focus: "Narrative & Leadership",                        boards: ["Systems Change"] },
  "zohran-mamdani":    { focus: "Political Organizing & Democratic Socialism",   boards: ["Systems Change", "Public & Civic"] },
  // Execution & Momentum
  "steve-jobs":        { focus: "Taste & Simplicity",                            boards: ["Execution & Momentum"] },
  "mel-robbins":       { focus: "Action & Momentum",                             boards: ["Execution & Momentum"] },
  "christian-bason":   { focus: "Structured Innovation",                         boards: ["Execution & Momentum"] },
  "kate-tarling":      { focus: "Service Organizations & Structural Change",     boards: ["Execution & Momentum"] },
  "lou-downe":         { focus: "Service Design & Organizational Transformation", boards: ["Execution & Momentum"] },
  "leonardo-da-vinci": { focus: "Curiosity, Synthesis & Making",                 boards: ["Execution & Momentum"] },
  // Meaning & Inner Life
  "viktor-frankl":     { focus: "Meaning, Suffering & Human Freedom",            boards: ["Meaning & Inner Life"] },
  "fred-rogers":       { focus: "Presence & Human Dignity",                      boards: ["Meaning & Inner Life"] },
  "aristotle":         { focus: "Virtue, Flourishing & Living Well",             boards: ["Meaning & Inner Life"] },
  // Public & Civic
  "indy-johar":        { focus: "Institutional Innovation",                      boards: ["Public & Civic"] },
  "jennifer-pahlka":   { focus: "Public Sector Delivery",                        boards: ["Public & Civic"] },
  "richard-pope":      { focus: "Platforms & Public Technology",                 boards: ["Public & Civic"] },
};

export const ALL_BOARDS = [
  "Brand & Positioning",
  "Narrative & Voice",
  "Growth & Influence",
  "Strategy & Decisions",
  "Leadership & Power",
  "Economics & Capital",
  "Revenue & Business Model",
  "Systems Change",
  "Execution & Momentum",
  "Meaning & Inner Life",
  "Public & Civic",
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
