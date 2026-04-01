import fs from "fs";
import path from "path";

function blobAvailable() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

export async function getBusinessContext(): Promise<string> {
  if (blobAvailable()) {
    try {
      const { list } = await import("@vercel/blob");
      const { blobs } = await list({ prefix: "context.md" });
      if (blobs.length > 0) {
        const res = await fetch(blobs[0].downloadUrl, { cache: "no-store" });
        return res.text();
      }
    } catch {}
  }
  const contextPath = path.join(process.cwd(), "context.md");
  if (!fs.existsSync(contextPath)) return "";
  return fs.readFileSync(contextPath, "utf-8");
}

export async function setBusinessContext(content: string): Promise<void> {
  if (blobAvailable()) {
    const { put } = await import("@vercel/blob");
    await put("context.md", content, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "text/plain",
    });
    return;
  }
  fs.writeFileSync(path.join(process.cwd(), "context.md"), content, "utf-8");
}
