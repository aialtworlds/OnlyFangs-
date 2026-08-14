import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Image as ImageIcon, Link2, Loader2, Send, X, Music, Video, FileText } from "lucide-react";

interface ContentUploadFormProps {
  onSuccess?: () => void;
}

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50MB, matches uploadHandler.ts

function detectTypeFromMime(mime: string): "image" | "music" | "video" | "post" {
  if (mime.startsWith("image/")) return "image"; // covers GIFs too (image/gif)
  if (mime.startsWith("audio/")) return "music";
  if (mime.startsWith("video/")) return "video";
  return "post";
}

export function ContentUploadForm({ onSuccess }: ContentUploadFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [locked, setLocked] = useState(true);
  const [collectionId, setCollectionId] = useState("");
  const [price, setPrice] = useState("");

  const { data: collections = [] } = trpc.creator.myCollections.useQuery();

  const uploadMutation = trpc.content.upload.useMutation({
    onSuccess: () => {
      toast.success("Posted!");
      setText("");
      setSelectedFile(null);
      setFilePreviewUrl(null);
      setShowLinkInput(false);
      setLinkUrl("");
      setLocked(true);
      setCollectionId("");
      setPrice("");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Error posting");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_BYTES) {
      toast.error("File too large. Maximum: 50MB");
      return;
    }

    setSelectedFile(file);
    setShowLinkInput(false);
    setLinkUrl("");

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreviewUrl(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreviewUrl(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreviewUrl(null);
  };

  const canSubmit = Boolean(selectedFile || linkUrl.trim() || text.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      toast.error("Add some text, a link, or attach a file before posting.");
      return;
    }

    if (linkUrl.trim()) {
      try {
        new URL(linkUrl.trim());
      } catch {
        toast.error("That link doesn't look like a valid URL.");
        return;
      }
    }

    setIsLoading(true);

    try {
      let fileUrl: string | undefined;
      let fileKey: string | undefined;

      if (selectedFile) {
        // Convert file to base64 (uploadHandler.ts expects { file, fileName, contentType } as JSON)
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Strip the "data:<mime>;base64," prefix, server wants raw base64
            resolve(result.split(",")[1] ?? "");
          };
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(selectedFile);
        });

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file: base64,
            fileName: selectedFile.name,
            contentType: selectedFile.type,
          }),
        });

        if (!uploadResponse.ok) {
          const errorBody = await uploadResponse.json().catch(() => null);
          throw new Error(errorBody?.error || `Upload failed (${uploadResponse.status})`);
        }

        const result = await uploadResponse.json();
        fileUrl = result.url;
        fileKey = result.key;
      }

      await uploadMutation.mutateAsync({
        locked,
        collectionId: collectionId && collectionId !== "none_selected" ? parseInt(collectionId) : undefined,
        description: text.trim() || undefined,
        type: selectedFile ? detectTypeFromMime(selectedFile.type) : "text",
        fileUrl,
        fileKey,
        mimeType: selectedFile?.type,
        fileSize: selectedFile?.size,
        linkUrl: linkUrl.trim() || undefined,
        price: price ? parseFloat(price) : undefined,
      });
    } catch (error) {
      console.error("Post error:", error);
      toast.error(error instanceof Error ? error.message : "Error posting");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Body text */}
      <Textarea
        placeholder="What would you like to share with your patrons?"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isLoading}
        maxLength={1000}
        rows={4}
        className="resize-none"
      />

      {/* Attached file preview */}
      {selectedFile && (
        <div className="relative border border-border rounded-lg p-3 flex items-center gap-3">
          {filePreviewUrl ? (
            <img src={filePreviewUrl} alt="" className="w-16 h-16 rounded object-cover flex-shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded bg-muted flex items-center justify-center flex-shrink-0">
              {selectedFile.type.startsWith("audio/") ? (
                <Music className="w-6 h-6 text-muted-foreground" />
              ) : selectedFile.type.startsWith("video/") ? (
                <Video className="w-6 h-6 text-muted-foreground" />
              ) : (
                <FileText className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
          )}
          <p className="text-sm text-muted-foreground truncate flex-1">{selectedFile.name}</p>
          <button
            type="button"
            onClick={removeFile}
            disabled={isLoading}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Link input */}
      {showLinkInput && !selectedFile && (
        <div className="flex items-center gap-2">
          <Input
            type="url"
            placeholder="Paste a link..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => { setShowLinkInput(false); setLinkUrl(""); }}
            disabled={isLoading}
            className="text-muted-foreground hover:text-destructive flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Attach row */}
      <div className="flex items-center gap-1">
        <input
          type="file"
          onChange={handleFileChange}
          accept="image/*,audio/*,video/*,.pdf"
          className="hidden"
          id="composer-file-input"
          disabled={isLoading || showLinkInput}
        />
        <label htmlFor="composer-file-input">
          <Button type="button" variant="ghost" size="sm" disabled={isLoading || showLinkInput} asChild>
            <span className="cursor-pointer">
              <ImageIcon className="w-4 h-4 mr-2" />
              Photo/Video/GIF
            </span>
          </Button>
        </label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isLoading || !!selectedFile}
          onClick={() => setShowLinkInput((v) => !v)}
        >
          <Link2 className="w-4 h-4 mr-2" />
          Link
        </Button>
      </div>

      {/* Access + price + collection */}
      <div className="grid grid-cols-2 gap-3">
        <Select value={locked ? "locked" : "public"} onValueChange={(value) => setLocked(value === "locked")}>
          <SelectTrigger disabled={isLoading}>
            <SelectValue placeholder="Access level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="locked">Subscribers only</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="number"
          step="0.01"
          placeholder="Unlock price (optional)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          disabled={isLoading}
        />
      </div>

      {collections.length > 0 && (
        <Select value={collectionId} onValueChange={setCollectionId}>
          <SelectTrigger disabled={isLoading}>
            <SelectValue placeholder="No collection (single post)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none_selected">No collection (single post)</SelectItem>
            {collections.map((coll: any) => (
              <SelectItem key={coll.id} value={coll.id.toString()}>
                {coll.title} ({coll.type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Button type="submit" disabled={isLoading || !canSubmit} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Posting...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Post
          </>
        )}
      </Button>
    </form>
  );
}
