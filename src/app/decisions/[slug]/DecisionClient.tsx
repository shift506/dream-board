"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import VoteBadge, { type Vote } from "@/components/VoteBadge";
import TensionMap from "@/components/TensionMap";
import type { SessionData, SessionAdvisor } from "@/lib/decisions";

// ─── HTML Report Generator ─────────────────────────────────────────────────

// Brand tokens
const G = {
  galaxy: "#10213C",
  galaxyLight: "#1a2d4a",
  galaxyLighter: "#203354",
  newLeaf: "#D6DE23",
  breeze: "#BAE0C6",
  ocean: "#3B8EA5",
  blossom: "#F0AB86",
};

const BOARD_BORDER: Record<string, string> = {
  "Marketing": G.blossom,
  "Strategy & Direction": G.ocean,
  "Revenue & Business Model": G.breeze,
  "Execution & Momentum": G.newLeaf,
  "Systems Change": G.ocean,
  "Personal": G.blossom,
};

const VOTE_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  YES:         { text: G.breeze,   bg: "rgba(186,224,198,0.12)", border: "rgba(186,224,198,0.4)" },
  NO:          { text: G.blossom,  bg: "rgba(240,171,134,0.12)", border: "rgba(240,171,134,0.4)" },
  CONDITIONAL: { text: G.ocean,    bg: "rgba(59,142,165,0.12)",  border: "rgba(59,142,165,0.4)"  },
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function mdToHtml(md: string): string {
  const escaped = esc(md);
  return escaped
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[^]*?<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .split(/\n{2,}/)
    .map((block) => block.startsWith("<") ? block : `<p>${block.replace(/\n/g, " ")}</p>`)
    .join("\n")
    .replace(/<p>\s*<\/p>/g, "");
}

function advisorCard(advisor: SessionAdvisor, round: "round1" | "round2", _mode: "decision" | "advisory", idx: number): string {
  const content = round === "round1" ? advisor.round1 : advisor.round2;
  if (!content) return "";
  const voteMatch = content.match(/\*\*(?:your\s+)?vote[^*]*\*\*[:\s]*(YES|NO|CONDITIONAL)/i)
    || content.match(/\bVOTE[:\s]+(YES|NO|CONDITIONAL)\b/i);
  const vote = voteMatch?.[1]?.toUpperCase();
  const vc = vote ? VOTE_COLORS[vote] : null;
  const borderColor = BOARD_BORDER[advisor.boards?.[0]] ?? "rgba(255,255,255,0.15)";
  const initials = advisor.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const cardId = `card-${round}-${idx}`;

  return `
<div class="advisor-card" style="border-left-color:${borderColor}">
  <button class="advisor-toggle" onclick="toggle('${cardId}')" aria-expanded="false">
    <div class="advisor-avatar">${esc(initials)}</div>
    <div class="advisor-meta">
      <div class="advisor-name-row">
        <span class="advisor-name">${esc(advisor.name)}</span>
        <span class="advisor-focus">${esc(advisor.focus)}</span>
        ${vc && vote ? `<span class="vote-badge" style="color:${vc.text};background:${vc.bg};border-color:${vc.border}">${vote}</span>` : ""}
      </div>
      <div class="advisor-preview" id="${cardId}-preview">${esc(advisor.name.split(" ")[0])} — click to expand</div>
    </div>
    <svg class="chevron" id="${cardId}-chevron" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 4l4 4 4-4"/></svg>
  </button>
  <div class="advisor-body" id="${cardId}" style="display:none">
    <div class="md-content">${mdToHtml(content)}</div>
  </div>
</div>`;
}

function buildReport(session: SessionData): string {
  const hasRound2 = session.advisors.some((a) => !!a.round2);
  const hasTensions = !!session.tension;

  const tabs = [
    { id: "tab-r1", label: "Round 1", sub: session.mode === "advisory" ? "Strategic Reads" : "Positions" },
    ...(hasRound2 ? [{ id: "tab-r2", label: "Round 2", sub: session.mode === "advisory" ? "Pushback" : "Rebuttals" }] : []),
    ...(hasTensions ? [{ id: "tab-tensions", label: "Tensions", sub: "" }] : []),
    ...(session.synthesis ? [{ id: "tab-synthesis", label: "Synthesis", sub: "" }] : []),
  ];

  const faultLines = session.tension?.fault_lines?.map((fl) => `
    <div class="fault-card">
      <div class="fault-topic">${esc(fl.topic)}</div>
      <div class="fault-sides">
        <div class="fault-side"><span class="fault-side-label">${esc(fl.side_a.label)}</span>${fl.side_a.advisors.map(esc).join(", ")}</div>
        <div class="fault-vs">vs</div>
        <div class="fault-side"><span class="fault-side-label">${esc(fl.side_b.label)}</span>${fl.side_b.advisors.map(esc).join(", ")}</div>
      </div>
      <div class="fault-desc">${esc(fl.description)}</div>
    </div>`).join("") ?? "";

  const agreements = session.tension?.agreements?.map((a) =>
    `<li>${esc(a)}</li>`
  ).join("") ?? "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(session.question)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --galaxy:${G.galaxy};--galaxy-light:${G.galaxyLight};--galaxy-lighter:${G.galaxyLighter};
  --new-leaf:${G.newLeaf};--breeze:${G.breeze};--ocean:${G.ocean};--blossom:${G.blossom};
}
body{font-family:'Poppins',system-ui,sans-serif;background:var(--galaxy);color:rgba(255,255,255,0.85);line-height:1.6;min-height:100vh}
a{color:var(--new-leaf)}

/* Layout */
.page{max-width:780px;margin:0 auto;padding:2rem 1.25rem 4rem}

/* Header */
.report-header{padding:2rem 0 1.75rem;border-bottom:1px solid rgba(255,255,255,0.08);margin-bottom:2rem}
.header-top{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:1.25rem}
.mode-badge{display:inline-block;font-size:0.65rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;padding:0.25rem 0.6rem;border-radius:4px;border:1px solid;background:rgba(214,222,35,0.1);color:var(--new-leaf);border-color:rgba(214,222,35,0.3)}
.print-btn{font-family:inherit;font-size:0.75rem;padding:0.4rem 0.9rem;border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.5);cursor:pointer;transition:all 0.15s}
.print-btn:hover{background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.85)}
h1{font-size:1.6rem;font-weight:700;line-height:1.3;color:#fff;margin-bottom:0.5rem}
.header-meta{font-size:0.75rem;color:rgba(255,255,255,0.35);display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap}
.header-meta .sep{opacity:0.3}
.advisor-chips{display:flex;flex-wrap:wrap;gap:0.4rem;margin-top:0.75rem}
.advisor-chip{font-size:0.7rem;padding:0.2rem 0.6rem;border-radius:4px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.55)}

/* Tabs */
.tabs{display:flex;border-bottom:1px solid rgba(255,255,255,0.1);margin-bottom:1.5rem;overflow-x:auto;gap:0;-ms-overflow-style:none;scrollbar-width:none}
.tabs::-webkit-scrollbar{display:none}
.tab-btn{flex-shrink:0;padding:0.75rem 1.25rem;font-family:inherit;font-size:0.82rem;font-weight:500;background:none;border:none;border-bottom:2px solid transparent;color:rgba(255,255,255,0.4);cursor:pointer;transition:all 0.15s;white-space:nowrap}
.tab-btn:hover{color:rgba(255,255,255,0.7)}
.tab-btn.active{color:#fff;border-bottom-color:var(--new-leaf)}
.tab-btn .sub{font-size:0.7rem;color:rgba(255,255,255,0.25);margin-left:0.35rem}
.tab-btn.active .sub{color:rgba(255,255,255,0.4)}
.tab-panel{display:none}.tab-panel.active{display:block}

/* Advisor cards */
.advisor-card{border:1px solid rgba(255,255,255,0.08);border-left-width:3px;border-radius:8px;margin-bottom:0.75rem;background:var(--galaxy-light);overflow:hidden;transition:border-color 0.15s}
.advisor-toggle{width:100%;padding:0.9rem 1rem;display:flex;align-items:center;gap:0.75rem;background:none;border:none;color:inherit;cursor:pointer;text-align:left;transition:background 0.15s}
.advisor-toggle:hover{background:rgba(255,255,255,0.03)}
.advisor-avatar{width:32px;height:32px;flex-shrink:0;border-radius:6px;background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:600;color:rgba(255,255,255,0.45)}
.advisor-meta{flex:1;min-width:0}
.advisor-name-row{display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap}
.advisor-name{font-size:0.875rem;font-weight:600;color:rgba(255,255,255,0.9)}
.advisor-focus{font-size:0.72rem;color:rgba(255,255,255,0.35)}
.advisor-preview{font-size:0.72rem;color:rgba(255,255,255,0.3);margin-top:0.15rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chevron{width:12px;height:12px;flex-shrink:0;color:rgba(255,255,255,0.25);transition:transform 0.2s}
.chevron.open{transform:rotate(180deg)}
.advisor-body{border-top:1px solid rgba(255,255,255,0.06);padding:1.1rem 1rem 1rem 1rem}

/* Markdown content */
.md-content{font-size:0.85rem;color:rgba(255,255,255,0.75);line-height:1.7}
.md-content h1,.md-content h2{font-size:0.875rem;font-weight:600;color:rgba(255,255,255,0.9);margin:1rem 0 0.35rem}
.md-content h3{font-size:0.82rem;font-weight:600;color:rgba(255,255,255,0.75);margin:0.75rem 0 0.25rem}
.md-content p{margin-bottom:0.6rem}
.md-content ul{padding-left:1.1rem;margin-bottom:0.6rem}
.md-content li{margin-bottom:0.2rem}
.md-content strong{font-weight:600;color:rgba(255,255,255,0.9)}
.md-content em{font-style:italic;color:rgba(255,255,255,0.6)}

/* Vote badge */
.vote-badge{font-size:0.62rem;font-weight:700;letter-spacing:0.08em;padding:0.15rem 0.45rem;border-radius:4px;border:1px solid}

/* Tensions */
.tensions-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem}
@media(max-width:540px){.tensions-grid{grid-template-columns:1fr}}
.vote-group{background:var(--galaxy-light);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:0.875rem}
.vote-group-label{font-size:0.65rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.5rem}
.vote-group-names{font-size:0.82rem;color:rgba(255,255,255,0.65)}
.fault-card{background:var(--galaxy-light);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:1rem;margin-bottom:0.75rem}
.fault-topic{font-size:0.875rem;font-weight:600;color:rgba(255,255,255,0.9);margin-bottom:0.75rem}
.fault-sides{display:grid;grid-template-columns:1fr auto 1fr;gap:0.5rem;align-items:start;margin-bottom:0.75rem}
.fault-side{font-size:0.8rem;color:rgba(255,255,255,0.6)}
.fault-side-label{display:block;font-size:0.65rem;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:0.2rem}
.fault-vs{font-size:0.7rem;color:rgba(255,255,255,0.2);text-align:center;padding-top:1.2rem}
.fault-desc{font-size:0.78rem;color:rgba(255,255,255,0.4);font-style:italic;border-top:1px solid rgba(255,255,255,0.06);padding-top:0.6rem}
.agreements{margin-top:1rem}
.agreements-title{font-size:0.65rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:0.6rem}
.agreements ul{padding-left:1.1rem}
.agreements li{font-size:0.82rem;color:rgba(255,255,255,0.55);margin-bottom:0.25rem}

/* Synthesis */
.synthesis-card{background:rgba(214,222,35,0.05);border:1px solid rgba(214,222,35,0.2);border-radius:8px;padding:1.25rem}
.synthesis-chair{display:flex;align-items:center;gap:0.6rem;margin-bottom:1rem}
.chair-badge{width:30px;height:30px;border-radius:6px;background:rgba(214,222,35,0.2);display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;color:var(--new-leaf)}
.chair-name{font-size:0.875rem;font-weight:600;color:rgba(255,255,255,0.9)}
.synthesis-card .md-content h2{color:var(--new-leaf)}

/* Footer */
.report-footer{margin-top:3rem;padding-top:1.5rem;border-top:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap}
.footer-left{display:flex;align-items:center;gap:1rem}
.footer-logo{height:22px;opacity:0.55}
.footer-url{font-size:0.72rem;color:rgba(255,255,255,0.25);text-decoration:none}
.footer-url:hover{color:rgba(255,255,255,0.5)}
.footer-right{font-size:0.7rem;color:rgba(255,255,255,0.2);text-align:right}
.footer-right a{color:rgba(59,142,165,0.7);text-decoration:none}
@media print{.report-footer{border-top-color:#e5e5e5}.footer-logo{opacity:0.7}.footer-url{color:#666}.footer-right{color:#999}}

/* Section label */
.section-label{font-size:0.65rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin-bottom:1rem}

/* Print */
@media print{
  body{background:#fff!important;color:#111!important}
  .print-btn{display:none}
  .tabs{display:none}
  .tab-panel{display:block!important}
  .advisor-body{display:block!important}
  .advisor-card{background:#f9f9f9!important;border-color:#ddd!important;break-inside:avoid}
  .synthesis-card{background:#f9fff0!important;border-color:#bada6e!important}
  .fault-card,.vote-group{background:#f9f9f9!important;border-color:#ddd!important}
  .md-content,.fault-side,.fault-desc,.agreements li{color:#333!important}
  .advisor-name,.fault-topic,.chair-name{color:#111!important}
  .advisor-focus,.advisor-preview{color:#666!important}
  h1{color:#111!important}
  .header-meta{color:#666!important}
}
</style>
</head>
<body>
<div class="page">

  <div class="report-header">
    <div class="header-top">
      <span class="mode-badge">${session.mode === "advisory" ? "Advisory Session" : "Decision Session"}</span>
      <button class="print-btn" onclick="window.print()">Print / Save PDF</button>
    </div>
    <h1>${esc(session.question)}</h1>
    <div class="header-meta">
      <span>${esc(session.date)}</span>
      <span class="sep">·</span>
      <span>${session.advisors.length} advisor${session.advisors.length !== 1 ? "s" : ""}</span>
    </div>
    <div class="advisor-chips">
      ${session.advisors.map((a) => `<span class="advisor-chip">${esc(a.name)}</span>`).join("")}
    </div>
  </div>

  <div class="tabs">
    ${tabs.map((t, i) => `
    <button class="tab-btn${i === 0 ? " active" : ""}" onclick="switchTab('${t.id}')" id="btn-${t.id}">
      ${esc(t.label)}${t.sub ? `<span class="sub">${esc(t.sub)}</span>` : ""}
    </button>`).join("")}
  </div>

  <div class="tab-panel active" id="tab-r1">
    ${session.advisors.map((a, i) => advisorCard(a, "round1", session.mode, i)).join("")}
  </div>

  ${hasRound2 ? `
  <div class="tab-panel" id="tab-r2">
    ${session.advisors.map((a, i) => advisorCard(a, "round2", session.mode, i)).join("")}
  </div>` : ""}

  ${hasTensions ? `
  <div class="tab-panel" id="tab-tensions">
    ${session.tension?.vote_summary ? `
    <div class="tensions-grid">
      ${Object.entries(session.tension.vote_summary).map(([vote, names]) => {
        const vc = VOTE_COLORS[vote];
        return `<div class="vote-group">
          <div class="vote-group-label" style="color:${vc?.text ?? "#fff"}">${esc(vote)}</div>
          <div class="vote-group-names">${(names as string[]).map(esc).join(", ")}</div>
        </div>`;
      }).join("")}
    </div>` : ""}
    ${faultLines}
    ${agreements ? `<div class="agreements"><div class="agreements-title">Points of Agreement</div><ul>${agreements}</ul></div>` : ""}
  </div>` : ""}

  ${session.synthesis ? `
  <div class="tab-panel" id="tab-synthesis">
    <div class="synthesis-card">
      <div class="synthesis-chair">
        <div class="chair-badge">C</div>
        <span class="chair-name">The Chair</span>
      </div>
      <div class="md-content">${mdToHtml(session.synthesis)}</div>
    </div>
  </div>` : ""}

  <div class="report-footer">
    <div class="footer-left">
      <img src="https://simboard.shiftflow.ca/brand/logo/ShiftFlow-Logo-Landscape-FullColour-DarkBackground-2500x930px-72dpi.png" alt="ShiftFlow" class="footer-logo" />
      <a href="https://shiftflow.ca" class="footer-url">shiftflow.ca</a>
    </div>
    <div class="footer-right">
      Generated by Vantage by ShiftFlow<br>
      <a href="https://simboard.shiftflow.ca">simboard.shiftflow.ca</a>
    </div>
  </div>

</div>
<script>
function switchTab(id) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.getElementById('btn-' + id).classList.add('active');
}
function toggle(id) {
  const body = document.getElementById(id);
  const chevron = document.getElementById(id + '-chevron');
  const preview = document.getElementById(id + '-preview');
  const btn = body.previousElementSibling;
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  chevron.classList.toggle('open', !isOpen);
  btn.setAttribute('aria-expanded', String(!isOpen));
  if (preview) preview.style.display = isOpen ? 'block' : 'none';
}
// Auto-expand first advisor in each round
document.querySelectorAll('.tab-panel').forEach(panel => {
  const first = panel.querySelector('.advisor-card');
  if (first) {
    const btn = first.querySelector('.advisor-toggle');
    if (btn) btn.click();
  }
});
</script>
</body>
</html>`;
}

function downloadReport(session: SessionData) {
  const html = buildReport(session);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `board-session-${session.date ?? "report"}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

type Tab = "round1" | "round2" | "tensions" | "synthesis";

const BOARD_LEFT_BORDER: Record<string, string> = {
  "Marketing": "border-blossom/60",
  "Strategy & Direction": "border-ocean/60",
  "Revenue & Business Model": "border-breeze/60",
  "Execution & Momentum": "border-new-leaf/60",
  "Systems Change": "border-ocean/50",
  "Personal": "border-blossom/50",
};

function extractVote(text: string): Vote | null {
  const m =
    text.match(/\*\*(?:your\s+)?vote[^*]*\*\*[:\s]*(YES|NO|CONDITIONAL)/i) ||
    text.match(/\bVOTE[:\s]+(YES|NO|CONDITIONAL)\b/i);
  return m ? (m[1].toUpperCase() as Vote) : null;
}

function getPreview(text: string): string {
  const stripped = text
    .replace(/#{1,6}\s+[^\n]*/g, "")
    .replace(/\*\*[^*]*\*\*/g, "")
    .replace(/\*[^*]*\*/g, "")
    .replace(/\n+/g, " ")
    .trim();
  return stripped.length > 160 ? stripped.slice(0, 160) + "…" : stripped;
}

function AdvisorCard({
  advisor,
  round,
  mode,
  expanded,
  onToggle,
}: {
  advisor: SessionAdvisor;
  round: "round1" | "round2";
  mode: "decision" | "advisory";
  expanded: boolean;
  onToggle: () => void;
}) {
  const content = round === "round1" ? advisor.round1 : advisor.round2;
  if (!content) return null;

  const vote = round === "round1" && mode === "decision" ? extractVote(content) : null;
  const borderColor = BOARD_LEFT_BORDER[advisor.boards[0]] ?? "border-white/20";
  const initials = advisor.name.split(" ").map((w) => w[0]).join("").slice(0, 2);

  return (
    <div className={`card border-l-2 ${borderColor} overflow-hidden`}>
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-center gap-3 text-left hover:bg-white/3 transition-colors cursor-pointer"
      >
        <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-white/8 flex items-center justify-center text-xs font-semibold text-white/50">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white/85 text-sm">{advisor.name}</span>
            <span className="text-white/35 text-xs">{advisor.focus}</span>
            {vote && <VoteBadge vote={vote} size="sm" />}
          </div>
          {!expanded && (
            <p className="text-white/35 text-xs mt-1 line-clamp-1">{getPreview(content)}</p>
          )}
        </div>
        <svg
          viewBox="0 0 12 12"
          className={`w-3 h-3 flex-shrink-0 text-white/30 transition-transform ml-2 ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M2 4l4 4 4-4" />
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-white/5 pt-4">
          <div className="prose-board text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DecisionClient({ session }: { session: SessionData }) {
  const [activeTab, setActiveTab] = useState<Tab>("round1");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCard = (key: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const hasTensions = !!session.tension;

  const TABS: { id: Tab; label: string; sublabel?: string; enabled: boolean }[] = [
    {
      id: "round1",
      label: "Round 1",
      sublabel: session.mode === "advisory" ? "Strategic Reads" : "Positions",
      enabled: true,
    },
    {
      id: "round2",
      label: "Round 2",
      sublabel: session.mode === "advisory" ? "Pushback" : "Rebuttals",
      enabled: session.advisors.some((a) => !!a.round2),
    },
    { id: "tensions", label: "Tensions", enabled: hasTensions },
    { id: "synthesis", label: "Synthesis", enabled: !!session.synthesis },
  ];

  // Adapt advisors for TensionMap (which expects Advisor type with boards array)
  const advisorsForMap = session.advisors.map((a) => ({
    slug: a.slug,
    name: a.name,
    focus: a.focus,
    boards: a.boards,
    content: "",
  }));

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="pt-4">
        <Link
          href="/decisions"
          className="text-xs text-white/35 hover:text-white/60 transition-colors mb-4 inline-block"
        >
          ← All Decisions
        </Link>
        <div className="flex items-start gap-3 flex-wrap mb-1">
          <span className={`text-xs px-2 py-0.5 rounded border font-medium ${
            session.mode === "advisory"
              ? "bg-ocean/10 text-ocean border-ocean/25"
              : "bg-new-leaf/10 text-new-leaf border-new-leaf/25"
          }`}>
            {session.mode === "advisory" ? "Advisory" : "Decision"}
          </span>
          {session.date && (
            <span className="text-white/35 text-xs mt-0.5">{session.date}</span>
          )}
        </div>
        <h1 className="text-2xl font-semibold text-white max-w-3xl leading-snug mt-2">
          {session.question}
        </h1>
        <p className="text-white/35 text-xs mt-2">
          {session.advisors.map((a) => a.name).join(" · ")}
        </p>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-white/10">
        <div className="flex overflow-x-auto no-scrollbar">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => tab.enabled && setActiveTab(tab.id)}
                disabled={!tab.enabled}
                className={`flex-shrink-0 px-4 py-3 text-sm border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-new-leaf text-white font-medium"
                    : tab.enabled
                    ? "border-transparent text-white/45 hover:text-white/70"
                    : "border-transparent text-white/20 cursor-not-allowed"
                }`}
              >
                {tab.label}
                {tab.sublabel && (
                  <span className={`text-xs ml-1.5 ${isActive ? "text-white/50" : "text-white/25"}`}>
                    {tab.sublabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="space-y-3">
        {activeTab === "round1" && (
          <>
            {session.advisors.map((advisor) => (
              <AdvisorCard
                key={`${advisor.slug}-r1`}
                advisor={advisor}
                round="round1"
                mode={session.mode}
                expanded={expandedCards.has(`${advisor.slug}-r1`)}
                onToggle={() => toggleCard(`${advisor.slug}-r1`)}
              />
            ))}
            {session.synthesis && (
              <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-white/6 bg-white/2 mt-2">
                <p className="text-xs text-white/30">
                  Reading order: Round 1 → Round 2 → Tensions → Synthesis
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("synthesis")}
                  className="text-xs text-new-leaf/70 hover:text-new-leaf transition-colors whitespace-nowrap flex-shrink-0"
                >
                  Skip to Synthesis →
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === "round2" &&
          session.advisors.map((advisor) => (
            <AdvisorCard
              key={`${advisor.slug}-r2`}
              advisor={advisor}
              round="round2"
              mode={session.mode}
              expanded={expandedCards.has(`${advisor.slug}-r2`)}
              onToggle={() => toggleCard(`${advisor.slug}-r2`)}
            />
          ))}

        {activeTab === "tensions" && session.tension && (
          <TensionMap
            data={session.tension}
            advisors={advisorsForMap}
            mode={session.mode}
          />
        )}

        {activeTab === "synthesis" && session.synthesis && (
          <div className="card border-new-leaf/20 bg-new-leaf/5 p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-new-leaf/20 flex items-center justify-center">
                <span className="text-new-leaf text-xs font-bold">C</span>
              </div>
              <span className="font-semibold text-white/85 text-sm">The Chair</span>
            </div>
            <div className="prose-board">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{session.synthesis}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-4 pt-2 flex-wrap">
        <Link href="/decisions" className="btn-secondary">
          ← Archive
        </Link>
        <Link href="/boardroom" className="btn-primary">
          New Session →
        </Link>
        <button
          type="button"
          onClick={() => downloadReport(session)}
          className="ml-auto text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors"
        >
          Download Report
        </button>
      </div>
    </div>
  );
}
