import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Play, Eye, Heart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';

interface VideoPitch {
  id: string;
  title: string;
  thumbnail_url: string | null;
  video_url: string | null;
  views_count: number | null;
  likes_count: number | null;
  user_id: string;
  motive: string | null;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export const PitchVideoCarousel = () => {
  const navigate = useNavigate();
  const [pitches, setPitches] = useState<VideoPitch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPitches();
  }, []);

  const fetchPitches = async () => {
    const { data, error } = await supabase
      .from('video_pitches')
      .select('id, title, thumbnail_url, video_url, views_count, likes_count, user_id, motive')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching pitches:', error);
      setLoading(false);
      return;
    }

    // Fetch profiles for each pitch
    const pitchesWithProfiles = await Promise.all(
      (data || []).map(async (pitch) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('user_id', pitch.user_id)
          .single();
        return { ...pitch, profiles: profile };
      })
    );

    setPitches(pitchesWithProfiles);
    setLoading(false);
  };

  const formatCount = (count: number | null) => {
    if (!count) return '0';
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getMotiveColor = (motive: string | null) => {
    switch (motive) {
      case 'raising': return 'bg-emerald-500/20 text-emerald-400';
      case 'mentorship': return 'bg-purple-500/20 text-purple-400';
      case 'cofounder': return 'bg-blue-500/20 text-blue-400';
      case 'investor': return 'bg-amber-500/20 text-amber-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getMotiveLabel = (motive: string | null) => {
    switch (motive) {
      case 'raising': return 'Raising';
      case 'mentorship': return 'Mentorship';
      case 'cofounder': return 'Co-founder';
      case 'investor': return 'Investor';
      default: return 'General';
    }
  };

  if (loading) {
    return (
      <div className="py-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-36 h-64 rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (pitches.length === 0) return null;

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Play className="w-4 h-4 text-primary" />
          Pitch Videos
        </h3>
        <button
          onClick={() => navigate('/dashboard/pitches')}
          className="text-xs text-primary hover:underline"
        >
          See all
        </button>
      </div>

      <Carousel
        opts={{
          align: 'start',
          dragFree: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2">
          {pitches.map((pitch) => (
            <CarouselItem key={pitch.id} className="pl-2 basis-[140px]">
              <Card
                onClick={() => navigate('/dashboard/pitches')}
                className="relative overflow-hidden cursor-pointer group border-0 bg-gradient-to-b from-card to-background"
                style={{ aspectRatio: '9/16' }}
              >
                {/* Thumbnail/Video Preview */}
                <div className="absolute inset-0">
                  {pitch.thumbnail_url ? (
                    <img
                      src={pitch.thumbnail_url}
                      alt={pitch.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Play className="w-8 h-8 text-primary/50" />
                    </div>
                  )}
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Play className="w-5 h-5 text-white fill-white" />
                  </div>
                </div>

                {/* Motive Badge */}
                {pitch.motive && (
                  <div className="absolute top-2 left-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getMotiveColor(pitch.motive)}`}>
                      {getMotiveLabel(pitch.motive)}
                    </span>
                  </div>
                )}

                {/* Bottom Content */}
                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                  {/* User Info */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Avatar className="w-5 h-5 border border-white/20">
                      <AvatarImage src={pitch.profiles?.avatar_url || ''} />
                      <AvatarFallback className="text-[8px] bg-primary/20">
                        {pitch.profiles?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[10px] text-white/80 truncate max-w-[80px]">
                      {pitch.profiles?.full_name || 'Anonymous'}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-xs font-medium text-white line-clamp-2 leading-tight mb-1.5">
                    {pitch.title}
                  </h4>

                  {/* Stats */}
                  <div className="flex items-center gap-2 text-[10px] text-white/60">
                    <span className="flex items-center gap-0.5">
                      <Eye className="w-3 h-3" />
                      {formatCount(pitch.views_count)}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Heart className="w-3 h-3" />
                      {formatCount(pitch.likes_count)}
                    </span>
                  </div>
                </div>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};
