import { forwardRef, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Advertisement {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  media_url: string;
  media_type: string;
  link_url: string | null;
}

export const LeftSideAdBanner = forwardRef<HTMLDivElement>((_, ref) => {
  const [ad, setAd] = useState<Advertisement | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchAd();
  }, []);

  const fetchAd = async () => {
    const { data, error } = await supabase
      .from('advertisements')
      .select('*')
      .eq('is_active', true)
      .or('placement.eq.left_sidebar,placement.eq.sidebar')
      .order('priority', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setAd(data);
    }
    setLoading(false);
  };

  if (dismissed) return null;

  if (loading) {
    return (
      <div ref={ref}>
        <Skeleton className="w-full h-48 rounded-xl" />
      </div>
    );
  }

  if (!ad) return null;

  return (
    <Card ref={ref} className="overflow-hidden glass-card border-border/50 relative group">
      {/* Dismiss Button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-8 z-10 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3 h-3" />
      </button>

      <div className="relative">
        {ad.media_type === 'video' ? (
          <video
            src={ad.media_url}
            className="w-full h-32 object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <img
            src={ad.media_url}
            alt={ad.title}
            className="w-full h-32 object-cover"
          />
        )}
        <Badge 
          variant="secondary" 
          className="absolute top-2 right-2 text-[10px] bg-background/80 backdrop-blur-sm"
        >
          Sponsored
        </Badge>
      </div>
      <CardContent className="p-3 space-y-2">
        <h4 className="font-semibold text-sm text-foreground">{ad.title}</h4>
        {ad.subtitle && (
          <p className="text-xs text-muted-foreground">{ad.subtitle}</p>
        )}
        {ad.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{ad.description}</p>
        )}
        {ad.link_url && (
          <a
            href={ad.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
          >
            Learn More
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </CardContent>
    </Card>
  );
});

LeftSideAdBanner.displayName = 'LeftSideAdBanner';
