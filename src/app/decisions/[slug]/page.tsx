export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { readDecision, readSessionData } from "@/lib/decisions";
import DecisionClient from "./DecisionClient";

export default async function DecisionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const userId = cookieStore.get("boardroom-id")?.value ?? "anonymous";

  const session = await readSessionData(slug, userId);
  if (session) {
    return <DecisionClient session={session} />;
  }

  const decision = readDecision(slug);
  if (!decision) notFound();

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      <div className="pt-4">
        <Link
          href="/decisions"
          className="text-xs text-white/35 hover:text-white/60 transition-colors mb-4 inline-block"
        >
          ← All Decisions
        </Link>
        {decision.date && (
          <p className="text-white/35 text-xs mb-2">{decision.date}</p>
        )}
        <h1 className="text-2xl font-semibold text-white max-w-3xl leading-snug">
          {decision.question || decision.title}
        </h1>
      </div>

      {decision.files.map((file) => (
        <div key={file.name} className="space-y-2">
          {decision.files.length > 1 && (
            <p className="text-xs text-white/30 font-mono">{file.name}</p>
          )}
          <div className="card p-6 sm:p-8">
            <div className="prose-board">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {file.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      ))}

      <div className="flex items-center gap-4 pt-2">
        <Link href="/decisions" className="btn-secondary">← Archive</Link>
        <Link href="/boardroom" className="btn-primary">New Session →</Link>
      </div>
    </div>
  );
}
