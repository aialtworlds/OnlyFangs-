// ═══════════════════════════════════════════════════════════
// ONLY FANGS — Collection Form Component
// Victorian Occult Luxury · Dark Creator Platform
// ═══════════════════════════════════════════════════════════

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Loader2, Bookmark } from "lucide-react";

interface CollectionFormProps {
  onSuccess?: () => void;
}

export function CollectionForm({ onSuccess }: CollectionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    type: "album" | "gallery" | "playlist" | "anthology";
  }>({
    title: "",
    description: "",
    type: "album",
  });

  const utils = trpc.useUtils();

  // Create Collection mutation
  const createCollectionMutation = trpc.creator.createCollection.useMutation({
    onSuccess: () => {
      toast.success("Collection summoned successfully!");
      setFormData({ title: "", description: "", type: "album" });
      setSelectedFile(null);
      setFilePreview(null);
      utils.creator.myCollections.invalidate();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Error summoning collection: ${error.message}`);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Cover image too large. Max: 10MB");
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsLoading(true);

    try {
      let coverUrl = undefined;

      // Upload cover image if selected
      if (selectedFile) {
        const formDataForUpload = new FormData();
        formDataForUpload.append("file", selectedFile);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formDataForUpload,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload cover image");
        }

        const { url } = await uploadResponse.json();
        coverUrl = url;
      }

      // Create collection record via tRPC
      await createCollectionMutation.mutateAsync({
        title: formData.title,
        description: formData.description || undefined,
        type: formData.type,
        coverUrl,
      });

    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto border-zinc-800 bg-zinc-950/60 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold tracking-wide text-zinc-100 font-serif">
          <Bookmark className="w-5 h-5 text-amber-500" />
          Create a New Collection
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Group your releases into albums, galleries, video playlists, or book series.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Image Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-200">Cover Image</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-40 border border-dashed rounded-lg cursor-pointer border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60 transition duration-200">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isLoading}
                />
                {filePreview ? (
                  <div className="relative w-full h-full p-2 flex items-center justify-center">
                    <img
                      src={filePreview}
                      alt="Cover Preview"
                      className="max-h-full max-w-full object-contain rounded-md"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-zinc-500" />
                    <p className="mb-2 text-sm text-zinc-400">
                      <span className="font-semibold text-amber-500">Click to upload</span> cover art
                    </p>
                    <p className="text-xs text-zinc-500">PNG, JPG, or WEBP (Max 10MB)</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-zinc-200">
              Title *
            </label>
            <Input
              id="title"
              placeholder="Ex: Chronicles of the Crimson Moon"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              disabled={isLoading}
              maxLength={255}
              className="bg-zinc-900/60 border-zinc-800 text-zinc-200 focus:border-amber-500/50"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-zinc-200">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="Brief introduction or tracklist details (optional)"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              disabled={isLoading}
              maxLength={1000}
              rows={3}
              className="bg-zinc-900/60 border-zinc-800 text-zinc-200 focus:border-amber-500/50"
            />
          </div>

          {/* Collection Type */}
          <div className="space-y-2">
            <label htmlFor="type" className="text-sm font-medium text-zinc-200">
              Collection Type
            </label>
            <Select
              value={formData.type}
              onValueChange={(value: any) => setFormData((prev) => ({ ...prev, type: value }))}
            >
              <SelectTrigger id="type" disabled={isLoading} className="bg-zinc-900/60 border-zinc-800 text-zinc-200">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-200">
                <SelectItem value="album">Music Album / EP</SelectItem>
                <SelectItem value="gallery">Photo Album / Art Gallery</SelectItem>
                <SelectItem value="playlist">Video Playlist / Series</SelectItem>
                <SelectItem value="anthology">Book Volume / Story Anthology</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || !formData.title}
            className="w-full bg-amber-600 hover:bg-amber-700 text-zinc-950 font-semibold tracking-wider uppercase font-serif"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Summoning...
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4 mr-2" />
                Create Collection
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
