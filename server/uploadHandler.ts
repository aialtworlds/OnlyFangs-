import { Router, Request, Response } from "express";
import { storagePut } from "./storage";
import { getDb } from "./db";
import { eq, and } from "drizzle-orm";

export function registerUploadRoutes(app: Router) {
  app.post("/api/upload", async (req: Request, res: Response) => {
    try {
      // Get user ID from session cookie
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get file data from request
      const { file, fileName, contentType, tierId, title, description } = req.body;

      // Validate required fields
      if (!file || !fileName || !contentType) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Validate file size (max 50MB)
      const buffer = Buffer.from(file, "base64");
      if (buffer.length > 50 * 1024 * 1024) {
        return res.status(413).json({ error: "File too large (max 50MB)" });
      }

      // Validate tier exists and belongs to user
      if (tierId) {
        const db = await getDb();
        if (!db) {
          return res.status(500).json({ error: "Database connection failed" });
        }

        const { tiers: tiersTable } = await import("../drizzle/schema");
        const tier = await db.select().from(tiersTable).where(
          and(eq(tiersTable.id, tierId), eq(tiersTable.creatorId, userId))
        ).limit(1);
        
        if (!tier || tier.length === 0) {
          return res.status(403).json({ error: "Invalid tier" });
        }


      }

      // Upload to S3
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
  });
}
