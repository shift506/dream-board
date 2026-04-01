# Boardroom Slash Command Spec

## Goal
Create a Claude Code slash command at `~/.claude/commands/boardroom.md` that simulates a Personal Board of Advisors around a strategic decision.

## Command Invocation

```md
/boardroom [my question]
```

## Setup Behavior
Before the command runs fully, it should:

1. Ask how many advisors should be included.
2. Ask for the initial list of real people whose strategic thinking the user admires.
3. Ask for the path to a markdown business context file.
4. Ask follow-up questions to improve board composition:
   - What kind of business is this?
   - What stage is the business at?
   - What are the main decision types?
   - Where does the user tend to over-index or under-index?
   - Do they need domain experts, adjacent thinkers, skeptics, operators, financiers, or contrarians?
   - Are they optimizing for profit, resilience, joy, prestige, impact, or optionality?

## Advisor File Requirements
For each advisor, the system should maintain a dossier that includes:

- Name
- 2–3 sentence personality profile
- How they think
- What they prioritize
- What biases they bring
- Domains they are strong in
- What kinds of decisions they are best for
- What they reliably miss or undervalue

## Round 1
Run one agent per advisor in parallel.

Each advisor must:
- Read the business context markdown file.
- Read the user’s question.
- Write a position memo.
- Aim for 800–1200 words, or whatever length is required to communicate 95% of the argument.
- Include:
  - A YES / NO / CONDITIONAL vote
  - Specific reasoning
  - Numbers and assumptions
  - Projections on cost, revenue, impact, and team joy
  - A recommendation on what to do next

## Round 2
After Round 1:

- Collect all initial advisor memos.
- Give each advisor access to every other advisor’s memo.
- Ask each advisor to write a 400–800 word rebuttal including:
  - Who they disagree with most and why
  - Whether any argument changed their mind
  - Their final vote

## Synthesis
Produce a final synthesis that includes:
- Final votes
- Which advisors changed their mind
- Biggest disagreements
- Sharpest insight
- Key assumptions
- Most likely decision
- Risks if the group is wrong

## Required Deliverables
For each decision, create a folder named after the decision containing:

- Markdown vote tracker
- Markdown synthesis document
- HTML interactive decision view
- PDF print version

## Suggested UX Principles
- Make disagreement legible.
- Show vote changes visually.
- Keep assumptions transparent.
- Treat advisors as distinct thinkers, not generic personas.
- Encourage real tension rather than shallow consensus.