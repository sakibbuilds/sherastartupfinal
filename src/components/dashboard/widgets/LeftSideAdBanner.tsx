import { forwardRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';

export const LeftSideAdBanner = forwardRef<HTMLDivElement>((_, ref) => {
  // Demo ad data - replace with real data from advertisements table when available
  const demoAd = {
    title: 'Boost Your Startup',
    description: 'Get premium visibility and connect with top investors',
    imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop',
    ctaText: 'Learn More',
    ctaUrl: '#',
  };

  return (
    <Card ref={ref} className="overflow-hidden glass-card border-border/50">
      <div className="relative">
        <img
          src={demoAd.imageUrl}
          alt={demoAd.title}
          className="w-full h-32 object-cover"
        />
        <Badge 
          variant="secondary" 
          className="absolute top-2 right-2 text-[10px] bg-background/80 backdrop-blur-sm"
        >
          Sponsored
        </Badge>
      </div>
      <CardContent className="p-3 space-y-2">
        <h4 className="font-semibold text-sm text-foreground">{demoAd.title}</h4>
        <p className="text-xs text-muted-foreground line-clamp-2">{demoAd.description}</p>
        <a
          href={demoAd.ctaUrl}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
        >
          {demoAd.ctaText}
          <ExternalLink className="h-3 w-3" />
        </a>
      </CardContent>
    </Card>
  );
});

LeftSideAdBanner.displayName = 'LeftSideAdBanner';
