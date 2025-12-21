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
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { AvatarWithPresence, OnlineIndicator } from '@/components/common/OnlineIndicator';

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
    }
  }, [userId, user]);

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
    if (!user || !userId) return;

    // Check if conversation exists using a more efficient query
    const { data: myConversations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (myConversations && myConversations.length > 0) {
      const conversationIds = myConversations.map(c => c.conversation_id);
      
      const { data: sharedConversation } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId)
        .in('conversation_id', conversationIds)
        .maybeSingle();

      if (sharedConversation) {
        navigate(`/dashboard/messages?conversationId=${sharedConversation.conversation_id}`);
        return;
      }
    }

    // Create new conversation with client-side UUID to bypass RLS select restriction
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

    navigate(`/dashboard/messages?conversationId=${newConversationId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
    <div className="max-w-4xl mx-auto px-4 py-6 pb-20 lg:pb-6">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-4"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Profile Header */}
        <Card className="mb-6 overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <AvatarWithPresence userId={profile.user_id} indicatorSize="lg">
                <Avatar className="h-24 w-24 sm:h-32 sm:w-32 shadow-md">
                  <AvatarImage src={profile.avatar_url || ''} />
                  <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                    {profile.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </AvatarWithPresence>

              <div className="flex-1 w-full text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl sm:text-3xl font-bold">{profile.full_name}</h1>
                      <OnlineIndicator userId={profile.user_id} size="lg" />
                    </div>
                    {profile.university && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <GraduationCap className="h-4 w-4" />
                        <span className="text-sm font-medium">{profile.university}</span>
                      </div>
                    )}
                  </div>
                  
                  {profile.user_type && (
                    <Badge variant="secondary" className="capitalize w-fit px-3 py-1">
                      {profile.user_type}
                    </Badge>
                  )}
                </div>

                {startup && (
                  <div 
                    className="flex items-center gap-2 mb-3 cursor-pointer hover:opacity-80 transition-opacity w-fit"
                    onClick={() => navigate(`/dashboard/startups/${startup.id}`)}
                  >
                    <Badge variant="outline" className="text-primary border-primary">
                      {startup.name}
                    </Badge>
                    {startup.industry && (
                      <span className="text-sm text-muted-foreground">• {startup.industry}</span>
                    )}
                  </div>
                )}

                {profile.title && (
                  <p className="text-muted-foreground flex items-center gap-2 mb-3">
                    <Briefcase className="h-4 w-4" />
                    {profile.title}
                  </p>
                )}

                {profile.bio && (
                  <p className="text-sm text-muted-foreground mb-6 max-w-2xl leading-relaxed">
                    {profile.bio}
                  </p>
                )}

                {profile.expertise && profile.expertise.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {profile.expertise.map((skill) => (
                      <Badge key={skill} variant="secondary" className="bg-secondary/50 hover:bg-secondary/70">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {isOwnProfile ? (
                    <Button onClick={() => navigate('/dashboard/profile')}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      {isConnected ? (
                        <Button variant="secondary" disabled>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Connected
                        </Button>
                      ) : isRequestSent ? (
                        <Button variant="secondary" disabled>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Request Sent
                        </Button>
                      ) : hasIncomingRequest ? (
                        <Button 
                          variant="default" 
                          onClick={handleAcceptConnection}
                          disabled={connectionLoading}
                        >
                          {connectionLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <UserCheck className="h-4 w-4 mr-2" />
                          )}
                          Accept Request
                        </Button>
                      ) : (
                        <Button 
                          variant="outline"
                          onClick={handleConnect}
                          disabled={connectionLoading}
                        >
                          {connectionLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <UserPlus className="h-4 w-4 mr-2" />
                          )}
                          Connect
                        </Button>
                      )}
                      <Button onClick={handleMessage}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      {profile.linkedin_url && (
                        <Button 
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(profile.linkedin_url!, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mutual Connections Section - Only show for other users */}
        {!isOwnProfile && mutualConnections.length > 0 && (
          <Card className="mb-6 bg-gradient-to-br from-secondary/30 to-secondary/10 border-secondary/30">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">{mutualConnections.length} mutual connection{mutualConnections.length > 1 ? 's' : ''}</span>
                </div>
                <div className="flex -space-x-2">
                  {mutualConnections.slice(0, 5).map((connection) => (
                    <Avatar 
                      key={connection.user_id} 
                      className="h-8 w-8 border-2 border-background cursor-pointer hover:z-10 transition-transform hover:scale-110"
                      onClick={() => navigate(`/dashboard/profile/${connection.user_id}`)}
                    >
                      <AvatarImage src={connection.avatar_url || ''} />
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {connection.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {mutualConnections.length > 5 && (
                    <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                      +{mutualConnections.length - 5}
                    </div>
                  )}
                </div>
                <div className="flex-1 text-sm text-muted-foreground truncate">
                  {mutualConnections.slice(0, 2).map(c => c.full_name).join(', ')}
                  {mutualConnections.length > 2 && ` and ${mutualConnections.length - 2} others`}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-4 pb-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                <Video className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl font-bold">{stats.totalPitches}</p>
              <p className="text-xs text-muted-foreground">Pitches</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-sky/5 to-sky/10 border-sky/20">
            <CardContent className="pt-4 pb-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-sky/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-sky" />
              </div>
              <p className="text-2xl font-bold">{stats.totalViews}</p>
              <p className="text-xs text-muted-foreground">Views</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-coral/5 to-coral/10 border-coral/20">
            <CardContent className="pt-4 pb-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-coral/10 flex items-center justify-center">
                <Heart className="h-5 w-5 text-coral" />
              </div>
              <p className="text-2xl font-bold">{stats.totalLikes}</p>
              <p className="text-xs text-muted-foreground">Likes</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-mint/5 to-mint/10 border-mint/20">
            <CardContent className="pt-4 pb-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-mint/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-mint" />
              </div>
              <p className="text-2xl font-bold">{stats.totalComments}</p>
              <p className="text-xs text-muted-foreground">Comments</p>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="pitches">
          <TabsList className="w-full">
            <TabsTrigger value="pitches" className="flex-1">
              <Video className="h-4 w-4 mr-2" />
              Pitches ({pitches.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pitches" className="mt-4">
            {pitches.length === 0 ? (
              <Card>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {pitches.map((pitch) => (
                  <motion.div
                    key={pitch.id}
                    className="cursor-pointer group"
                    onClick={() => handlePitchClick(pitch.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="relative aspect-[9/16] bg-muted rounded-lg overflow-hidden">
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-white text-sm font-medium line-clamp-2 mb-2">
                            {pitch.title}
                          </p>
                          <div className="flex items-center gap-3 text-white/80 text-xs">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {pitch.views_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {pitch.likes_count || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Motive badge */}
                      {pitch.motive && (
                        <Badge 
                          className="absolute top-2 left-2 capitalize text-xs"
                          variant="secondary"
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
        </Tabs>
      </motion.div>
    </div>
  );
};

export default UserProfilePage;