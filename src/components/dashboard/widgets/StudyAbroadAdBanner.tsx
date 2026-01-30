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

export const StudyAbroadAdBanner = forwardRef<HTMLDivElement>((_, ref) => {
  const [ad, setAd] = useState<Advertisement | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchAd();
  }, []);

  const fetchAd = async () => {
    // Fetch a different ad for the right sidebar (offset by 1 to get variety)
    const { data, error } = await supabase
      .from('advertisements')
      .select('*')
      .eq('is_active', true)
      .or('placement.eq.right_sidebar,placement.eq.sidebar')
      .order('priority', { ascending: false })
      .range(1, 1); // Get second ad for variety

    if (!error && data && data.length > 0) {
      setAd(data[0]);
    } else {
      // Fallback to first ad if no second one exists
      const { data: fallbackData } = await supabase
        .from('advertisements')
        .select('*')
        .eq('is_active', true)
        .or('placement.eq.right_sidebar,placement.eq.sidebar')
        .order('priority', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (fallbackData) {
        setAd(fallbackData);
      }
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
    <Card ref={ref} className="overflow-hidden glass-card border-border/50 bg-gradient-to-br from-primary/5 to-secondary/5 relative group">
      {/* Dismiss Button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 left-2 z-10 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3 h-3" />
      </button>

      <div className="relative">
        {ad.media_type === 'video' ? (
          <video
            src={ad.media_url}
            className="w-full h-28 object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <img
            src={ad.media_url}
            alt={ad.title}
            className="w-full h-28 object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
        <Badge 
          variant="secondary" 
          className="absolute top-2 right-2 text-[10px] bg-background/80 backdrop-blur-sm"
        >
          Sponsored
        </Badge>
        {ad.subtitle && (
          <div className="absolute bottom-2 left-3 right-3">
            <span className="text-xs font-semibold text-primary">{ad.subtitle}</span>
          </div>
        )}
      </div>
      <CardContent className="p-3 space-y-2.5">
        <h4 className="font-semibold text-sm text-foreground leading-tight">{ad.title}</h4>
        {ad.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{ad.description}</p>
        )}

        {ad.link_url && (
          <a
            href={ad.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 w-full text-xs font-medium py-2 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Learn More
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </CardContent>
    </Card>
  );
});

StudyAbroadAdBanner.displayName = 'StudyAbroadAdBanner';
