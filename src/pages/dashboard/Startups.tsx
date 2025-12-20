import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Rocket, 
  Loader2, 
  Search, 
  Plus, 
  Users, 
  TrendingUp,
  ExternalLink,
  Building2
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  founder?: {
    full_name: string;
    avatar_url: string | null;
    university?: {
      name: string;
    } | null;
  };
}

const stages = [
  { value: 'idea', label: 'Idea Stage' },
  { value: 'mvp', label: 'MVP' },
  { value: 'early', label: 'Early Traction' },
  { value: 'growth', label: 'Growth' },
  { value: 'scaling', label: 'Scaling' }
];

const industries = [
  'Technology', 'Healthcare', 'Fintech', 'EdTech', 'E-commerce', 
  'AgriTech', 'CleanTech', 'AI/ML', 'SaaS', 'Consumer', 'B2B',
  'Manufacturing', 'Logistics', 'Real Estate', 'Entertainment'
];

const Startups = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState<string>('');
  const [filterIndustry, setFilterIndustry] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // New startup form
  const [newStartup, setNewStartup] = useState({
    name: '',
    tagline: '',
    description: '',
    website: '',
    industry: '',
    stage: '',
    funding_goal: ''
  });

  useEffect(() => {
    fetchStartups();
  }, []);

  const fetchStartups = async () => {
    const { data, error } = await supabase
      .from('startups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching startups:', error);
    } else if (data) {
      // Fetch founder profiles separately
      const startupsWithFounders = await Promise.all(
        data.map(async (startup) => {
          const { data: founder } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, university_id')
            .eq('user_id', startup.founder_id)
            .maybeSingle();

          let university = null;
          if (founder?.university_id) {
            const { data: uniData } = await supabase
              .from('universities')
              .select('name')
              .eq('id', founder.university_id)
              .maybeSingle();
            university = uniData;
          }

          return {
            ...startup,
            founder: founder ? { ...founder, university } : null
          };
        })
      );
      setStartups(startupsWithFounders);
    }
    setLoading(false);
  };

  const handleCreateStartup = async () => {
    if (!user || !newStartup.name.trim()) return;

    setCreating(true);

    const { error } = await supabase
      .from('startups')
      .insert({
        founder_id: user.id,
        name: newStartup.name.trim(),
        tagline: newStartup.tagline || null,
        description: newStartup.description || null,
        website: newStartup.website || null,
        industry: newStartup.industry || null,
        stage: newStartup.stage || null,
        funding_goal: newStartup.funding_goal ? parseFloat(newStartup.funding_goal) : null
      });

    if (error) {
      toast({ title: 'Error', description: 'Failed to create startup', variant: 'destructive' });
    } else {
      toast({ title: 'Success!', description: 'Your startup has been created.' });
      setDialogOpen(false);
      setNewStartup({ name: '', tagline: '', description: '', website: '', industry: '', stage: '', funding_goal: '' });
      fetchStartups();
    }

    setCreating(false);
  };

  const filteredStartups = startups.filter((startup) => {
    const matchesSearch = startup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      startup.tagline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      startup.industry?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStage = !filterStage || startup.stage === filterStage;
    const matchesIndustry = !filterIndustry || startup.industry === filterIndustry;

    return matchesSearch && matchesStage && matchesIndustry;
  });

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

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Startups</h1>
          <p className="text-muted-foreground">Discover and connect with university startups</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Startup
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Your Startup</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Startup Name *</Label>
                <Input
                  value={newStartup.name}
                  onChange={(e) => setNewStartup({ ...newStartup, name: e.target.value })}
                  placeholder="e.g., TechVenture"
                />
              </div>
              <div className="space-y-2">
                <Label>Tagline</Label>
                <Input
                  value={newStartup.tagline}
                  onChange={(e) => setNewStartup({ ...newStartup, tagline: e.target.value })}
                  placeholder="One line description of your startup"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newStartup.description}
                  onChange={(e) => setNewStartup({ ...newStartup, description: e.target.value })}
                  placeholder="Tell us more about your startup..."
                  className="resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Select
                    value={newStartup.industry}
                    onValueChange={(v) => setNewStartup({ ...newStartup, industry: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((ind) => (
                        <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Stage</Label>
                  <Select
                    value={newStartup.stage}
                    onValueChange={(v) => setNewStartup({ ...newStartup, stage: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={newStartup.website}
                  onChange={(e) => setNewStartup({ ...newStartup, website: e.target.value })}
                  placeholder="https://yourstartup.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Funding Goal (USD)</Label>
                <Input
                  type="number"
                  value={newStartup.funding_goal}
                  onChange={(e) => setNewStartup({ ...newStartup, funding_goal: e.target.value })}
                  placeholder="100000"
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleCreateStartup}
                disabled={!newStartup.name.trim() || creating}
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Rocket className="h-4 w-4 mr-2" />}
                Create Startup
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search startups..."
            className="pl-10"
          />
        </div>
        <Select value={filterStage || "all"} onValueChange={(v) => setFilterStage(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {stages.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterIndustry || "all"} onValueChange={(v) => setFilterIndustry(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Industries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {industries.map((ind) => (
              <SelectItem key={ind} value={ind}>{ind}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Startups Grid */}
      {filteredStartups.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No startups found. Be the first to create one!</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStartups.map((startup, index) => (
            <motion.div
              key={startup.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className="h-full hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/dashboard/startups/${startup.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-sky/20 rounded-xl flex items-center justify-center">
                        {startup.logo_url ? (
                          <img src={startup.logo_url} alt={startup.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <Rocket className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{startup.name}</CardTitle>
                        {startup.industry && (
                          <p className="text-sm text-muted-foreground">{startup.industry}</p>
                        )}
                      </div>
                    </div>
                    {startup.stage && (
                      <Badge className={getStageColor(startup.stage)}>
                        {stages.find(s => s.value === startup.stage)?.label || startup.stage}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {startup.tagline && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {startup.tagline}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {startup.team_size} member{startup.team_size !== 1 ? 's' : ''}
                    </span>
                    {startup.funding_goal && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        ${startup.funding_goal.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {startup.founder && (
                    <div className="flex items-center gap-2 pt-3 border-t">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={startup.founder.avatar_url || ''} />
                        <AvatarFallback className="text-xs">
                          {startup.founder.full_name?.charAt(0) || 'F'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{startup.founder.full_name}</p>
                        {startup.founder.university && (
                          <p className="text-xs text-muted-foreground truncate">
                            {startup.founder.university.name}
                          </p>
                        )}
                      </div>
                      {startup.website && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(startup.website!, '_blank');
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Startups;
