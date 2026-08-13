import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Loader2, AlertCircle } from "lucide-react";

interface ContentUploadFormProps {
  onSuccess?: () => void;
}

export function ContentUploadForm({ onSuccess }: ContentUploadFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    locked: boolean;
    collectionId: string;
    type: "image" | "photo" | "music" | "book" | "video" | "post";
    price: string;
  }>({
    title: "",
    description: "",
    locked: true,
    collectionId: "",
    type: "image",
    price: "",
  });

  // Fetch creator's collections
  const { data: collections = [] } = trpc.creator.myCollections.useQuery();

  // Upload mutation
  const uploadMutation = trpc.content.upload.useMutation({
    onSuccess: () => {
      toast.success("Content uploaded successfully!");
      setFormData({ title: "", description: "", locked: true, collectionId: "", type: "image", price: "" });
      setSelectedFile(null);
      setFilePreview(null);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Error uploading: ${error.message}`);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File too large. Maximum: 50MB");
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith("audio/")) {
      setFilePreview("🎵 Audio file selected");
    } else if (file.type.startsWith("video/")) {
      setFilePreview("🎬 Video file selected");
    } else {
      setFilePreview("📄 File selected");
    }

    // Auto-detect content type
    if (file.type.startsWith("image/")) {
      setFormData((prev) => ({ ...prev, type: "image" }));
    } else if (file.type.startsWith("audio/")) {
      setFormData((prev) => ({ ...prev, type: "music" }));
    } else if (file.type.startsWith("video/")) {
      setFormData((prev) => ({ ...prev, type: "video" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsLoading(true);

    try {
      // Upload file to S3
      const formDataForUpload = new FormData();
      formDataForUpload.append("file", selectedFile);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formDataForUpload,
      });

      if (!uploadResponse.ok) {
        throw new Error("Error uploading file");
      }

      const { url, key } = await uploadResponse.json();

      // Create content record via tRPC
      await uploadMutation.mutateAsync({
        locked: formData.locked,
        collectionId: formData.collectionId && formData.collectionId !== "none_selected" ? parseInt(formData.collectionId) : undefined,
        title: formData.title,
        description: formData.description || undefined,
        type: formData.type,
        fileUrl: url,
        fileKey: key,
        mimeType: selectedFile.type,
        fileSize: selectedFile.size,
        price: formData.price ? parseFloat(formData.price) : undefined,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Error uploading file");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Upload Exclusive Content</CardTitle>
        <CardDescription>
          Share photos, music, videos and more with your patrons
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">File</label>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition">
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*,audio/*,video/*,.pdf"
                className="hidden"
                id="file-input"
                disabled={isLoading}
              />
              <label htmlFor="file-input" className="cursor-pointer block">
                {filePreview ? (
                  <div className="space-y-2">
                    {typeof filePreview === "string" && filePreview.startsWith("data:") ? (
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="w-24 h-24 mx-auto rounded object-cover"
                      />
                    ) : (
                      <div className="text-3xl">{filePreview}</div>
                    )}
                    <p className="text-sm text-muted-foreground">{selectedFile?.name}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium">Click to select file</p>
                    <p className="text-xs text-muted-foreground">
                      Maximum 50MB (images, audio, video, PDF)
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title *
            </label>
            <Input
              id="title"
              placeholder="Ex: Exclusive behind-the-scenes photo"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              disabled={isLoading}
              maxLength={255}
            />
            <p className="text-xs text-muted-foreground">{formData.title.length}/255</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="Describe the content (optional)"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              disabled={isLoading}
              maxLength={1000}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">{formData.description.length}/1000</p>
          </div>

          {/* Access Level */}
          <div className="space-y-2">
            <label htmlFor="locked" className="text-sm font-medium">
              Access Level *
            </label>
            <Select value={formData.locked ? "locked" : "public"} onValueChange={(value) => setFormData((prev) => ({ ...prev, locked: value === "locked" }))}>
              <SelectTrigger id="locked" disabled={isLoading}>
                <SelectValue placeholder="Select access level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public (anyone can view)</SelectItem>
                <SelectItem value="locked">Subscribers only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Unlock Price (Optional) */}
          <div className="space-y-2">
            <label htmlFor="price" className="text-sm font-medium">
              Unlock Price (USD - Optional)
            </label>
            <Input
              id="price"
              type="number"
              step="0.01"
              placeholder="e.g. 9.99 (Leave empty to restrict to subscription only)"
              value={formData.price}
              onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Allows patrons to purchase individual unlock access without a subscription.
            </p>
          </div>

          {/* Collection Selection (Optional) */}
          {collections.length > 0 && (
            <div className="space-y-2">
              <label htmlFor="collection" className="text-sm font-medium">
                Collection / Album (Optional)
              </label>
              <Select value={formData.collectionId} onValueChange={(value) => setFormData((prev) => ({ ...prev, collectionId: value }))}>
                <SelectTrigger id="collection" disabled={isLoading}>
                  <SelectValue placeholder="No collection (Single release)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none_selected">No collection (Single release)</SelectItem>
                  {collections.map((coll: any) => (
                    <SelectItem key={coll.id} value={coll.id.toString()}>
                      {coll.title} ({coll.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || !selectedFile || !formData.title}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Content
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
