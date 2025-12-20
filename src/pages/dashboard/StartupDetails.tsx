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
  Rocket, 
  Users, 
  TrendingUp,
  ExternalLink,
  ArrowLeft,
  Edit,
  Video,
  Eye,
  Heart,
  UserPlus,
  UserCheck,
  Globe,
  Building2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

interface Startup {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  industry: string | null;
  stage: string | null;
  funding_goal: number | null;
  funding_raised: number | null;
  team_size: number;
  looking_for: string[] | null;
  founder_id: string;
  created_at: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  profile: {
    full_name: string;
    avatar_url: string | null;
    title: string | null;
  } | null;
}

interface VideoPitch {
  id: string;
  title: string;
  thumbnail_url: string | null;
  views_count: number;
  likes_count: number;
  created_at: string;
}

const stages = [
  { value: 'idea', label: 'Idea Stage' },
  { value: 'mvp', label: 'MVP' },
  { value: 'early', label: 'Early Traction' },
  { value: 'growth', label: 'Growth' },
  { value: 'scaling', label: 'Scaling' }
];

const StartupDetails = () => {
  const { startupId } = useParams<{ startupId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [startup, setStartup] = useState<Startup | null>(null);
  const [founder, setFounder] = useState<{ full_name: string; avatar_url: string | null; user_id: string } | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pitches, setPitches] = useState<VideoPitch[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const isOwner = user?.id === startup?.founder_id;

  useEffect(() => {
    if (startupId) {
      fetchStartupData();
    }
  }, [startupId, user?.id]);

  const fetchStartupData = async () => {
    setLoading(true);
    try {
      // Fetch startup
      const { data: startupData, error } = await supabase
        .from('startups')
        .select('*')
        .eq('id', startupId)
        .single();

      if (error || !startupData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setStartup(startupData);

      // Fetch founder profile
      const { data: founderData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, user_id')
        .eq('user_id', startupData.founder_id)
        .single();

      if (founderData) {
        setFounder(founderData);
      }

      // Fetch team members
      const { data: teamData } = await supabase
        .from('startup_team_members')
        .select('id, user_id, role')
        .eq('startup_id', startupId);

      if (teamData && teamData.length > 0) {
        const membersWithProfiles = await Promise.all(
          teamData.map(async (member) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url, title')
              .eq('user_id', member.user_id)
              .single();
            return { ...member, profile };
          })
        );
        setTeamMembers(membersWithProfiles);
      }

      // Fetch startup pitches
      const { data: pitchData } = await supabase
        .from('video_pitches')
        .select('id, title, thumbnail_url, views_count, likes_count, created_at')
        .eq('startup_id', startupId)
        .order('created_at', { ascending: false });

      if (pitchData) {
        setPitches(pitchData);
      }

      // Fetch followers count
      const { count } = await supabase
        .from('startup_follows')
        .select('*', { count: 'exact', head: true })
        .eq('startup_id', startupId);

      setFollowersCount(count || 0);

      // Check if current user follows
      if (user) {
        const { data: followData } = await supabase
          .from('startup_follows')
          .select('id')
          .eq('startup_id', startupId)
          .eq('user_id', user.id)
          .maybeSingle();

        setIsFollowing(!!followData);
      }
    } catch (error) {
      console.error('Error fetching startup:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast({ title: 'Please log in to follow startups', variant: 'destructive' });
      return;
    }

    setFollowLoading(true);

    if (isFollowing) {
      const { error } = await supabase
        .from('startup_follows')
        .delete()
        .eq('startup_id', startupId)
        .eq('user_id', user.id);

      if (!error) {
        setIsFollowing(false);
        setFollowersCount((c) => c - 1);
        toast({ title: 'Unfollowed startup' });
      }
    } else {
      const { error } = await supabase
        .from('startup_follows')
        .insert({ startup_id: startupId, user_id: user.id });

      if (!error) {
        setIsFollowing(true);
        setFollowersCount((c) => c + 1);
        toast({ title: 'Following startup!' });
      }
    }

    setFollowLoading(false);
  };

  const handlePitchClick = (pitchId: string) => {
    navigate(`/dashboard/pitches?video=${pitchId}`);
  };

  const getStageColor = (stage: string | null) => {
    switch (stage) {
      case 'idea': return 'bg-muted';
      case 'mvp': return 'bg-sky/20 text-sky';
      case 'early': return 'bg-mint/20 text-mint';
      case 'growth': return 'bg-pink/20 text-pink';
      case 'scaling': return 'bg-primary/20 text-primary';
      default: return 'bg-muted';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !startup) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Startup Not Found</h2>
        <p className="text-muted-foreground mb-4">This startup doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/dashboard/startups')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Startups
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
        onClick={() => navigate('/dashboard/startups')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Startups
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Startup Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-sky/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                {startup.logo_url ? (
                  <img src={startup.logo_url} alt={startup.name} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <Rocket className="h-10 w-10 text-primary" />
                )}
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold">{startup.name}</h1>
                  {startup.stage && (
                    <Badge className={getStageColor(startup.stage)}>
                      {stages.find(s => s.value === startup.stage)?.label || startup.stage}
                    </Badge>
                  )}
                </div>

                {startup.tagline && (
                  <p className="text-muted-foreground mb-3">{startup.tagline}</p>
                )}

                {startup.industry && (
                  <Badge variant="outline" className="mb-3">{startup.industry}</Badge>
                )}

                {startup.description && (
                  <p className="text-sm text-muted-foreground mb-4 max-w-lg">
                    {startup.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4 justify-center sm:justify-start">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {startup.team_size} member{startup.team_size !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <UserPlus className="h-4 w-4" />
                    {followersCount} follower{followersCount !== 1 ? 's' : ''}
                  </span>
                  {startup.funding_goal && (
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      Goal: ${startup.funding_goal.toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="flex gap-2 justify-center sm:justify-start flex-wrap">
                  {isOwner ? (
                    <Button onClick={() => navigate('/dashboard/startups')}>
                      <Edit className="h-4 w-4 mr-2" />
                      Manage Startup
                    </Button>
                  ) : (
                    <Button 
                      variant={isFollowing ? "outline" : "default"}
                      onClick={handleFollow}
                      disabled={followLoading}
                    >
                      {followLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : isFollowing ? (
                        <UserCheck className="h-4 w-4 mr-2" />
                      ) : (
                        <UserPlus className="h-4 w-4 mr-2" />
                      )}
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                  )}
                  {startup.website && (
                    <Button 
                      variant="outline"
                      onClick={() => window.open(startup.website!, '_blank')}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Website
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Founder Card */}
        {founder && (
          <Card className="mb-6">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground mb-3">Founded by</p>
              <div 
                className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                onClick={() => navigate(`/dashboard/profile/${founder.user_id}`)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={founder.avatar_url || ''} />
                  <AvatarFallback>{founder.full_name?.charAt(0) || 'F'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{founder.full_name}</p>
                  <p className="text-sm text-muted-foreground">Founder</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Tabs */}
        <Tabs defaultValue="pitches">
          <TabsList className="w-full">
            <TabsTrigger value="pitches" className="flex-1">
              <Video className="h-4 w-4 mr-2" />
              Pitches ({pitches.length})
            </TabsTrigger>
            <TabsTrigger value="team" className="flex-1">
              <Users className="h-4 w-4 mr-2" />
              Team ({teamMembers.length + 1})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pitches" className="mt-4">
            {pitches.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-semibold mb-2">No pitches yet</h3>
                  <p className="text-sm text-muted-foreground">
                    This startup hasn't uploaded any pitches yet.
                  </p>
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
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="team" className="mt-4">
            <div className="space-y-3">
              {/* Founder */}
              {founder && (
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/dashboard/profile/${founder.user_id}`)}
                >
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={founder.avatar_url || ''} />
                        <AvatarFallback>{founder.full_name?.charAt(0) || 'F'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{founder.full_name}</p>
                        <p className="text-sm text-muted-foreground">Founder</p>
                      </div>
                      <Badge variant="secondary">Founder</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Team Members */}
              {teamMembers.map((member) => (
                <Card 
                  key={member.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/dashboard/profile/${member.user_id}`)}
                >
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.profile?.avatar_url || ''} />
                        <AvatarFallback>{member.profile?.full_name?.charAt(0) || 'T'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{member.profile?.full_name || 'Team Member'}</p>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default StartupDetails;