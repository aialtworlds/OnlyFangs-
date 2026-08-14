import { Router, Request, Response, raw } from "express";
import { storagePut } from "./storage";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { sdk } from "./_core/sdk";

export function registerUploadRoutes(app: Router) {
  app.post(
    "/api/upload",
    // Raw binary body, not JSON — base64-encoding a file client-side before
    // sending it as JSON inflates the payload ~33% and adds real encode/decode
    // time for anything music/video-sized. `type: () => true` accepts any
    // Content-Type (the browser sends the file's own real MIME type here).
    raw({ type: () => true, limit: "55mb" }),
    async (req: Request, res: Response) => {
      try {
        // Authenticate via the session cookie — this is a plain Express route,
        // not a tRPC procedure, so it doesn't get `ctx.user` for free the way
        // tRPC procedures do.
        let userId: number;
        try {
          const user = await sdk.authenticateRequest(req);
          userId = user.id;
        } catch {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const fileName = typeof req.query.fileName === "string" ? req.query.fileName : "";
        const contentType = req.headers["content-type"] || "application/octet-stream";
        const buffer = req.body as Buffer;

        if (!fileName || !buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        // Validate file size (max 50MB)
        if (buffer.length > 50 * 1024 * 1024) {
          return res.status(413).json({ error: "File too large (max 50MB)" });
        }

        // Only creators may upload content
        const db = await getDb();
        if (!db) {
          return res.status(500).json({ error: "Database connection failed" });
        }

        const { creators: creatorsTable } = await import("../drizzle/schema");
        const creator = await db.select().from(creatorsTable).where(
          eq(creatorsTable.userId, userId)
        ).limit(1);

        if (!creator || creator.length === 0) {
          return res.status(403).json({ error: "Creator profile not found" });
        }

        // Upload to storage
        const fileKey = `content/${userId}/${Date.now()}-${fileName}`;
        const { url, key } = await storagePut(fileKey, buffer, contentType);

        // Determine content type
        let contentTypeEnum: "image" | "music" | "video" | "book" | "post" = "post";
        if (contentType.startsWith("image/")) {
          contentTypeEnum = "image";
        } else if (contentType.startsWith("audio/")) {
          contentTypeEnum = "music";
        } else if (contentType.startsWith("video/")) {
          contentTypeEnum = "video";
        }

        // Return upload result
        res.json({
          success: true,
          url,
          key,
          fileName,
          contentType: contentTypeEnum,
          fileSize: buffer.length,
        });
      } catch (error) {
        console.error("[Upload] Error:", error);
        const message = error instanceof Error ? error.message : "Upload failed";
        res.status(500).json({ error: message });
      }
    }
  );
}
