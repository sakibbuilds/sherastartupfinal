import { forwardRef, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  placement: string;
}

interface AdBannerProps {
  placement?: string;
}

export const AdBanner = forwardRef<HTMLDivElement, AdBannerProps>(({ placement = 'sidebar' }, ref) => {
  const [ad, setAd] = useState<Advertisement | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchAd();
  }, [placement]);

  const fetchAd = async () => {
    const { data, error } = await supabase
      .from('advertisements')
      .select('*')
      .eq('is_active', true)
      .or(`placement.eq.${placement},placement.eq.sidebar`)
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
    <Card ref={ref} className="overflow-hidden relative group">
      {/* Dismiss Button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 z-10 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3 h-3" />
      </button>

      {/* Sponsored Badge */}
      <Badge 
        variant="secondary" 
        className="absolute top-2 left-2 z-10 text-[10px] bg-background/80 backdrop-blur-sm"
      >
        Sponsored
      </Badge>

      {/* Media */}
      <a 
        href={ad.link_url || '#'} 
        target={ad.link_url ? '_blank' : undefined}
        rel="noopener noreferrer"
        className="block"
      >
        <div className="relative aspect-[16/9] overflow-hidden">
          {ad.media_type === 'video' ? (
            <video
              src={ad.media_url}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={ad.media_url}
              alt={ad.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="font-semibold text-sm mb-0.5 line-clamp-1">{ad.title}</h3>
          {ad.subtitle && (
            <p className="text-xs text-white/80 line-clamp-1">{ad.subtitle}</p>
          )}
          {ad.description && (
            <p className="text-xs text-white/60 mt-1 line-clamp-2">{ad.description}</p>
          )}
          {ad.link_url && (
            <Button 
              size="sm" 
              variant="secondary" 
              className="mt-2 h-7 text-xs gap-1"
            >
              Learn More
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}
        </div>
      </a>
    </Card>
  );
});

AdBanner.displayName = 'AdBanner';
