import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, 
  Heart, 
  MessageCircle, 
  Share2, 
  Volume2, 
  VolumeX,
  Play,
  Send,
  Flag,
  Eye,
  Search,
  Filter,
  X,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import CommentTree, { Comment } from '@/components/pitches/CommentTree';
import ReportPitchDialog from '@/components/pitches/ReportPitchDialog';
import { StartupBadge } from '@/components/common/StartupBadge';
import { FollowButton } from '@/components/common/FollowButton';
import { AvatarWithPresence } from '@/components/common/OnlineIndicator';

interface VideoPitch {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  motive: string | null;
  views_count: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user?: {
    full_name: string;
    avatar_url: string | null;
    title: string | null;
    verified?: boolean;
  };
  startup?: {
    id: string;
    name: string;
  } | null;
  isLiked?: boolean;
}

const ITEMS_PER_PAGE = 5;

const motiveLabels: Record<string, { label: string; color: string }> = {
  investment: { label: 'Raising Investment', color: 'bg-green-500/20 text-green-500' },
  mentorship: { label: 'Seeking Mentorship', color: 'bg-blue-500/20 text-blue-500' },
  cofounder: { label: 'Looking for Co-Founder', color: 'bg-purple-500/20 text-purple-500' },
  investor: { label: 'Investor', color: 'bg-amber-500/20 text-amber-500' },
  networking: { label: 'Networking', color: 'bg-pink-500/20 text-pink-500' },
  general: { label: 'General', color: 'bg-muted text-muted-foreground' },
};

const motiveOptions = [
  { value: 'investment', label: 'Raising Investment' },
  { value: 'mentorship', label: 'Seeking Mentorship' },
  { value: 'cofounder', label: 'Looking for Co-Founder' },
  { value: 'investor', label: 'Investor' },
  { value: 'networking', label: 'Networking' },
  { value: 'general', label: 'General' },
];

// Format count as 1K, 2.5K, 1M etc
const formatCount = (count: number): string => {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(count >= 10000000 ? 0 : 1).replace(/\.0$/, '') + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(count >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'K';
  }
  return count.toString();
};

const Pitches = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [pitches, setPitches] = useState<VideoPitch[]>([]);
  const [filteredPitches, setFilteredPitches] = useState<VideoPitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportingPitch, setReportingPitch] = useState<VideoPitch | null>(null);
  const [initialVideoId, setInitialVideoId] = useState<string | null>(null);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMotives, setSelectedMotives] = useState<string[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const viewTrackedRef = useRef<Set<string>>(new Set());

  // Check for video query param on mount
  useEffect(() => {
    const videoId = searchParams.get('video');
    if (videoId) {
      setInitialVideoId(videoId);
      // Clear the query param
      setSearchParams({}, { replace: true });
    }
  }, []);

  const fetchPitches = useCallback(async (pageNum: number, append = false) => {
    const { data, error } = await supabase
      .from('video_pitches')
      .select('*')
      .order('created_at', { ascending: false })
      .range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1);

    if (error) {
      console.error('Error fetching pitches:', error);
      return;
    }

    if (data) {
      if (data.length < ITEMS_PER_PAGE) {
        setHasMore(false);
      }

      const pitchesWithDetails = await Promise.all(
        data.map(async (pitch) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, title, verified')
            .eq('user_id', pitch.user_id)
            .maybeSingle();

          // Fetch startup if user is a founder
          const { data: startup } = await supabase
            .from('startups')
            .select('id, name')
            .eq('founder_id', pitch.user_id)
            .maybeSingle();

          let isLiked = false;
          if (user) {
            const { data: likeData } = await supabase
              .from('video_pitch_likes')
              .select('id')
              .eq('video_id', pitch.id)
              .eq('user_id', user.id)
              .maybeSingle();
            isLiked = !!likeData;
          }

          // Ensure profile data is present, fallback if not
          const safeProfile = profile || { full_name: 'Unknown User', avatar_url: null, title: null };

          return { ...pitch, user: safeProfile, startup, isLiked };
        })
      );

      if (append) {
        setPitches(prev => [...prev, ...pitchesWithDetails]);
      } else {
        setPitches(pitchesWithDetails);
      }
    }
    setLoading(false);
  }, [user]);

  // Apply filters and handle initial video navigation
  useEffect(() => {
    let result = [...pitches];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.user?.full_name && p.user.full_name.toLowerCase().includes(query))
      );
    }

    // Filter by motives
    if (selectedMotives.length > 0) {
      result = result.filter(p => p.motive && selectedMotives.includes(p.motive));
    }

    setFilteredPitches(result);

    // If we have an initial video ID, scroll to it
    if (initialVideoId && result.length > 0) {
      const videoIndex = result.findIndex(p => p.id === initialVideoId);
      if (videoIndex !== -1) {
        setCurrentIndex(videoIndex);
        // Scroll to the video after a short delay
        setTimeout(() => {
          if (containerRef.current) {
            const itemHeight = containerRef.current.clientHeight;
            containerRef.current.scrollTo({
              top: videoIndex * itemHeight,
              behavior: 'instant'
            });
          }
        }, 100);
        setInitialVideoId(null);
      }
    } else if (!initialVideoId) {
      setCurrentIndex(0);
    }
  }, [pitches, searchQuery, selectedMotives, initialVideoId]);

  // Initial fetch
  useEffect(() => {
    fetchPitches(0);
  }, [fetchPitches]);

  // Realtime subscriptions for counts
  useEffect(() => {
    const channel = supabase
      .channel('pitch-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'video_pitches' },
        (payload) => {
          const updated = payload.new as VideoPitch;
          setPitches(prev => prev.map(p => 
            p.id === updated.id 
              ? { ...p, views_count: updated.views_count, likes_count: updated.likes_count, comments_count: updated.comments_count }
              : p
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Track view using edge function (IP-based, 24h cooldown)
  useEffect(() => {
    const currentPitch = filteredPitches[currentIndex];
    if (!currentPitch || viewTrackedRef.current.has(currentPitch.id)) return;

    const timer = setTimeout(async () => {
      viewTrackedRef.current.add(currentPitch.id);
      
      try {
        await supabase.functions.invoke('track-view', {
          body: { video_id: currentPitch.id }
        });
      } catch (error) {
        console.error('Error tracking view:', error);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentIndex, filteredPitches]);

  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([id, video]) => {
      if (video) {
        const pitch = filteredPitches[currentIndex];
        if (pitch && pitch.id === id) {
          if (playing) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        } else {
          video.pause();
          video.currentTime = 0;
        }
      }
    });
  }, [currentIndex, playing, filteredPitches]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const itemHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / itemHeight);

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < filteredPitches.length) {
      setCurrentIndex(newIndex);
      setPlaying(true);
    }

    if (scrollTop + itemHeight * 2 >= container.scrollHeight && hasMore && !loading && !searchQuery && selectedMotives.length === 0) {
      setPage(prev => {
        const newPage = prev + 1;
        fetchPitches(newPage, true);
        return newPage;
      });
    }
  }, [currentIndex, filteredPitches.length, hasMore, loading, fetchPitches, searchQuery, selectedMotives]);

  const handleLike = async (pitch: VideoPitch) => {
    if (!user) return;

    const wasLiked = pitch.isLiked;
    setPitches(prev => prev.map(p => 
      p.id === pitch.id 
        ? { ...p, isLiked: !wasLiked }
        : p
    ));

    if (wasLiked) {
      const { error } = await supabase
        .from('video_pitch_likes')
        .delete()
        .eq('video_id', pitch.id)
        .eq('user_id', user.id);
      
      if (error) {
        setPitches(prev => prev.map(p => 
          p.id === pitch.id ? { ...p, isLiked: wasLiked } : p
        ));
      }
    } else {
      const { error } = await supabase
        .from('video_pitch_likes')
        .insert({ pitch_id: pitch.id, user_id: user.id });
      
      if (error) {
        setPitches(prev => prev.map(p => 
          p.id === pitch.id ? { ...p, isLiked: wasLiked } : p
        ));
      }
    }
  };

  const fetchComments = async (videoId: string) => {
    setLoadingComments(true);
    const { data } = await supabase
      .from('video_pitch_comments')
      .select('*')
      .eq('pitch_id', videoId)
      .order('created_at', { ascending: true });

    if (data) {
      const commentsWithUsers = await Promise.all(
        data.map(async (comment) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', comment.user_id)
            .maybeSingle();
          
          const { data: startup } = await supabase
            .from('startups')
            .select('id, name')
            .eq('founder_id', comment.user_id)
            .maybeSingle();
            
          return { ...comment, user: profile, startup };
        })
      );
      setComments(commentsWithUsers);
    }
    setLoadingComments(false);
  };

  const handleOpenComments = (pitch: VideoPitch) => {
    setCommentsOpen(true);
    fetchComments(pitch.id);
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim() || !filteredPitches[currentIndex]) return;

    const { error } = await supabase
      .from('video_pitch_comments')
      .insert({
        pitch_id: filteredPitches[currentIndex].id,
        user_id: user.id,
        content: newComment.trim()
      });

    if (!error) {
      setNewComment('');
      fetchComments(filteredPitches[currentIndex].id);
    }
  };

  const handleShare = async (pitch: VideoPitch) => {
    try {
      await navigator.share({
        title: pitch.title,
        text: pitch.description || 'Check out this pitch!',
        url: window.location.href
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link copied!', description: 'Share link copied to clipboard.' });
    }
  };

  const handleReport = (pitch: VideoPitch) => {
    setReportingPitch(pitch);
    setReportDialogOpen(true);
  };

  const handleViewProfile = (userId: string) => {
    navigate(`/dashboard/profile/${userId}`);
  };

  const toggleMotive = (motive: string) => {
    setSelectedMotives(prev => 
      prev.includes(motive) 
        ? prev.filter(m => m !== motive)
        : [...prev, motive]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedMotives([]);
  };

  const activeFiltersCount = selectedMotives.length + (searchQuery ? 1 : 0);

  if (loading && pitches.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] relative bg-black">
      {/* Search and Filter Bar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <AnimatePresence>
          {showSearch ? (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pitches..."
                  className="pl-9 w-48 md:w-64 bg-black/70 border-white/20 text-white placeholder:text-white/50"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-white/50 hover:text-white" />
                  </button>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => setShowSearch(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </motion.div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="bg-white/5 text-white hover:bg-white/10"
              onClick={() => setShowSearch(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
          )}
        </AnimatePresence>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="bg-white/5 text-white hover:bg-white/10 relative"
            >
              <Filter className="h-5 w-5" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Filter by Motive</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {motiveOptions.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={selectedMotives.includes(option.value)}
                onCheckedChange={() => toggleMotive(option.value)}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
            {activeFiltersCount > 0 && (
              <>
                <DropdownMenuSeparator />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={clearFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear all filters
                </Button>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Active filter badges */}
        {selectedMotives.length > 0 && !showSearch && (
          <div className="hidden md:flex items-center gap-1 flex-wrap">
            {selectedMotives.map((motive) => (
              <Badge
                key={motive}
                className={cn("cursor-pointer", motiveLabels[motive]?.color)}
                onClick={() => toggleMotive(motive)}
              >
                {motiveLabels[motive]?.label}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Video Feed */}
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        onScroll={handleScroll}
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {filteredPitches.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white">
            <Play className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">
              {searchQuery || selectedMotives.length > 0 ? 'No pitches found' : 'No pitches yet'}
            </p>
            <p className="text-muted-foreground">
              {searchQuery || selectedMotives.length > 0 
                ? 'Try adjusting your search or filters' 
                : 'Be the first to upload a pitch!'}
            </p>
            {(searchQuery || selectedMotives.length > 0) && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          filteredPitches.map((pitch, index) => (
            <div
              key={pitch.id}
              className="h-full w-full snap-start snap-always relative flex items-center justify-center"
              style={{ scrollSnapAlign: 'start' }}
            >
              {/* Mobile Styled Container */}
              <div className="relative w-full h-full md:max-w-[420px] md:h-[calc(100vh-6rem)] md:my-4 md:rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/5">
                {/* Video */}
                <video
                  ref={(el) => { videoRefs.current[pitch.id] = el; }}
                  src={pitch.video_url}
                  poster={pitch.thumbnail_url || undefined}
                  className="h-full w-full object-cover bg-black"
                  loop
                  muted={muted}
                  playsInline
                  onClick={() => setPlaying(!playing)}
                />

                {/* Mute Button - Top Right */}
                <button
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white z-10 hover:bg-black/60 transition-colors"
                  onClick={() => setMuted(!muted)}
                >
                  {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>

                {/* Play/Pause Indicator */}
                <AnimatePresence>
                  {!playing && index === currentIndex && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <div className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center">
                        <Play className="h-10 w-10 text-white ml-1" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Overlay Content */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
                  
                  {/* Right Side Actions */}
                  <div className="absolute right-2 bottom-20 flex flex-col gap-4 pointer-events-auto items-center">
                    <div className="flex flex-col items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-full h-12 w-12 bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm"
                        onClick={() => handleLike(pitch)}
                      >
                        <Heart className={cn("h-6 w-6", pitch.isLiked && "fill-red-500 text-red-500")} />
                      </Button>
                      <span className="text-xs font-medium text-white">{formatCount(pitch.likes_count)}</span>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-full h-12 w-12 bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm"
                        onClick={() => handleOpenComments(pitch)}
                      >
                        <MessageCircle className="h-6 w-6" />
                      </Button>
                      <span className="text-xs font-medium text-white">{formatCount(pitch.comments_count)}</span>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-full h-12 w-12 bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm"
                        onClick={() => handleShare(pitch)}
                      >
                        <Share2 className="h-6 w-6" />
                      </Button>
                      <span className="text-xs font-medium text-white">Share</span>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-full h-12 w-12 bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm"
                        onClick={() => handleReport(pitch)}
                      >
                        <Flag className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Bottom Info */}
                  <div className="absolute bottom-0 left-0 right-16 p-4 pointer-events-auto">
                    <div className="flex items-center gap-3">
                      <div 
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/profile/${pitch.user_id}`);
                        }}
                      >
                        <AvatarWithPresence userId={pitch.user_id} indicatorSize="sm">
                          <Avatar className="h-10 w-10 border-2 border-white/20">
                            <AvatarImage src={pitch.user?.avatar_url || ''} />
                            <AvatarFallback>{pitch.user?.full_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </AvatarWithPresence>
                      </div>
                      
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span 
                            className="font-semibold text-white hover:underline cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/dashboard/profile/${pitch.user_id}`);
                            }}
                          >
                            {pitch.user?.full_name}
                          </span>
                          {pitch.user?.verified && (
                            <CheckCircle2 className="h-4 w-4 text-blue-400 fill-blue-400/10" />
                          )}
                          <FollowButton 
                            targetUserId={pitch.user_id} 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 text-white/90 hover:text-white hover:bg-white/10"
                            hideIfFollowing={true} 
                          />
                        </div>
                        {pitch.user?.title && (
                          <span className="text-xs text-white/70">{pitch.user.title}</span>
                        )}
                      </div>
                    </div>

                    <h3 className="font-semibold text-white mb-2 line-clamp-2">{pitch.title}</h3>
                    
                    {pitch.description && (
                      <p className="text-sm text-white/90 line-clamp-2 mb-3">
                        {pitch.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {pitch.motive && (
                        <Badge variant="secondary" className={cn("backdrop-blur-md bg-white/20 text-white border-transparent", motiveLabels[pitch.motive]?.color)}>
                          {motiveLabels[pitch.motive]?.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Loading More Indicator */}
        {hasMore && filteredPitches.length > 0 && !searchQuery && selectedMotives.length === 0 && (
          <div className="h-20 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>

      {/* Comments Sheet */}
      <Sheet open={commentsOpen} onOpenChange={setCommentsOpen}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
          <SheetHeader>
            <SheetTitle>Comments ({formatCount(filteredPitches[currentIndex]?.comments_count || 0)})</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-[calc(100%-4rem)]">
            <ScrollArea className="flex-1 py-4">
              {loadingComments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <CommentTree 
                  comments={comments} 
                  videoId={filteredPitches[currentIndex]?.id || ''} 
                  onCommentAdded={() => {
                    fetchComments(filteredPitches[currentIndex]?.id);
                  }}
                />
              )}
            </ScrollArea>
            <div className="flex gap-2 pt-4 border-t">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <Button size="icon" onClick={handleAddComment} disabled={!newComment.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Report Dialog */}
      {reportingPitch && (
        <ReportPitchDialog
          open={reportDialogOpen}
          onOpenChange={setReportDialogOpen}
          videoId={reportingPitch.id}
          videoTitle={reportingPitch.title}
        />
      )}
    </div>
  );
};

export default Pitches;