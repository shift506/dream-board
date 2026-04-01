import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ADVISORS_DIR = path.join(process.cwd(), "advisors");

function blobAvailable() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

export async function POST(req: NextRequest) {
  const { name, focus, boards, whoYouAre, howYouThink, biases, voice, challenges } =
    (await req.json()) as {
      name: string;
      focus: string;
      boards: string[];
      whoYouAre: string;
      howYouThink: string;
      biases: string;
      voice: string;
      challenges: string;
    };

  if (!name?.trim() || !focus?.trim() || !boards?.length) {
    return NextResponse.json({ error: "Name, focus, and at least one board are required." }, { status: 400 });
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  const toList = (text: string) =>
    text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => (l.startsWith("-") ? l : `- ${l}`))
      .join("\n");

  const markdown = `# ${name} – ${focus}

## Boards
${boards.map((b) => `- ${b}`).join("\n")}

## Who You Are

${whoYouAre.trim()}

## How You Think
${toList(howYouThink)}

## Your Biases (Lean Into These)
${toList(biases)}

## Your Voice
${toList(voice)}

## What You Challenge
${toList(challenges)}
`;

  if (blobAvailable()) {
    const { list, put } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: `advisors/${slug}.md` });
    if (blobs.length > 0) {
      return NextResponse.json({ error: "An advisor with this name already exists." }, { status: 409 });
    }
    await put(`advisors/${slug}.md`, markdown, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: "text/plain",
    });
  } else {
    const filePath = path.join(ADVISORS_DIR, `${slug}.md`);
    if (fs.existsSync(filePath)) {
      return NextResponse.json({ error: "An advisor with this name already exists." }, { status: 409 });
    }
    fs.writeFileSync(filePath, markdown, "utf-8");
  }

  return NextResponse.json({ slug, name });
}
