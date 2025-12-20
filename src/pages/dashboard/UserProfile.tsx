import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

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
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pitches, setPitches] = useState<VideoPitch[]>([]);
  const [stats, setStats] = useState<Stats>({ totalPitches: 0, totalViews: 0, totalLikes: 0, totalComments: 0 });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

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
    
    // Check if conversation exists
    const { data: existingParticipations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (existingParticipations) {
      for (const participation of existingParticipations) {
        const { data: otherParticipant } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', participation.conversation_id)
          .eq('user_id', userId)
          .single();

        if (otherParticipant) {
          navigate('/dashboard/messages');
          return;
        }
      }
    }

    // Create new conversation
    const { data: newConversation } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single();

    if (newConversation) {
      await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConversation.id, user_id: user.id },
          { conversation_id: newConversation.id, user_id: userId }
        ]);

      navigate('/dashboard/messages');
    }
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
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <Avatar className="h-28 w-28 border-4 border-background shadow-lg">
                <AvatarImage src={profile.avatar_url || ''} />
                <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                  {profile.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                  {profile.user_type && (
                    <Badge variant="secondary" className="capitalize w-fit mx-auto sm:mx-0">
                      {profile.user_type}
                    </Badge>
                  )}
                </div>

                {profile.title && (
                  <p className="text-muted-foreground flex items-center justify-center sm:justify-start gap-2 mb-1">
                    <Briefcase className="h-4 w-4" />
                    {profile.title}
                  </p>
                )}

                {profile.university && (
                  <p className="text-muted-foreground flex items-center justify-center sm:justify-start gap-2 mb-3">
                    <GraduationCap className="h-4 w-4" />
                    {profile.university}
                  </p>
                )}

                {profile.bio && (
                  <p className="text-sm text-muted-foreground mb-4 max-w-lg">
                    {profile.bio}
                  </p>
                )}

                {profile.expertise && profile.expertise.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-4">
                    {profile.expertise.map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 justify-center sm:justify-start">
                  {isOwnProfile ? (
                    <Button onClick={() => navigate('/dashboard/profile')}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button onClick={handleMessage}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      {profile.linkedin_url && (
                        <Button 
                          variant="outline"
                          onClick={() => window.open(profile.linkedin_url!, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          LinkedIn
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 text-center">
              <Video className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">{stats.totalPitches}</p>
              <p className="text-xs text-muted-foreground">Pitches</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Eye className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">{stats.totalViews}</p>
              <p className="text-xs text-muted-foreground">Views</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Heart className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">{stats.totalLikes}</p>
              <p className="text-xs text-muted-foreground">Likes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <MessageSquare className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
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