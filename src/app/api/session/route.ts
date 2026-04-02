import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAdvisor } from "@/lib/advisors";
import { getBusinessContext } from "@/lib/context";
import { writeSession } from "@/lib/decisions";

export const runtime = "nodejs";
export const maxDuration = 300;

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { question, advisorSlugs, mode = "decision", documents = [], contextMode = "business" } = (await req.json()) as {
    question: string;
    advisorSlugs: string[];
    mode?: "decision" | "advisory";
    documents?: { name: string; content: string }[];
    contextMode?: string;
  };

  if (!question || !advisorSlugs?.length) {
    return new Response("Missing question or advisors", { status: 400 });
  }

  const userId = req.cookies.get("boardroom-id")?.value ?? "anonymous";
  const context = await getBusinessContext(userId, contextMode);

  const supportingMaterials =
    documents.length > 0
      ? `\n\n---\n\n## Supporting Documents\nThe following documents have been provided for your review. Engage with them directly — reference, quote, or cite specific content where it bears on your analysis.\n\n${documents
          .map((d) => `### ${d.name}\n\n${d.content}`)
          .join("\n\n---\n\n")}`
      : "";
  const advisors = (await Promise.all(advisorSlugs.map((s) => getAdvisor(s, userId)))).filter(
    (a): a is NonNullable<typeof a> => a !== null
  );

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {

      // Collect all memos for Round 2
      const round1Memos: Record<string, string> = {};
      const round2Memos: Record<string, string> = {};

      // ── ROUND 1: Position Memos ──────────────────────────────────────────
      send({ type: "phase", phase: "round1", label: "Round 1 — Position Memos" });

      for (const advisor of advisors) {
        send({ type: "advisor_start", phase: "round1", advisor: advisor.slug, name: advisor.name });

        const prompt = `${advisor.content}

---

## Business Context
${context}${supportingMaterials}

---

## ${mode === "advisory" ? "Topic Before the Board" : "Question Before the Board"}
${question}

---

## Your Task
${mode === "advisory"
  ? `Write your Round 1 strategic read (800–1200 words). Structure it as:
1. **Opening Read:** Your instinctive take on what this topic is really about and what frame you'd apply.
2. **Opportunities You See:** What this topic opens up, if approached well.
3. **Risks and Traps:** What could go wrong, what gets missed, what looks attractive but isn't.
4. **What You'd Explore:** Specific things you'd want to know, test, or investigate before forming a stronger view.
5. **Your Question for Nick:** One sharp question that gets at what you think Nick most needs to confront on this topic.

No votes. No recommendations. This round is for laying out the terrain.`
  : `Write your Round 1 position memo (800–1200 words). Structure it as:
1. **Your Vote:** YES / NO / CONDITIONAL (with conditions)
2. **Your Reasoning:** The core of your argument. Be specific. Use numbers where possible.
3. **What Others Will Miss:** The blind spot you predict in this room.
4. **Recommended Next Step:** One concrete action.

Speak in your authentic voice. Do not summarize what others might say — that comes in Round 2.`}

Speak in your authentic voice.`;

        let memoText = "";

        const aiStream = client.messages.stream({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1500,
          messages: [{ role: "user", content: prompt }],
        });

        for await (const chunk of aiStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            memoText += chunk.delta.text;
            send({
              type: "token",
              phase: "round1",
              advisor: advisor.slug,
              text: chunk.delta.text,
            });
          }
        }

        round1Memos[advisor.slug] = memoText;
        send({ type: "advisor_done", phase: "round1", advisor: advisor.slug });
      }

      // ── ROUND 2: Rebuttals ───────────────────────────────────────────────
      send({ type: "phase", phase: "round2", label: "Round 2 — Rebuttals" });

      const round1Summary = advisors
        .map((a) => `### ${a.name}\n${round1Memos[a.slug] ?? ""}`)
        .join("\n\n---\n\n");

      for (const advisor of advisors) {
        send({ type: "advisor_start", phase: "round2", advisor: advisor.slug, name: advisor.name });

        const prompt = `${advisor.content}

---

## Business Context
${context}${supportingMaterials}

---

## ${mode === "advisory" ? "Topic Before the Board" : "Question Before the Board"}
${question}

---

## Round 1 ${mode === "advisory" ? "Strategic Reads" : "Memos"} From All Advisors
${round1Summary}

---

## Your Task
${mode === "advisory"
  ? `Write your Round 2 response (400–800 words). Structure it as:
1. **Who You Most Disagree With:** Name them, quote or reference their argument, and explain why it's wrong or incomplete.
2. **Who You Most Agree With:** And what you'd add or sharpen.
3. **What the Board Is Missing:** The blind spot none of them named in Round 1.
4. **Your Sharpest Question for Nick:** Refined after reading the room — this replaces your Round 1 question if your thinking shifted.

Be direct. Name the other advisors.`
  : `Write your Round 2 rebuttal (400–800 words). Structure it as:
1. **Vote Unchanged / Changed:** State if your position changed and why.
2. **Where You Agree:** Any surprising alignment you found.
3. **Where You Push Back:** Your sharpest disagreement and why.
4. **What the Board Is Still Missing:** The thing nobody said that needs to be said.

Be direct. Name the other advisors when you push back.`}`;

        let rebuttalText = "";

        const aiStream = client.messages.stream({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        });

        for await (const chunk of aiStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            rebuttalText += chunk.delta.text;
            send({
              type: "token",
              phase: "round2",
              advisor: advisor.slug,
              text: chunk.delta.text,
            });
          }
        }

        round2Memos[advisor.slug] = rebuttalText;
        send({ type: "advisor_done", phase: "round2", advisor: advisor.slug });
      }

      // ── TENSION DATA ─────────────────────────────────────────────────────
      const round2Summary = advisors
        .map((a) => `### ${a.name} — Rebuttal\n${round2Memos[a.slug] ?? ""}`)
        .join("\n\n---\n\n");

      let tensionJson: import("@/components/TensionMap").TensionData | null = null;
      try {
        const tensionPrompt = `Analyze this board session and return ONLY a JSON object. No markdown fences, no explanation — raw JSON only.

Advisors (use these slugs exactly): ${advisors.map((a) => `${a.slug} = ${a.name}`).join(", ")}

Round 1:
${round1Summary}

Round 2:
${round2Summary}

Return this exact structure:
{
  "vote_summary": ${mode === "decision" ? '{"YES": ["slug1"], "NO": [], "CONDITIONAL": ["slug2"]}' : "null"},
  "fault_lines": [
    {
      "topic": "3-5 word topic name",
      "description": "One sentence describing the core disagreement",
      "side_a": { "label": "Their position (3-5 words)", "advisors": ["slug1"] },
      "side_b": { "label": "Their position (3-5 words)", "advisors": ["slug2"] }
    }
  ],
  "agreements": ["One thing they genuinely agree on", "Another"]
}

Rules:
- Identify 2-4 genuine fault lines (real disagreements, not surface differences)
- List 2-4 things the board genuinely agrees on
- Only use the advisor slugs listed above${mode === "decision" ? "\n- For vote_summary, group slugs by their YES/NO/CONDITIONAL vote from Round 1" : "\n- Set vote_summary to null (advisory session)"}`;

        const tensionRes = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 700,
          messages: [{ role: "user", content: tensionPrompt }],
        });

        const raw = tensionRes.content[0].type === "text" ? tensionRes.content[0].text : "{}";
        const cleaned = raw.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
        tensionJson = JSON.parse(cleaned);
        send({ type: "tension_data", data: tensionJson });
      } catch {
        // Non-critical — skip if parsing fails
      }

      // ── SYNTHESIS ────────────────────────────────────────────────────────
      send({ type: "phase", phase: "synthesis", label: "Chair's Synthesis" });

      const synthesisPrompt = `You are the Chair of a personal board of advisors. You do not advocate — you synthesize.

## ${mode === "advisory" ? "Topic" : "Question"}
${question}

## Business Context
${context}${supportingMaterials}

## Round 1 ${mode === "advisory" ? "Strategic Reads" : "Memos"}
${round1Summary}

## Round 2 ${mode === "advisory" ? "Tensions & Pushback" : "Rebuttals"}
${round2Summary}

## Your Task
${mode === "advisory"
  ? `Write the Chair's Synthesis (600–900 words):
1. **Strategic Landscape** — 2–3 paragraphs on the terrain the board mapped: core tensions, key variables, things that look like one problem but are actually another.
2. **Where the Board Agrees** — Shared observations or instincts that cut across advisors.
3. **Where the Board Diverges** — The genuine fault lines. Name names.
4. **The Blind Spot** — What the board collectively underweighted or missed.
5. **Questions Nick Should Answer Before Deciding** — A numbered list of 5–8 sharp questions that, if answered, would move Nick toward a better decision.

Write this as a neutral facilitator. Surface the tension; don't flatten it.`
  : `Write the Chair's Synthesis (600–900 words):
1. **Vote Tracker** — Table showing each advisor's Round 1 vote, Final vote, and whether they changed.
2. **Where the Board Agrees** — Genuine consensus, not surface agreement.
3. **Key Tensions** — The 2–3 fault lines that didn't resolve. Be specific about who disagreed and why.
4. **Sharpest Insight** — The single observation that reframes the question.
5. **Recommended Decision Framework** — Not a decision, but the structure for making one. What conditions need to be true for each path?

Write this as a neutral facilitator. Surface the tension; don't flatten it.`}`;

      let synthesisText = "";

      const aiStream = client.messages.stream({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1200,
        messages: [{ role: "user", content: synthesisPrompt }],
      });

      for await (const chunk of aiStream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          synthesisText += chunk.delta.text;
          send({ type: "token", phase: "synthesis", advisor: "chair", text: chunk.delta.text });
        }
      }

      send({ type: "phase", phase: "saving", label: "Saving session..." });

      // ── SAVE TO DISK ─────────────────────────────────────────────────────
      const slug = question
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 60);

      const now = new Date().toISOString().split("T")[0];

      const sessionMd = [
        `# Board Session: ${question}`,
        `**Date:** ${now}`,
        `**Board:** ${advisors.map((a) => a.name).join(", ")}`,
        `**Question:** ${question}`,
        "",
        "---",
        "",
        "## Round 1 — Position Memos",
        "",
        ...advisors.map(
          (a) => `### ${a.name}\n\n${round1Memos[a.slug] ?? ""}\n`
        ),
        "---",
        "",
        "## Round 2 — Rebuttals",
        "",
        ...advisors.map(
          (a) => `### ${a.name}\n\n${round2Memos[a.slug] ?? ""}\n`
        ),
        "---",
        "",
        "## Chair's Synthesis",
        "",
        synthesisText,
      ].join("\n");

      const sessionData = {
        question,
        date: now,
        mode,
        advisors: advisors.map((a) => ({
          slug: a.slug,
          name: a.name,
          focus: a.focus,
          boards: a.boards,
          round1: round1Memos[a.slug] ?? "",
          round2: round2Memos[a.slug] ?? "",
        })),
        synthesis: synthesisText,
        tension: tensionJson,
      };
      await writeSession(slug, sessionData, sessionMd, userId);

      send({ type: "done", slug, synthesisText });
      controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        send({ type: "error", message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
