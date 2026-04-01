# Your Dream Board — Project Context

A Next.js web app that lets users simulate AI-powered advisory sessions. Users set context, select up to 3 advisors, pose a question, and receive a structured board session with individual rounds, synthesis, and a tension map.

Live at: Vercel (repo: shift506/dream-board)

## Chair Persona

When running `/boardroom` sessions: you are the Chair. Convene, moderate, synthesize. Surface tension, protect minority views, deliver honest synthesis. Do not advocate — facilitate.

---

## Architecture

**Pattern:** `page.tsx` (async server component, `force-dynamic`) → `[Name]Client.tsx` (client component)

All pages use `export const dynamic = "force-dynamic"` — never remove this. The app reads from Vercel Blob on every request.

### Pages
| Route | Server | Client |
|---|---|---|
| `/` | `src/app/page.tsx` | — |
| `/boardroom` | `src/app/boardroom/page.tsx` | `BoardroomClient.tsx` |
| `/context` | `src/app/context/page.tsx` | `ContextEditor.tsx` |
| `/advisors` | `src/app/advisors/page.tsx` | `AdvisorsClient.tsx` |
| `/decisions` | `src/app/decisions/page.tsx` | — |
| `/decisions/[slug]` | `src/app/decisions/[slug]/page.tsx` | `DecisionClient.tsx` |

### API Routes
| Route | Purpose |
|---|---|
| `src/app/api/context/route.ts` | GET/PUT context.md |
| `src/app/api/session/route.ts` | POST — runs a board session (streaming SSE) |
| `src/app/api/advisors/route.ts` | POST — creates a custom advisor |

### Data / Persistence (`src/lib/`)
| File | Exports | Notes |
|---|---|---|
| `context.ts` | `getBusinessContext()`, `setBusinessContext()` | Reads/writes `context.md` in Blob |
| `decisions.ts` | `getAllDecisions()`, `readSessionData()`, `writeSession()` | Reads/writes `sessions/*.json` and `sessions/*.md` in Blob |
| `advisors.ts` | `getAllAdvisors()`, `getAdvisor()`, `getAdvisorsByBoard()` | Reads from `advisors/` directory (git) + Blob for custom advisors. All async. |

### Components (`src/components/`)
- `Navigation.tsx` — top nav (desktop), ShiftFlow logo
- `BottomNav.tsx` — mobile-only fixed bottom nav (`sm:hidden`)
- `AdvisorCard.tsx` — card with `disabled` prop for limit enforcement
- `TensionMap.tsx` — vote summary + fault lines visualization
- `VoteBadge.tsx` — vote display

---

## Vercel Blob Rules

All blob operations follow this pattern — don't deviate:

**Writing:**
```ts
await put("path/file.ext", content, {
  access: "private",
  addRandomSuffix: false,
  allowOverwrite: true,   // true for context/sessions; false for new advisors
  contentType: "text/plain",
});
```

**Reading:**
```ts
const { blobs } = await list({ prefix: "path/file.ext" });
const res = await fetch(blobs[0].url, {
  headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
  cache: "no-store",
});
```

`downloadUrl` is unreliable for private blobs. Always use `blob.url` + Bearer token.

---

## Design System

**Colors:** `galaxy` (bg), `new-leaf` (primary/accent), `breeze` (success), `ocean`, `blossom` (error/warning)  
**Fonts:** Poppins (body), Glacial Indifference (`font-sub`, used for labels/eyebrows)  
**Cards:** `className="card p-6"` — defined in globals.css  
**Buttons:** `btn-primary`, `btn-secondary`  
**No-scrollbar:** `.no-scrollbar` utility class for horizontal scroll containers  
**Mobile:** Bottom nav handles mobile navigation. Main content has `pb-20 sm:pb-0`.

---

## Advisor Data

**Static advisors** live in `advisors/*.md` (committed to git — always readable).  
**Custom advisors** created via UI are stored in Vercel Blob under `advisors/{slug}.md`.

`BOARD_ROSTER` in `src/lib/advisors.ts` maps slug → `{ focus, boards }` for known advisors. New advisors added to `advisors/` must also be added to `BOARD_ROSTER`.

Current boards: Marketing, Strategy & Direction, Revenue & Business Model, Execution & Momentum, Systems Change, Personal

**Advisor limit:** 3 (enforced in `BoardroomClient.tsx`, `ADVISOR_LIMIT` constant)

---

## Key Constraints
- Vercel filesystem is read-only at runtime — all writes go to Blob
- Sessions stored as `sessions/{slug}.json` + `sessions/{slug}.md`
- Context stored as `context.md`
- `context.md` markdown format: `**Key:** value` for inline fields, `## Section Heading` for sections
