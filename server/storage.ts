// Local storage helpers for OnlyFangs
// Uploads files directly to a local directory "uploads" inside the project.
// Downloads return /uploads/{key} paths served via express.static.

import { promises as fsp } from "node:fs";
import path from "node:path";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  await fsp.mkdir(UPLOADS_DIR, { recursive: true });

  const key = appendHashSuffix(normalizeKey(relKey));
  const filePath = path.join(UPLOADS_DIR, key);

  // Ensure parent directory inside uploads exists
  await fsp.mkdir(path.dirname(filePath), { recursive: true });

  // Async write — writeFileSync blocks Node's single event loop for the
  // full duration of the write, freezing every other in-flight request on
  // the server (a real, measured contributor to unrelated requests timing
  // out/erroring while a large file was uploading).
  if (typeof data === "string") {
    await fsp.writeFile(filePath, data, "utf8");
  } else {
    await fsp.writeFile(filePath, Buffer.from(data));
  }

  return { key, url: `/uploads/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/uploads/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = normalizeKey(relKey);
  return `/uploads/${key}`;
}
