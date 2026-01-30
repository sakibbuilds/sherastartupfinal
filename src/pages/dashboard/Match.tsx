import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Heart, X, Star, RotateCcw, Loader2, Users, Search, UserPlus, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation, useNavigate } from 'react-router-dom';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  university: string | null;
  title: string | null;
  expertise: string[] | null;
  verified?: boolean;
}

const Match = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('find');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [connections, setConnections] = useState<Profile[]>([]);
  const [requests, setRequests] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [lastAction, setLastAction] = useState<{ profile: Profile; action: 'like' | 'pass' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (location.pathname.includes('/connections')) setActiveTab('connections');
    else if (location.pathname.includes('/requests')) setActiveTab('requests');
    else setActiveTab('find');
  }, [location.pathname]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    if (activeTab === 'find') await fetchProfiles();
    else if (activeTab === 'connections') await fetchConnections();
    else if (activeTab === 'requests') await fetchRequests();
    setLoading(false);
  };

  const fetchProfiles = async () => {
    if (!user) return;

    // Get profiles that haven't been matched yet
    const { data: existingMatches } = await supabase
      .from('matches')
      .select('matched_user_id')
      .eq('user_id', user.id);

    const matchedUserIds = existingMatches?.map(m => m.matched_user_id) || [];
    matchedUserIds.push(user.id); // Exclude self

    // For now, fetch all users except current user
    const { data } = await supabase
      .from('profiles')
      .select('id, user_id, full_name, avatar_url, title, bio, university, expertise, verified')
      .not('user_id', 'in', `(${matchedUserIds.join(',')})`)
      .limit(20);

    if (data) {
      setProfiles(data || []);
    } else {
       console.error('Error fetching profiles');
    }
  };

  const fetchConnections = async () => {
    if (!user) return;

    // Fetch accepted matches
    const { data: matches } = await supabase
      .from('matches')
      .select('user_id, matched_user_id')
      .eq('status', 'accepted')
      .or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`);

    if (matches) {
      const connectionIds = matches.map(m => 
        m.user_id === user.id ? m.matched_user_id : m.user_id
      );

      if (connectionIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, user_id, full_name, avatar_url, title, bio, university, expertise, verified')
          .in('user_id', connectionIds);
        
        setConnections(profiles || []);
      } else {
        setConnections([]);
      }
    }
  };

  const fetchRequests = async () => {
    if (!user) return;

    // Fetch pending requests sent TO me
    const { data: matches } = await supabase
      .from('matches')
      .select('user_id')
      .eq('status', 'pending')
      .eq('matched_user_id', user.id);

    if (matches && matches.length > 0) {
      const requesterIds = matches.map(m => m.user_id);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, avatar_url, title, bio, university, expertise, verified')
        .in('user_id', requesterIds);
      
      setRequests(profiles || []);
    } else {
      setRequests([]);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'find') navigate('/dashboard/network');
    else if (value === 'connections') navigate('/dashboard/network/connections');
    else if (value === 'requests') navigate('/dashboard/network/requests');
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

    // Send notification when swiping right (like)
    if (action === 'like') {
      // Send connection request notification
      await supabase
        .from('notifications')
        .insert({
          user_id: currentProfile.user_id,
          type: 'connection_request',
          title: 'New Connection Request',
          message: `${user.user_metadata?.full_name || 'Someone'} wants to connect with you.`,
          reference_id: user.id,
          reference_type: 'profile'
        });

      // Check for mutual match
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
      } else {
        toast({
          description: `Connection request sent to ${currentProfile.full_name}!`,
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

  const handleAcceptRequest = async (requesterId: string) => {
    if (!user) return;
    
    // Update status to accepted
    const { error } = await supabase
      .from('matches')
      .update({ status: 'accepted' })
      .eq('user_id', requesterId)
      .eq('matched_user_id', user.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to accept request', variant: 'destructive' });
    } else {
      toast({ title: 'Connected!', description: 'You are now connected.' });
      fetchRequests(); // Refresh list
    }
  };

  const handleDeclineRequest = async (requesterId: string) => {
    if (!user) return;
    
    // Update status to rejected
    const { error } = await supabase
      .from('matches')
      .update({ status: 'rejected' })
      .eq('user_id', requesterId)
      .eq('matched_user_id', user.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to decline request', variant: 'destructive' });
    } else {
      toast({ title: 'Declined', description: 'Request declined.' });
      fetchRequests(); // Refresh list
    }
  };

  const currentProfile = profiles[currentIndex];

  // Filter connections by search query
  const filteredConnections = useMemo(() => {
    if (!searchQuery.trim()) return connections;
    const query = searchQuery.toLowerCase();
    return connections.filter(p => 
      p.full_name?.toLowerCase().includes(query) ||
      p.title?.toLowerCase().includes(query) ||
      p.university?.toLowerCase().includes(query)
    );
  }, [connections, searchQuery]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Network</h1>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
          <TabsTrigger value="find">Find Connections</TabsTrigger>
          <TabsTrigger value="connections">My Connections</TabsTrigger>
          <TabsTrigger value="requests">Requests {requests.length > 0 && `(${requests.length})`}</TabsTrigger>
        </TabsList>

        <TabsContent value="find" className="space-y-4">
          {loading ? (
             <div className="flex items-center justify-center h-[60vh]">
               <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : !currentProfile ? (
            <div className="flex flex-col items-center justify-center h-[60vh] px-4">
              <Users className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No more profiles</h2>
              <p className="text-muted-foreground text-center mb-6">
                Check back later for new people to connect with!
              </p>
              <Button onClick={fetchProfiles}>Refresh</Button>
            </div>
          ) : (
            <div className="max-w-lg mx-auto">
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
                      <Card className="h-full overflow-hidden cursor-grab active:cursor-grabbing glass-card">
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
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          
                          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                            <div className="flex items-center gap-2">
                              <h2 className="text-2xl font-bold">{profile.full_name}</h2>
                              {profile.verified && <VerifiedBadge className="text-white" />}
                            </div>
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
                  className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90"
                  onClick={() => handleSwipe('like')}
                >
                  <Heart className="h-8 w-8" />
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full border-2 border-primary/30 hover:bg-primary hover:text-white transition-colors"
                  onClick={() => handleSwipe('like')}
                >
                  <Star className="h-5 w-5" />
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground mt-4">
                Swipe right to connect, left to pass
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="connections" className="space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search connections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {loading ? (
             <div className="flex items-center justify-center h-[60vh]">
               <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : filteredConnections.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? `No connections found for "${searchQuery}"` : "You haven't made any connections yet."}
              </p>
              {!searchQuery && (
                <Button variant="link" onClick={() => handleTabChange('find')}>
                  Find people to connect with
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredConnections.map((profile) => (
                <Card key={profile.id} className="glass-card hover:bg-white/5 transition-colors">
                  <CardContent className="p-4 flex items-center gap-4">
                     <Avatar className="h-12 w-12 cursor-pointer" onClick={() => navigate(`/dashboard/profile/${profile.user_id}`)}>
                        <AvatarImage src={profile.avatar_url || ''} />
                        <AvatarFallback>{profile.full_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate cursor-pointer hover:underline" onClick={() => navigate(`/dashboard/profile/${profile.user_id}`)}>
                          {profile.full_name}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">{profile.title}</p>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => navigate('/dashboard/messages')}>
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {loading ? (
             <div className="flex items-center justify-center h-[60vh]">
               <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pending connection requests.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {requests.map((profile) => (
                <Card key={profile.id} className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={profile.avatar_url || ''} />
                        <AvatarFallback>{profile.full_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <h3 className="font-semibold">{profile.full_name}</h3>
                          {profile.verified && <VerifiedBadge />}
                        </div>
                        <p className="text-sm text-muted-foreground">{profile.title}</p>
                        {profile.university && (
                          <p className="text-xs text-muted-foreground mt-1">{profile.university}</p>
                        )}
                        
                        <div className="flex gap-2 mt-4">
                          <Button 
                            className="flex-1 bg-primary hover:bg-primary/90"
                            onClick={() => handleAcceptRequest(profile.user_id)}
                          >
                            Accept
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleDeclineRequest(profile.user_id)}
                          >
                            Ignore
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Match;
