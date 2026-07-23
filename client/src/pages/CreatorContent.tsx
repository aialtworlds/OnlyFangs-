import { useRoute } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, Image, Music, Video, FileText, ChevronLeft } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { ReportContentButton } from "@/components/ReportContentButton";

export default function CreatorContent() {
  const [, params] = useRoute("/creator/:id/content");
  const creatorHandle = params?.id as string;
  const { user, isAuthenticated } = useAuth();
  const [selectedContentId, setSelectedContentId] = useState<number | null>(null);

  // Fetch creator by handle
  const { data: creator, isLoading: creatorLoading } = trpc.public.creatorByHandle.useQuery({
    handle: creatorHandle,
  });

  // Fetch creator's tiers
  const { data: tiers = [] } = trpc.public.creatorTiers.useQuery(
    { creatorId: creator?.id || 0 },
    { enabled: !!creator }
  );

  // Fetch creator's content (public list, but with tier info)
  const { data: contentList = [], isLoading: contentLoading } = trpc.content.list.useQuery(
    undefined,
    { enabled: false } // We'll fetch this differently for public access
  );

  if (creatorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Creator not found</p>
        <Link href="/">
          <Button variant="outline">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case "image":
      case "photo":
        return <Image className="w-4 h-4" />;
      case "music":
        return <Music className="w-4 h-4" />;
      case "video":
        return <Video className="w-4 h-4" />;
      case "book":
      case "post":
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTierName = (tierId: number) => {
    const tier = tiers.find((t: any) => t.id === tierId);
    return tier?.name || `Tier ${tierId}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <Link href={`/creator/${creatorHandle}`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Profile
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{creator.alias}</h1>
            <p className="text-muted-foreground">Exclusive Content</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {contentLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : contentList.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">No content available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contentList.map((item: any) => {
              const tierName = getTierName(item.tierId);
              const hasAccess = isAuthenticated && user?.id; // Simplified - should check actual subscription

              return (
                <Card
                  key={item.id}
                  className="overflow-hidden hover:shadow-lg transition cursor-pointer group"
                  onClick={() => setSelectedContentId(item.id)}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    ) : item.type === "image" || item.type === "photo" ? (
                      <Image className="w-8 h-8 text-muted-foreground" />
                    ) : item.type === "music" ? (
                      <Music className="w-8 h-8 text-muted-foreground" />
                    ) : item.type === "video" ? (
                      <Video className="w-8 h-8 text-muted-foreground" />
                    ) : (
                      <FileText className="w-8 h-8 text-muted-foreground" />
                    )}

                    {/* Lock Badge if no access */}
                    {!hasAccess && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Lock className="w-8 h-8 text-white" />
                      </div>
                    )}

                    {/* Tier Badge */}
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      {tierName}
                    </div>
                  </div>

                  {/* Content Info */}
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold line-clamp-2">{item.title}</h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {getContentIcon(item.type)}
                        <span className="capitalize">{item.type}</span>
                      </div>
                      <span>{new Date(item.createdAt).toLocaleDateString("pt-BR")}</span>
                    </div>

                    {/* Report — separate click target from the card's own onClick */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <ReportContentButton contentId={item.id} />
                    </div>

                    {/* CTA */}
                    {hasAccess ? (
                      <Button size="sm" className="w-full">
                        View Content
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = getLoginUrl();
                        }}
                      >
                        <Lock className="w-3 h-3 mr-1" />
                        Log In
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Tier Info */}
        {tiers.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border">
            <h2 className="text-2xl font-bold mb-6">Tiers Disponíveis</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tiers.map((tier: any) => (
                <Card key={tier.id}>
                  <CardHeader>
                    <CardTitle>{tier.name}</CardTitle>
                    <CardDescription>
                      ${tier.price}/mês
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {tier.description && (
                      <p className="text-sm text-muted-foreground">{tier.description}</p>
                    )}
                    {tier.perks && tier.perks.length > 0 && (
                      <ul className="space-y-2">
                        {tier.perks.map((perk: string, idx: number) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-primary mt-1">✓</span>
                            <span>{perk}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link href={`/creator/${creatorHandle}`}>
                      <Button className="w-full">
                        Assinar
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
