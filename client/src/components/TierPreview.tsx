import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";

interface TierPreviewProps {
  name: string;
  price: string;
  currency: string;
  description: string;
  perks: string[];
  featured: boolean;
}

export function TierPreview({
  name,
  price,
  currency,
  description,
  perks,
  featured,
}: TierPreviewProps) {
  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-muted-foreground">LIVE PREVIEW</div>

      <Card
        className={`relative overflow-hidden transition-all ${
          featured ? "ring-2 ring-amber-500 shadow-lg" : ""
        }`}
      >
        {featured && (
          <div className="absolute top-0 right-0 bg-amber-500 text-white px-3 py-1 text-xs font-semibold flex items-center gap-1">
            <Star className="w-3 h-3" />
            FEATURED
          </div>
        )}

        <CardHeader className={featured ? "pt-12" : ""}>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{name || "Tier Name"}</CardTitle>
              {description && (
                <CardDescription className="mt-2">{description}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Price */}
          <div className="border-b pb-6">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">Creator's Choice</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Pricing set by the creator. Billed monthly, cancel anytime.
            </p>
          </div>

          {/* Perks */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">What's Included:</h4>
            {perks && perks.length > 0 ? (
              <ul className="space-y-2">
                {perks.map((perk, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{perk}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No perks added yet
              </p>
            )}
          </div>

          {/* CTA Button */}
          <Button className="w-full" size="lg">
            Join {name || "this tier"}
          </Button>
        </CardContent>
      </Card>

      {/* Preview Notes */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
        <p className="text-blue-900 dark:text-blue-100">
          <strong>Preview Note:</strong> This is how your tier will appear to patrons on your creator page. Changes are reflected in real-time.
        </p>
      </div>
    </div>
  );
}
