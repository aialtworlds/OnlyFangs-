import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge } from "@/components/VerificationBadge";

export function RecommendedCreators() {
  const { user, isAuthenticated } = useAuth();
  
  // Use recommendations for authenticated users, trending for public
  const recommendationsQuery = trpc.creator.getRecommendations.useQuery(
    { limit: 6 },
    { enabled: isAuthenticated }
  );
  
  const trendingQuery = trpc.creator.getTrending.useQuery(
    { limit: 6 },
    { enabled: !isAuthenticated }
  );

  const isLoading = isAuthenticated ? recommendationsQuery.isLoading : trendingQuery.isLoading;
  const creators = isAuthenticated ? recommendationsQuery.data : trendingQuery.data;
  const error = isAuthenticated ? recommendationsQuery.error : trendingQuery.error;

  if (isLoading) {
    return (
      <div className="w-full">
        <h2 className="text-2xl font-bold mb-6">
          {isAuthenticated ? "Criadores para Você" : "Criadores em Destaque"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="w-full h-48 rounded-lg" />
              <Skeleton className="w-3/4 h-4" />
              <Skeleton className="w-1/2 h-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <h2 className="text-2xl font-bold mb-6">
          {isAuthenticated ? "Criadores para Você" : "Criadores em Destaque"}
        </h2>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive">
            Erro ao carregar recomendações. Tente novamente mais tarde.
          </p>
        </div>
      </div>
    );
  }

  if (!creators || creators.length === 0) {
    return (
      <div className="w-full">
        <h2 className="text-2xl font-bold mb-6">
          {isAuthenticated ? "Criadores para Você" : "Criadores em Destaque"}
        </h2>
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <div className="text-4xl mb-4">🎭</div>
          <p className="text-lg font-semibold mb-2">Nenhum criador encontrado</p>
          <p className="text-sm text-muted-foreground">
            {isAuthenticated
              ? "Comece a seguir criadores para receber recomendações personalizadas."
              : "Explore a plataforma para descobrir novos criadores."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-6">
        {isAuthenticated ? "Criadores para Você" : "Criadores em Destaque"}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {creators.map((creator) => (
          <Link key={creator.id} href={`/creator/${creator.alias}`}>
            <div className="group cursor-pointer">
              {/* Cover Image */}
              <div className="relative h-48 overflow-hidden rounded-lg mb-4 bg-gradient-to-br from-slate-700 to-slate-900">
                {creator.coverUrl ? (
                  <img
                    src={creator.coverUrl}
                    alt={creator.alias}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      // Fallback to gradient if image fails to load
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-slate-400">
                      <div className="text-3xl mb-2">🎨</div>
                      <div className="text-xs">Sem capa</div>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Creator Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {creator.avatarUrl ? (
                    <img
                      src={creator.avatarUrl}
                      alt={creator.alias}
                      className="w-10 h-10 rounded-full object-cover border-2 border-border flex-shrink-0"
                      onError={(e) => {
                        // Hide failed image
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                      }}
                    />
                  ) : null}
                  {!creator.avatarUrl && (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center border-2 border-border text-white font-bold text-sm flex-shrink-0">
                      {creator.alias.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <h3 className="font-semibold truncate text-sm">
                        {creator.alias}
                      </h3>
                      <VerificationBadge verified={creator.verified} size="sm" />
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-2 text-xs text-muted-foreground flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {creator.totalSubscribers} inscritos
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {creator.totalReleases} conteúdos
                  </Badge>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
