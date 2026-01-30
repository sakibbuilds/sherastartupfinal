import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostCard, Post } from '@/components/dashboard/PostCard';
import { 
  Loader2, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Video, 
  Heart, 
  Eye, 
  MessageSquare,
  ArrowLeft,
  Edit,
  ExternalLink,
  UserPlus,
  UserCheck,
  Users,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { AvatarWithPresence, OnlineIndicator } from '@/components/common/OnlineIndicator';

import { VerifiedBadge } from '@/components/common/VerifiedBadge';
import { ProfileSkeleton } from '@/components/skeletons';
interface MutualConnection {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  university: string | null;
  title: string | null;
  expertise: string[] | null;
  linkedin_url: string | null;
  user_type: string | null;
  created_at: string;
  verified?: boolean;
}

interface Startup {
  id: string;
  name: string;
  tagline: string | null;
  industry: string | null;
}

interface VideoPitch {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  video_url: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  motive: string | null;
  created_at: string;
}

interface Stats {
  totalPitches: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
}

const UserProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [startup, setStartup] = useState<Startup | null>(null);
  const [pitches, setPitches] = useState<VideoPitch[]>([]);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<Stats>({ totalPitches: 0, totalViews: 0, totalLikes: 0, totalComments: 0 });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [hasIncomingRequest, setHasIncomingRequest] = useState(false);
  const [connectionLoading, setConnectionLoading] = useState(false);
  const [mutualConnections, setMutualConnections] = useState<MutualConnection[]>([]);

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (userId) {
      fetchUserData();
      if (user && userId !== user.id) {
        checkConnection();
        fetchMutualConnections();
      }
      if (user) {
        fetchUserLikes();
      }
    }
  }, [userId, user]);

  const fetchUserLikes = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', user.id);

    if (data) {
      setLikedPosts(new Set(data.map(like => like.post_id)));
    }
  };

  const handlePostLike = async (postId: string, isLiked: boolean) => {
    if (!user) return;

    // Optimistic update
    const newLikedPosts = new Set(likedPosts);
    if (isLiked) {
      newLikedPosts.delete(postId);
    } else {
      newLikedPosts.add(postId);
    }
    setLikedPosts(newLikedPosts);

    setUserPosts(userPosts.map(post => 
      post.id === postId 
        ? { ...post, likes_count: post.likes_count + (isLiked ? -1 : 1) }
        : post
    ));

    if (isLiked) {
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('post_likes')
        .insert({ post_id: postId, user_id: user.id });
    }
  };

  const handleDeletePost = async (postId: string) => {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete post', variant: 'destructive' });
    } else {
      setUserPosts(userPosts.filter(p => p.id !== postId));
      toast({ title: 'Deleted', description: 'Post has been removed.' });
    }
  };

  const checkConnection = async () => {
    if (!user || !userId) return;
    
    // Reset states
    setIsConnected(false);
    setIsRequestSent(false);
    setHasIncomingRequest(false);

    // Check for accepted connection
    const { data: acceptedMatch } = await supabase
      .from('matches')
      .select('id, status')
      .or(`and(user_id.eq.${user.id},matched_user_id.eq.${userId}),and(user_id.eq.${userId},matched_user_id.eq.${user.id})`)
      .eq('status', 'accepted')
      .maybeSingle();
    
    if (acceptedMatch) {
      setIsConnected(true);
      return;
    }

    // Check for pending request sent by current user
    const { data: sentRequest } = await supabase
      .from('matches')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('matched_user_id', userId)
      .eq('status', 'pending')
      .maybeSingle();

    if (sentRequest) {
      setIsRequestSent(true);
      return;
    }

    // Check for pending request received from other user
    const { data: receivedRequest } = await supabase
      .from('matches')
      .select('id, status')
      .eq('user_id', userId)
      .eq('matched_user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (receivedRequest) {
      setHasIncomingRequest(true);
    }
  };

  const fetchMutualConnections = async () => {
    if (!user || !userId) return;

    // Get current user's connections
    const { data: myConnections } = await supabase
      .from('matches')
      .select('user_id, matched_user_id')
      .or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`)
      .eq('status', 'accepted');

    // Get target user's connections
    const { data: theirConnections } = await supabase
      .from('matches')
      .select('user_id, matched_user_id')
      .or(`user_id.eq.${userId},matched_user_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (!myConnections || !theirConnections) return;

    // Extract connection user IDs
    const myConnectionIds = new Set(
      myConnections.flatMap(c => [c.user_id, c.matched_user_id]).filter(id => id !== user.id)
    );
    const theirConnectionIds = new Set(
      theirConnections.flatMap(c => [c.user_id, c.matched_user_id]).filter(id => id !== userId)
    );

    // Find mutual connections
    const mutualIds = [...myConnectionIds].filter(id => theirConnectionIds.has(id));

    if (mutualIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', mutualIds);

      if (profiles) {
        setMutualConnections(profiles);
      }
    }
  };

  const handleConnect = async () => {
    if (!user || !userId) return;
    
    setConnectionLoading(true);
    try {
      // Check if match already exists
      const { data: existingMatch } = await supabase
        .from('matches')
        .select('id, status')
        .or(`and(user_id.eq.${user.id},matched_user_id.eq.${userId}),and(user_id.eq.${userId},matched_user_id.eq.${user.id})`)
        .maybeSingle();

      if (existingMatch) {
        if (existingMatch.status === 'accepted') {
          setIsConnected(true);
          toast({ title: "Info", description: "You are already connected." });
          return;
        }
        if (existingMatch.status === 'pending') {
          setIsRequestSent(true);
          toast({ title: "Info", description: "Connection request already sent." });
          return;
        }
        // If rejected, we inform the user they cannot reconnect (due to RLS limitations)
        if (existingMatch.status === 'rejected') {
          toast({ 
            title: "Cannot Connect", 
            description: "Connection request was previously rejected.",
            variant: "destructive" 
          });
          return;
        }
      }

      // Create match request
      const { error: matchError } = await supabase
        .from('matches')
        .insert({
          user_id: user.id,
          matched_user_id: userId,
          status: 'pending'
        });

      if (matchError) {
        // Handle unique constraint violation (race condition)
        if (matchError.code === '23505') {
           setIsRequestSent(true);
           toast({ title: "Info", description: "Connection request already sent." });
           return;
        }

        console.error('Error sending connection request:', matchError);
        toast({
          title: "Error",
          description: `Failed to send connection request: ${matchError.message}`,
          variant: "destructive",
        });
        return;
      }

      // Create notification for the other user
      if (profile) {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'connection_request',
            title: 'New Connection Request',
            message: `${user.user_metadata.full_name || 'Someone'} wants to connect with you.`,
            reference_id: user.id,
            reference_type: 'profile'
          });

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
        }
      }
      
      setIsRequestSent(true);
      toast({
        title: "Success",
        description: "Connection request sent!",
      });
    } catch (error) {
      console.error('Error connecting:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setConnectionLoading(false);
    }
  };

  const handleAcceptConnection = async () => {
    if (!user || !userId) return;
    
    setConnectionLoading(true);
    try {
      // Find the pending match request
      const { data: matchRequest, error: fetchError } = await supabase
        .from('matches')
        .select('id')
        .eq('user_id', userId)
        .eq('matched_user_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (fetchError) {
        console.error('Error finding connection request:', fetchError);
        return;
      }

      if (matchRequest) {
        // Update status to accepted
        const { error: updateError } = await supabase
          .from('matches')
          .update({ status: 'accepted' })
          .eq('id', matchRequest.id);

        if (updateError) {
          console.error('Error accepting connection:', updateError);
          toast({
            title: "Error",
            description: "Failed to accept connection request.",
            variant: "destructive",
          });
          return;
        }

        // Notify the requester
        if (profile) {
           await supabase
            .from('notifications')
            .insert({
              user_id: userId,
              type: 'connection_accepted',
              title: 'Connection Accepted',
              message: `${user.user_metadata.full_name || 'Someone'} accepted your connection request.`,
              reference_id: user.id,
              reference_type: 'profile'
            });
        }

        setIsConnected(true);
        setHasIncomingRequest(false);
        toast({
          title: "Success",
          description: "Connection request accepted!",
        });
      }
    } catch (error) {
      console.error('Error accepting connection:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setConnectionLoading(false);
    }
  };

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError || !profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Fetch user's startup
      const { data: startupData } = await supabase
        .from('startups')
        .select('id, name, tagline, industry')
        .eq('founder_id', userId)
        .maybeSingle();

      if (startupData) {
        setStartup(startupData);
      }

      // Fetch pitches
      const { data: pitchesData } = await supabase
        .from('video_pitches')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (pitchesData) {
        setPitches(pitchesData);
        
        // Calculate stats
        const totalViews = pitchesData.reduce((sum, p) => sum + (p.views_count || 0), 0);
        const totalLikes = pitchesData.reduce((sum, p) => sum + (p.likes_count || 0), 0);
        const totalComments = pitchesData.reduce((sum, p) => sum + (p.comments_count || 0), 0);
        
        setStats({
          totalPitches: pitchesData.length,
          totalViews,
          totalLikes,
          totalComments
        });
      }

      // Fetch user posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*, comments(count)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error fetching user posts:', postsError);
      } else {
        // Since we already have the profile data, we can just map it
        // But for safety and consistency with PostCard type, let's structure it correctly
        const postsWithProfiles = (postsData || []).map(post => {
           const commentsCount = post.comments ? post.comments[0]?.count : 0;
           return {
            ...post,
            comments_count: commentsCount,
            likes_count: 0,
            profiles: {
              full_name: profileData.full_name,
              avatar_url: profileData.avatar_url,
              title: profileData.title
            },
            startup: startupData ? { id: startupData.id, name: startupData.name } : null
          };
        });
        setUserPosts(postsWithProfiles as Post[]);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePitchClick = (pitchId: string) => {
    navigate(`/dashboard/pitches?video=${pitchId}`);
  };

  const handleMessage = async () => {
    if (!user || !userId || !profile) return;

    // STEP 1: Check if conversation already exists between these two users
    // First get all conversations the current user is in
    const { data: myConversations, error: myConvError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (myConvError) {
      console.error('Error fetching my conversations:', myConvError);
    }

    if (myConversations && myConversations.length > 0) {
      const conversationIds = myConversations.map(c => c.conversation_id);
      
      // Find any conversation where the target user is also a participant
      // Use .limit(1) instead of .maybeSingle() to avoid errors with multiple matches
      const { data: sharedConversations, error: sharedError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId)
        .in('conversation_id', conversationIds)
        .limit(1);

      if (sharedError) {
        console.error('Error checking shared conversations:', sharedError);
      }

      // If we found an existing conversation, navigate to it
      if (sharedConversations && sharedConversations.length > 0) {
        navigate(`/dashboard/messages?conversationId=${sharedConversations[0].conversation_id}`);
        return;
      }
    }

    // STEP 2: No existing conversation found, create a new one
    const newConversationId = crypto.randomUUID();
    
    const { error: createError } = await supabase
      .from('conversations')
      .insert({ id: newConversationId });

    if (createError) {
      console.error('Error creating conversation:', createError);
      toast({
        title: "Error",
        description: "Failed to create conversation.",
        variant: "destructive",
      });
      return;
    }

    // Add participants
    const { error: participantError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: newConversationId, user_id: user.id },
        { conversation_id: newConversationId, user_id: userId }
      ]);

    if (participantError) {
      console.error('Error adding participants:', participantError);
      toast({
        title: "Error",
        description: "Failed to add participants.",
        variant: "destructive",
      });
      return;
    }

    // Navigate with profile fallback for immediate display
    navigate(`/dashboard/messages?conversationId=${newConversationId}`, {
      state: {
        fallbackProfile: {
          user_id: userId,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url
        }
      }
    });
  };

  const isVerified = (p: Profile) => {
    return p.verified === true;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 pb-20 lg:pb-10">
        <ProfileSkeleton />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
        <p className="text-muted-foreground mb-4">This profile doesn't exist or has been removed.</p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-20 lg:pb-10 space-y-6">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => navigate(-1)}
        className="hover:bg-white/5"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Top Section: Header & Intro */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Profile Header - Spans 8 cols */}
          <Card className="lg:col-span-8 glass-card overflow-hidden border-0 relative flex flex-col">
            {/* Cover Image */}
            <div className="h-28 sm:h-48 bg-gradient-to-r from-primary/20 via-purple-500/10 to-blue-500/20 relative">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=400&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay" />
            </div>
            
            <CardContent className="px-4 sm:px-8 pb-6 sm:pb-8 pt-0 relative flex-1">
              {/* Avatar - Overlapping */}
              <div className="-mt-12 sm:-mt-16 mb-3 sm:mb-4 flex justify-between items-end">
                <AvatarWithPresence userId={profile.user_id} indicatorSize="lg">
                  <Avatar className="h-20 w-20 sm:h-32 sm:w-32 border-4 border-black shadow-xl">
                    <AvatarImage src={profile.avatar_url || ''} />
                    <AvatarFallback className="text-xl sm:text-3xl bg-primary text-primary-foreground">
                      {profile.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </AvatarWithPresence>

                {/* Desktop Action Buttons */}
                <div className="hidden sm:flex gap-3 mb-2">
                  {isOwnProfile ? (
                    <Button onClick={() => navigate('/dashboard/profile')} className="rounded-full">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="default"
                        className="rounded-full bg-primary hover:bg-primary/90"
                        onClick={handleMessage}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      {isConnected ? (
                        <Button variant="secondary" disabled className="rounded-full">
                          <UserCheck className="h-4 w-4 mr-2" />
                          Connected
                        </Button>
                      ) : isRequestSent ? (
                        <Button variant="secondary" disabled className="rounded-full">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Sent
                        </Button>
                      ) : hasIncomingRequest ? (
                        <Button 
                          variant="outline" 
                          onClick={handleAcceptConnection}
                          disabled={connectionLoading}
                          className="rounded-full"
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Accept
                        </Button>
                      ) : (
                        <Button 
                          variant="outline"
                          onClick={handleConnect}
                          disabled={connectionLoading}
                          className="rounded-full"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Follow
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{profile.full_name}</h1>
                  {isVerified(profile) && (
                    <VerifiedBadge size="md" />
                  )}
                </div>
                
                {profile.title && (
                  <p className="text-sm sm:text-lg text-muted-foreground mb-2">
                    {profile.title}
                    {startup && (
                      <span className="text-primary cursor-pointer hover:underline ml-1" onClick={() => navigate(`/dashboard/startups/${startup.id}`)}>
                         @ {startup.name}
                      </span>
                    )}
                  </p>
                )}
                
                {/* Mobile Action Buttons */}
                <div className="flex sm:hidden gap-2 mt-4 flex-wrap">
                  {isOwnProfile ? (
                    <Button onClick={() => navigate('/dashboard/profile')} size="sm" className="flex-1 rounded-full">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button onClick={handleMessage} size="sm" className="flex-1 min-w-[100px] rounded-full">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      {isConnected ? (
                        <Button variant="secondary" disabled size="sm" className="flex-1 min-w-[100px] rounded-full">
                          <UserCheck className="h-4 w-4 mr-2" />
                          Connected
                        </Button>
                      ) : isRequestSent ? (
                        <Button variant="secondary" disabled size="sm" className="flex-1 min-w-[100px] rounded-full">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Sent
                        </Button>
                      ) : hasIncomingRequest ? (
                        <Button 
                          variant="outline" 
                          onClick={handleAcceptConnection}
                          disabled={connectionLoading}
                          size="sm"
                          className="flex-1 min-w-[100px] rounded-full"
                        >
                          {connectionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                          Accept
                        </Button>
                      ) : (
                        <Button 
                          variant="outline"
                          onClick={handleConnect}
                          disabled={connectionLoading}
                          size="sm"
                          className="flex-1 min-w-[100px] rounded-full"
                        >
                          {connectionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                          Follow
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Intro Card - Spans 4 cols */}
          <Card className="lg:col-span-4 glass-card h-fit">
            <CardContent className="p-6 space-y-6">
              <h3 className="font-semibold text-lg">Intro</h3>
              
              <div className="space-y-4">
                {profile.title && (
                  <div className="flex items-start gap-3 text-sm">
                    <Briefcase className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{profile.title}</p>
                      {startup && <p className="text-muted-foreground text-xs">{startup.name}</p>}
                    </div>
                  </div>
                )}
                
                {profile.university && (
                  <div className="flex items-center gap-3 text-sm">
                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    <span>Went to <span className="font-medium">{profile.university}</span></span>
                  </div>
                )}

                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>Lives in <span className="font-medium">San Francisco, CA</span></span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>Followed by <span className="font-medium">{stats.totalLikes * 12 + 45} people</span></span>
                </div>

                {profile.linkedin_url && (
                  <div className="flex items-center gap-3 text-sm">
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                      LinkedIn Profile
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Section: About */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-8 glass-card">
            <CardContent className="p-8">
              <h3 className="font-semibold text-lg mb-4">About</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line mb-8">
                {profile.bio || "No bio available."}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-medium mb-3 text-sm uppercase tracking-wider text-muted-foreground">Expertise</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.expertise && profile.expertise.length > 0 ? (
                      profile.expertise.map((skill) => (
                        <span key={skill} className="text-sm text-primary hover:underline cursor-pointer">
                          #{skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No expertise listed</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 text-sm uppercase tracking-wider text-muted-foreground">Interests</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-blue-400 hover:underline cursor-pointer">#technology</span>
                    <span className="text-sm text-blue-400 hover:underline cursor-pointer">#startups</span>
                    <span className="text-sm text-blue-400 hover:underline cursor-pointer">#innovation</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section: Feed & Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar (Filters/Stats) - 3 Cols */}
          <div className="lg:col-span-3 space-y-6">
             {/* Stats Card */}
             <Card className="glass-card">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold text-sm">Community Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Video className="w-4 h-4" /> Pitches
                    </span>
                    <span className="font-medium bg-white/5 px-2 py-0.5 rounded-full">{stats.totalPitches}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Eye className="w-4 h-4" /> Views
                    </span>
                    <span className="font-medium bg-white/5 px-2 py-0.5 rounded-full">{stats.totalViews}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Heart className="w-4 h-4" /> Likes
                    </span>
                    <span className="font-medium bg-white/5 px-2 py-0.5 rounded-full">{stats.totalLikes}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mutual Connections */}
            {!isOwnProfile && mutualConnections.length > 0 && (
              <Card className="glass-card">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-3">Mutual Connections</h3>
                  <div className="flex -space-x-2 mb-3">
                    {mutualConnections.slice(0, 5).map((connection) => (
                      <Avatar 
                        key={connection.user_id} 
                        className="h-8 w-8 border-2 border-background cursor-pointer hover:z-10 transition-transform hover:scale-110"
                        onClick={() => navigate(`/dashboard/profile/${connection.user_id}`)}
                      >
                        <AvatarImage src={connection.avatar_url || ''} />
                        <AvatarFallback className="text-xs">
                          {connection.full_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {mutualConnections.length} mutual connection{mutualConnections.length > 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Feed - 9 Cols */}
          <div className="lg:col-span-9">
             <Tabs defaultValue="pitches" className="w-full">
              <TabsList className="w-full justify-start bg-transparent border-b border-white/10 rounded-none h-auto p-0 mb-6 gap-6">
                <TabsTrigger 
                  value="pitches" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-2 font-semibold"
                >
                  Pitches ({pitches.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="posts" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-2 font-semibold"
                >
                  Posts ({userPosts.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="startups" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-2 font-semibold"
                >
                  Startups ({startup ? 1 : 0})
                </TabsTrigger>
                <TabsTrigger 
                  value="about" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-2 font-semibold"
                >
                  More Info
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pitches" className="mt-0">
                {pitches.length === 0 ? (
                  <Card className="glass-card border-dashed">
                    <CardContent className="py-12 text-center">
                      <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="font-semibold mb-2">No pitches yet</h3>
                      <p className="text-sm text-muted-foreground">
                        {isOwnProfile 
                          ? "You haven't uploaded any pitches yet." 
                          : "This user hasn't uploaded any pitches yet."}
                      </p>
                      {isOwnProfile && (
                        <Button 
                          className="mt-4"
                          onClick={() => navigate('/dashboard/pitches/upload')}
                        >
                          Upload Your First Pitch
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pitches.map((pitch) => (
                      <motion.div
                        key={pitch.id}
                        className="cursor-pointer group"
                        onClick={() => handlePitchClick(pitch.id)}
                        whileHover={{ y: -5 }}
                      >
                        <div className="relative aspect-[9/16] bg-muted rounded-xl overflow-hidden shadow-lg border border-white/5">
                          {pitch.thumbnail_url ? (
                            <img
                              src={pitch.thumbnail_url}
                              alt={pitch.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                              <Video className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          
                          {/* Overlay with stats */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                              <p className="text-white font-semibold line-clamp-2 mb-2 leading-tight">
                                {pitch.title}
                              </p>
                              <div className="flex items-center justify-between text-white/80 text-xs">
                                <span className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-full backdrop-blur-md">
                                  <Eye className="h-3 w-3" />
                                  {pitch.views_count || 0}
                                </span>
                                <span className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-full backdrop-blur-md">
                                  <Heart className="h-3 w-3" />
                                  {pitch.likes_count || 0}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Motive badge */}
                          {pitch.motive && (
                            <Badge 
                              className="absolute top-3 right-3 capitalize text-[10px] backdrop-blur-md bg-black/40 border-white/10"
                            >
                              {pitch.motive}
                            </Badge>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="posts" className="mt-0">
                {userPosts.length === 0 ? (
                  <Card className="glass-card border-dashed">
                    <CardContent className="py-12 text-center">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="font-semibold mb-2">No posts yet</h3>
                      <p className="text-sm text-muted-foreground">
                        {isOwnProfile 
                          ? "You haven't posted anything yet." 
                          : "This user hasn't posted anything yet."}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {userPosts.map((post) => (
                      <PostCard 
                        key={post.id}
                        post={post}
                        currentUserId={user?.id}
                        onLike={handlePostLike}
                        onDelete={handleDeletePost}
                        isLiked={likedPosts.has(post.id)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="startups">
                 {startup ? (
                   <Card className="glass-card hover:bg-white/5 transition-colors cursor-pointer" onClick={() => navigate(`/dashboard/startups/${startup.id}`)}>
                     <CardContent className="p-6 flex items-start gap-4">
                       <div className="h-16 w-16 rounded-lg bg-primary/20 flex items-center justify-center">
                         <Briefcase className="h-8 w-8 text-primary" />
                       </div>
                       <div>
                         <h3 className="text-xl font-bold mb-1">{startup.name}</h3>
                         <p className="text-muted-foreground mb-2">{startup.tagline || 'No tagline'}</p>
                         {startup.industry && (
                           <Badge variant="secondary">{startup.industry}</Badge>
                         )}
                       </div>
                     </CardContent>
                   </Card>
                 ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No startup listed.
                    </div>
                 )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UserProfilePage;