import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Heart, X, Star, RotateCcw, Loader2, Users } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  university: string | null;
  title: string | null;
  expertise: string[] | null;
}

const Match = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [lastAction, setLastAction] = useState<{ profile: Profile; action: 'like' | 'pass' } | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, [user]);

  const fetchProfiles = async () => {
    if (!user) return;

    // Get profiles that haven't been matched yet
    const { data: existingMatches } = await supabase
      .from('matches')
      .select('matched_user_id')
      .eq('user_id', user.id);

    const matchedUserIds = existingMatches?.map(m => m.matched_user_id) || [];
    matchedUserIds.push(user.id); // Exclude self

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .not('user_id', 'in', `(${matchedUserIds.join(',')})`)
      .limit(20);

    if (error) {
      console.error('Error fetching profiles:', error);
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  };

  const handleSwipe = async (action: 'like' | 'pass') => {
    if (currentIndex >= profiles.length || !user) return;

    const currentProfile = profiles[currentIndex];
    setDirection(action === 'like' ? 'right' : 'left');
    setLastAction({ profile: currentProfile, action });

    // Create match record
    const { error } = await supabase
      .from('matches')
      .insert({
        user_id: user.id,
        matched_user_id: currentProfile.user_id,
        status: action === 'like' ? 'pending' : 'rejected'
      });

    if (error) {
      console.error('Error creating match:', error);
    }

    // Check for mutual match
    if (action === 'like') {
      const { data: mutualMatch } = await supabase
        .from('matches')
        .select('*')
        .eq('user_id', currentProfile.user_id)
        .eq('matched_user_id', user.id)
        .eq('status', 'pending')
        .single();

      if (mutualMatch) {
        // Update both to accepted
        await supabase
          .from('matches')
          .update({ status: 'accepted' })
          .or(`and(user_id.eq.${user.id},matched_user_id.eq.${currentProfile.user_id}),and(user_id.eq.${currentProfile.user_id},matched_user_id.eq.${user.id})`);

        toast({
          title: "It's a Match! 🎉",
          description: `You and ${currentProfile.full_name} liked each other!`,
        });
      }
    }

    setTimeout(() => {
      setDirection(null);
      setCurrentIndex(prev => prev + 1);
    }, 300);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 100;
    if (info.offset.x > swipeThreshold) {
      handleSwipe('like');
    } else if (info.offset.x < -swipeThreshold) {
      handleSwipe('pass');
    }
  };

  const handleUndo = async () => {
    if (!lastAction || !user) return;

    await supabase
      .from('matches')
      .delete()
      .eq('user_id', user.id)
      .eq('matched_user_id', lastAction.profile.user_id);

    setCurrentIndex(prev => prev - 1);
    setLastAction(null);
    toast({ title: 'Undone', description: 'Previous action has been reversed.' });
  };

  const currentProfile = profiles[currentIndex];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] px-4">
        <Users className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No more profiles</h2>
        <p className="text-muted-foreground text-center mb-6">
          Check back later for new people to connect with!
        </p>
        <Button onClick={fetchProfiles}>Refresh</Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-20 lg:pb-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Find Connections</h1>

      <div className="relative h-[500px] mb-6">
        <AnimatePresence>
          {profiles.slice(currentIndex, currentIndex + 3).map((profile, index) => (
            <motion.div
              key={profile.id}
              className="absolute inset-0"
              style={{
                zIndex: profiles.length - currentIndex - index,
                scale: 1 - index * 0.05,
                y: index * 10,
              }}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ 
                scale: 1 - index * 0.05, 
                opacity: index === 0 ? 1 : 0.5,
                x: index === 0 && direction === 'right' ? 500 : index === 0 && direction === 'left' ? -500 : 0,
                rotate: index === 0 && direction === 'right' ? 20 : index === 0 && direction === 'left' ? -20 : 0,
              }}
              exit={{ 
                x: direction === 'right' ? 500 : -500,
                rotate: direction === 'right' ? 20 : -20,
                opacity: 0 
              }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              drag={index === 0 ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={index === 0 ? handleDragEnd : undefined}
            >
              <Card className="h-full overflow-hidden cursor-grab active:cursor-grabbing">
                <div className="relative h-2/3 bg-gradient-to-br from-primary/20 to-sky/20">
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Avatar className="h-32 w-32">
                        <AvatarFallback className="text-4xl">
                          {profile.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                  
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {/* Profile info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h2 className="text-2xl font-bold">{profile.full_name}</h2>
                    <p className="text-sm opacity-90">
                      {profile.title || 'Member'} {profile.university && `at ${profile.university}`}
                    </p>
                  </div>
                </div>
                
                <CardContent className="h-1/3 p-4">
                  {profile.bio && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {profile.bio}
                    </p>
                  )}
                  
                  {profile.expertise && profile.expertise.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {profile.expertise.slice(0, 4).map((skill, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {profile.expertise.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{profile.expertise.length - 4}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full border-2"
          onClick={handleUndo}
          disabled={!lastAction}
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="h-16 w-16 rounded-full border-2 border-coral hover:bg-coral hover:text-white transition-colors"
          onClick={() => handleSwipe('pass')}
        >
          <X className="h-8 w-8" />
        </Button>
        
        <Button
          size="icon"
          className="h-16 w-16 rounded-full bg-mint hover:bg-mint/90"
          onClick={() => handleSwipe('like')}
        >
          <Heart className="h-8 w-8" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full border-2 border-sky hover:bg-sky hover:text-white transition-colors"
          onClick={() => handleSwipe('like')}
        >
          <Star className="h-5 w-5" />
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-4">
        Swipe right to connect, left to pass
      </p>
    </div>
  );
};

export default Match;
