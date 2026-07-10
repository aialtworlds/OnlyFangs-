import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, Image, Music, Video, FileText, Download } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

interface ContentPreviewProps {
  contentId: number;
  onUnlock?: () => void;
}

export function ContentPreview({ contentId, onUnlock }: ContentPreviewProps) {
  const { user, isAuthenticated } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);

  // Fetch content details
  const { data: content, isLoading: contentLoading } = trpc.content.getById.useQuery({
    contentId,
  });

  // Check access permission
  const { data: canAccess, isLoading: accessLoading } = trpc.content.canAccess.useQuery(
    { contentId },
    { enabled: isAuthenticated }
  );

  useEffect(() => {
    if (canAccess) {
      setHasAccess(true);
      onUnlock?.();
    }
  }, [canAccess, onUnlock]);

  if (contentLoading || accessLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!content) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12 text-center">
          <div>
            <p className="text-muted-foreground">Content not found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case "image":
      case "photo":
        return <Image className="w-8 h-8" />;
      case "music":
        return <Music className="w-8 h-8" />;
      case "video":
        return <Video className="w-8 h-8" />;
      case "book":
      case "post":
        return <FileText className="w-8 h-8" />;
      default:
        return <FileText className="w-8 h-8" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{content.title}</CardTitle>
        {content.description && (
          <CardDescription>{content.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Content Display */}
        <div className="relative">
          {hasAccess ? (
            <>
              {/* Unlocked Content */}
              {content.type === "image" || content.type === "photo" ? (
                <div className="rounded-lg overflow-hidden bg-muted">
                  <img
                    src={content.fileUrl}
                    alt={content.title}
                    className="w-full h-auto max-h-96 object-cover"
                  />
                </div>
              ) : content.type === "music" ? (
                <div className="rounded-lg bg-muted p-8 flex flex-col items-center justify-center gap-4">
                  <Music className="w-12 h-12 text-muted-foreground" />
                  <audio
                    src={content.fileUrl}
                    controls
                    className="w-full"
                  />
                </div>
              ) : content.type === "video" ? (
                <div className="rounded-lg overflow-hidden bg-muted">
                  <video
                    src={content.fileUrl}
                    controls
                    className="w-full h-auto max-h-96"
                  />
                </div>
              ) : (
                <div className="rounded-lg bg-muted p-8 flex flex-col items-center justify-center gap-4">
                  {getContentIcon(content.type)}
                  <p className="text-muted-foreground">Arquivo: {content.title}</p>
                </div>
              )}

              {/* Download Button */}
              <div className="mt-4">
                <a href={content.fileUrl} download target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Arquivo
                  </Button>
                </a>
              </div>
            </>
          ) : (
            <>
              {/* Locked Content */}
              <div className="rounded-lg bg-muted aspect-video flex flex-col items-center justify-center gap-4">
                <Lock className="w-12 h-12 text-muted-foreground" />
                <p className="text-muted-foreground text-center">
                  Conteúdo bloqueado
                </p>
              </div>

              {/* Unlock Message */}
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
                {isAuthenticated ? (
                  <p className="text-sm text-amber-900">
                    You need a subscription to access this content
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-amber-900">
                      Sign in to access exclusive content
                    </p>
                    <a href={getLoginUrl()}>
                      <Button size="sm" variant="outline">
                        Sign In
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Content Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Tipo</p>
            <p className="font-medium capitalize">{content.type}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Tamanho</p>
            <p className="font-medium">
              {content.fileSize
                ? `${(content.fileSize / (1024 * 1024)).toFixed(1)} MB`
                : "N/A"}
            </p>
          </div>
          {content.duration && (
            <div>
              <p className="text-muted-foreground">Duração</p>
              <p className="font-medium">{content.duration}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground">Data</p>
            <p className="font-medium">
              {new Date(content.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
