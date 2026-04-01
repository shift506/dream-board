import fs from "fs";
import path from "path";

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

export async function getBusinessContext(userId: string): Promise<string> {
  if (blobAvailable()) {
    try {
      const { list } = await import("@vercel/blob");
      const { blobs } = await list({ prefix: `users/${userId}/context.md` });
      if (blobs.length > 0) {
        return fetchBlob(blobs[0].url);
      }
    } catch {}
  }
  const contextPath = path.join(process.cwd(), "context.md");
  if (!fs.existsSync(contextPath)) return "";
  return fs.readFileSync(contextPath, "utf-8");
}

export async function setBusinessContext(content: string, userId: string): Promise<void> {
  if (blobAvailable()) {
    const { put } = await import("@vercel/blob");
    await put(`users/${userId}/context.md`, content, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "text/plain",
    });
    return;
  }
  fs.writeFileSync(path.join(process.cwd(), "context.md"), content, "utf-8");
}
