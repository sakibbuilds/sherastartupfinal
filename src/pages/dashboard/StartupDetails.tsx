import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  Rocket, 
  Users, 
  ArrowLeft,
  Edit,
  Video,
  Eye,
  Heart,
  UserPlus,
  UserCheck,
  Globe,
  Building2,
  Calendar,
  DollarSign,
  Target,
  Briefcase,
  Camera,
  Save,
  X,
  Linkedin,
  ExternalLink,
  Plus,
  Upload
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { AvatarCropper } from '@/components/common/AvatarCropper';

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
  established_at: string | null;
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

const defaultStages = [
  { value: 'idea', label: 'Idea Stage', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  { value: 'mvp', label: 'MVP', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'early', label: 'Early Traction', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { value: 'growth', label: 'Growth', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { value: 'scaling', label: 'Scaling', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { value: 'profitable', label: 'Profitable', color: 'bg-green-500/20 text-green-400 border-green-500/30' }
];

const defaultIndustries = [
  'Technology', 'Healthcare', 'Fintech', 'E-commerce', 'Education', 
  'SaaS', 'AI/ML', 'Sustainability', 'Consumer', 'B2B', 'Media', 'Gaming',
  'Real Estate', 'Agriculture', 'Transportation', 'Food & Beverage'
];

const lookingForOptions = [
  'Investment', 'Co-Founder', 'Mentorship', 'Employees', 'Advisors', 'Partnerships'
];

const StartupDetails = () => {
  const { startupId } = useParams<{ startupId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [startup, setStartup] = useState<Startup | null>(null);
  const [founder, setFounder] = useState<{ full_name: string; avatar_url: string | null; user_id: string; title: string | null; linkedin_url: string | null } | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pitches, setPitches] = useState<VideoPitch[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  
  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    tagline: '',
    description: '',
    website: '',
    industry: '',
    customIndustry: '',
    stage: '',
    customStage: '',
    funding_goal: '',
    funding_raised: '',
    team_size: '',
    looking_for: [] as string[],
    established_at: ''
  });
  const [showCustomIndustry, setShowCustomIndustry] = useState(false);
  const [showCustomStage, setShowCustomStage] = useState(false);
  
  // Logo upload
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const isOwner = user?.id === startup?.founder_id;

  useEffect(() => {
    if (startupId) {
      fetchStartupData();
    }
  }, [startupId, user?.id]);

  const fetchStartupData = async () => {
    setLoading(true);
    try {
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

      setStartup(startupData as Startup);
      
      // Check if industry/stage are custom values
      const isCustomIndustry = startupData.industry && !defaultIndustries.includes(startupData.industry);
      const isCustomStage = startupData.stage && !defaultStages.find(s => s.value === startupData.stage);
      
      setShowCustomIndustry(isCustomIndustry);
      setShowCustomStage(isCustomStage);
      
      setEditForm({
        name: startupData.name || '',
        tagline: startupData.tagline || '',
        description: startupData.description || '',
        website: startupData.website || '',
        industry: isCustomIndustry ? 'custom' : (startupData.industry || ''),
        customIndustry: isCustomIndustry ? startupData.industry : '',
        stage: isCustomStage ? 'custom' : (startupData.stage || ''),
        customStage: isCustomStage ? startupData.stage : '',
        funding_goal: startupData.funding_goal?.toString() || '',
        funding_raised: startupData.funding_raised?.toString() || '',
        team_size: startupData.team_size?.toString() || '1',
        looking_for: startupData.looking_for || [],
        established_at: startupData.established_at || ''
      });

      // Fetch founder profile
      const { data: founderData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, user_id, title, linkedin_url')
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

  const handleSave = async () => {
    if (!startup) return;
    setSaving(true);

    const finalIndustry = editForm.industry === 'custom' ? editForm.customIndustry : editForm.industry;
    const finalStage = editForm.stage === 'custom' ? editForm.customStage : editForm.stage;

    const { error } = await supabase
      .from('startups')
      .update({
        name: editForm.name,
        tagline: editForm.tagline || null,
        description: editForm.description || null,
        website: editForm.website || null,
        industry: finalIndustry || null,
        stage: finalStage || null,
        funding_goal: editForm.funding_goal ? parseFloat(editForm.funding_goal) : null,
        funding_raised: editForm.funding_raised ? parseFloat(editForm.funding_raised) : null,
        team_size: parseInt(editForm.team_size) || 1,
        looking_for: editForm.looking_for.length > 0 ? editForm.looking_for : null,
        established_at: editForm.established_at || null
      })
      .eq('id', startup.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update startup', variant: 'destructive' });
    } else {
      toast({ title: 'Saved!', description: 'Startup details updated.' });
      setIsEditing(false);
      fetchStartupData();
    }

    setSaving(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file', variant: 'destructive' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please select an image under 10MB', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!startup) return;

    setUploadingLogo(true);
    setCropperOpen(false);

    try {
      const fileName = `${startup.id}/${Date.now()}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('startup-logos')
        .upload(fileName, croppedBlob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('startup-logos')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('startups')
        .update({ logo_url: publicUrl })
        .eq('id', startup.id);

      if (updateError) throw updateError;

      setStartup(prev => prev ? { ...prev, logo_url: publicUrl } : null);
      toast({ title: 'Logo updated!', description: 'Startup logo has been changed.' });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({ title: 'Upload failed', description: 'Failed to upload logo. Please try again.', variant: 'destructive' });
    } finally {
      setUploadingLogo(false);
      setSelectedImage(null);
    }
  };

  const handlePitchClick = (pitchId: string) => {
    navigate(`/dashboard/pitches?video=${pitchId}`);
  };

  const getStageInfo = (stage: string | null) => {
    const found = defaultStages.find(s => s.value === stage);
    if (found) return found;
    // Custom stage - use a unique color
    return { value: stage, label: stage, color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
  };

  const fundingProgress = startup?.funding_goal 
    ? Math.min(((startup.funding_raised || 0) / startup.funding_goal) * 100, 100)
    : 0;

  const displayDate = startup?.established_at || startup?.created_at;

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
        {/* Hero Header */}
        <Card className="mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 via-sky/10 to-primary/5 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Logo with upload option for owner */}
              <div className="relative group">
                <div className="w-28 h-28 sm:w-32 sm:h-32 bg-background rounded-2xl shadow-lg flex items-center justify-center overflow-hidden border-4 border-background">
                  {startup.logo_url ? (
                    <img src={startup.logo_url} alt={startup.name} className="w-full h-full object-cover" />
                  ) : (
                    <Rocket className="h-12 w-12 text-primary" />
                  )}
                </div>
                
                {isOwner && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    {uploadingLogo ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </button>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold">{startup.name}</h1>
                  {startup.stage && (
                    <Badge className={`${getStageInfo(startup.stage).color} border`}>
                      {getStageInfo(startup.stage).label}
                    </Badge>
                  )}
                </div>

                {startup.tagline && (
                  <p className="text-lg text-muted-foreground mb-3">{startup.tagline}</p>
                )}

                <div className="flex flex-wrap gap-2 mb-4 justify-center sm:justify-start">
                  {startup.industry && (
                    <Badge variant="outline" className="gap-1">
                      <Briefcase className="h-3 w-3" />
                      {startup.industry}
                    </Badge>
                  )}
                  {displayDate && (
                    <Badge variant="outline" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      Est. {format(new Date(displayDate), 'MMM yyyy')}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2 justify-center sm:justify-start flex-wrap">
                  {isOwner ? (
                    <>
                      <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? "outline" : "default"}>
                        {isEditing ? <X className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                        {isEditing ? 'Cancel' : 'Edit Details'}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => navigate('/dashboard/upload-pitch')}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Pitch
                      </Button>
                    </>
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
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border border-t">
            <div className="p-4 text-center">
              <p className="text-2xl font-bold">{startup.team_size}</p>
              <p className="text-xs text-muted-foreground">Team Size</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold">{followersCount}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold">{pitches.length}</p>
              <p className="text-xs text-muted-foreground">Pitches</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold">
                {pitches.reduce((sum, p) => sum + (p.views_count || 0), 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total Views</p>
            </div>
          </div>
        </Card>

        {/* Edit Form */}
        {isEditing && isOwner && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Edit Startup Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Startup Name</Label>
                  <Input 
                    value={editForm.name}
                    onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Startup name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Established Date</Label>
                  <Input 
                    type="date"
                    value={editForm.established_at}
                    onChange={(e) => setEditForm(f => ({ ...f, established_at: e.target.value }))}
                  />
                </div>
              </div>

              {/* Industry with custom option */}
              <div className="space-y-2">
                <Label>Industry / Category</Label>
                <div className="flex gap-2">
                  <select 
                    className="flex-1 h-10 px-3 rounded-md border border-input bg-background"
                    value={showCustomIndustry ? 'custom' : editForm.industry}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setShowCustomIndustry(true);
                        setEditForm(f => ({ ...f, industry: 'custom' }));
                      } else {
                        setShowCustomIndustry(false);
                        setEditForm(f => ({ ...f, industry: e.target.value, customIndustry: '' }));
                      }
                    }}
                  >
                    <option value="">Select industry</option>
                    {defaultIndustries.map(i => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                    <option value="custom">+ Add Custom</option>
                  </select>
                  {showCustomIndustry && (
                    <Input 
                      value={editForm.customIndustry}
                      onChange={(e) => setEditForm(f => ({ ...f, customIndustry: e.target.value }))}
                      placeholder="Enter custom category"
                      className="flex-1"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tagline</Label>
                <Input 
                  value={editForm.tagline}
                  onChange={(e) => setEditForm(f => ({ ...f, tagline: e.target.value }))}
                  placeholder="A catchy one-liner about your startup"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  value={editForm.description}
                  onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Tell investors about your startup, the problem you solve, and your vision..."
                  className="min-h-[120px]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input 
                    value={editForm.website}
                    onChange={(e) => setEditForm(f => ({ ...f, website: e.target.value }))}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
                
                {/* Stage with custom option */}
                <div className="space-y-2">
                  <Label>Stage</Label>
                  <div className="flex gap-2">
                    <select 
                      className="flex-1 h-10 px-3 rounded-md border border-input bg-background"
                      value={showCustomStage ? 'custom' : editForm.stage}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setShowCustomStage(true);
                          setEditForm(f => ({ ...f, stage: 'custom' }));
                        } else {
                          setShowCustomStage(false);
                          setEditForm(f => ({ ...f, stage: e.target.value, customStage: '' }));
                        }
                      }}
                    >
                      <option value="">Select stage</option>
                      {defaultStages.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                      <option value="custom">+ Add Custom</option>
                    </select>
                    {showCustomStage && (
                      <Input 
                        value={editForm.customStage}
                        onChange={(e) => setEditForm(f => ({ ...f, customStage: e.target.value }))}
                        placeholder="Custom stage"
                        className="flex-1"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Stage Preview */}
              {(editForm.stage || editForm.customStage) && (
                <div className="space-y-2">
                  <Label>Stage Preview</Label>
                  <div className="flex flex-wrap gap-2">
                    {defaultStages.map(s => (
                      <Badge 
                        key={s.value}
                        className={`${s.color} border cursor-pointer ${editForm.stage === s.value && !showCustomStage ? 'ring-2 ring-primary' : 'opacity-60'}`}
                        onClick={() => {
                          setShowCustomStage(false);
                          setEditForm(f => ({ ...f, stage: s.value, customStage: '' }));
                        }}
                      >
                        {s.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Funding Goal ($)</Label>
                  <Input 
                    type="number"
                    value={editForm.funding_goal}
                    onChange={(e) => setEditForm(f => ({ ...f, funding_goal: e.target.value }))}
                    placeholder="1000000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Funding Raised ($)</Label>
                  <Input 
                    type="number"
                    value={editForm.funding_raised}
                    onChange={(e) => setEditForm(f => ({ ...f, funding_raised: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Team Size</Label>
                  <Input 
                    type="number"
                    value={editForm.team_size}
                    onChange={(e) => setEditForm(f => ({ ...f, team_size: e.target.value }))}
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Looking For</Label>
                <div className="flex flex-wrap gap-2">
                  {lookingForOptions.map(opt => (
                    <Badge 
                      key={opt}
                      variant={editForm.looking_for.includes(opt) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setEditForm(f => ({
                          ...f,
                          looking_for: f.looking_for.includes(opt)
                            ? f.looking_for.filter(x => x !== opt)
                            : [...f.looking_for, opt]
                        }));
                      }}
                    >
                      {opt}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* About Section */}
        {startup.description && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{startup.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Funding Progress */}
        {startup.funding_goal && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Funding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Raised: <strong>${(startup.funding_raised || 0).toLocaleString()}</strong></span>
                  <span>Goal: <strong>${startup.funding_goal.toLocaleString()}</strong></span>
                </div>
                <Progress value={fundingProgress} className="h-3" />
                <p className="text-xs text-muted-foreground text-center">
                  {fundingProgress.toFixed(1)}% of funding goal reached
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Looking For */}
        {startup.looking_for && startup.looking_for.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Looking For
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {startup.looking_for.map((item) => (
                  <Badge key={item} variant="secondary" className="px-3 py-1">
                    {item}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Founder Card */}
        {founder && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Founder</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="flex items-center gap-4 cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                onClick={() => navigate(`/dashboard/profile/${founder.user_id}`)}
              >
                <Avatar className="h-14 w-14 border-2 border-primary/20">
                  <AvatarImage src={founder.avatar_url || ''} />
                  <AvatarFallback className="text-lg">{founder.full_name?.charAt(0) || 'F'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-lg">{founder.full_name}</p>
                  <p className="text-sm text-muted-foreground">{founder.title || 'Founder & CEO'}</p>
                </div>
                {founder.linkedin_url && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(founder.linkedin_url!, '_blank');
                    }}
                  >
                    <Linkedin className="h-5 w-5" />
                  </Button>
                )}
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
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
                  <p className="text-sm text-muted-foreground mb-4">
                    {isOwner ? "Upload your first pitch to showcase your startup!" : "This startup hasn't uploaded any pitches yet."}
                  </p>
                  {isOwner && (
                    <Button onClick={() => navigate('/dashboard/upload-pitch')}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload First Pitch
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
                
                {/* Add Pitch Card for Owner */}
                {isOwner && (
                  <motion.div
                    className="cursor-pointer group"
                    onClick={() => navigate('/dashboard/upload-pitch')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="relative aspect-[9/16] bg-muted rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors flex items-center justify-center">
                      <div className="text-center">
                        <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                        <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Add Pitch</p>
                      </div>
                    </div>
                  </motion.div>
                )}
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
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={founder.avatar_url || ''} />
                        <AvatarFallback>{founder.full_name?.charAt(0) || 'F'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold">{founder.full_name}</p>
                        <p className="text-sm text-muted-foreground">{founder.title || 'Founder'}</p>
                      </div>
                      <Badge className="bg-primary/20 text-primary border-primary/30 border">Founder</Badge>
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
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.profile?.avatar_url || ''} />
                        <AvatarFallback>{member.profile?.full_name?.charAt(0) || 'T'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold">{member.profile?.full_name || 'Team Member'}</p>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                      <Badge variant="secondary">{member.role}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {teamMembers.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No additional team members yet.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Logo Cropper Dialog */}
      {selectedImage && (
        <AvatarCropper
          open={cropperOpen}
          onClose={() => {
            setCropperOpen(false);
            setSelectedImage(null);
          }}
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
};

export default StartupDetails;
