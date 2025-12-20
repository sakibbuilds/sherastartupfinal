import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Building2,
  GraduationCap,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Briefcase,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface University {
  id: string;
  name: string;
}

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
    university_id: string | null;
    university?: {
      id: string;
      name: string;
    } | null;
  };
}

const stages = [
  { value: 'idea', label: 'Idea Stage', color: 'bg-slate-500/20 text-slate-400' },
  { value: 'mvp', label: 'MVP', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'early', label: 'Early Traction', color: 'bg-emerald-500/20 text-emerald-400' },
  { value: 'growth', label: 'Growth', color: 'bg-amber-500/20 text-amber-400' },
  { value: 'scaling', label: 'Scaling', color: 'bg-purple-500/20 text-purple-400' },
  { value: 'profitable', label: 'Profitable', color: 'bg-green-500/20 text-green-400' }
];

const industries = [
  'Technology', 'Healthcare', 'Fintech', 'EdTech', 'E-commerce', 
  'AgriTech', 'CleanTech', 'AI/ML', 'SaaS', 'Consumer', 'B2B',
  'Manufacturing', 'Logistics', 'Real Estate', 'Entertainment'
];

const investmentRanges = [
  { value: '0-50000', label: 'Under $50K', min: 0, max: 50000 },
  { value: '50000-250000', label: '$50K - $250K', min: 50000, max: 250000 },
  { value: '250000-1000000', label: '$250K - $1M', min: 250000, max: 1000000 },
  { value: '1000000+', label: 'Over $1M', min: 1000000, max: Infinity }
];

const Startups = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [startups, setStartups] = useState<Startup[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState<string>('');
  const [filterIndustry, setFilterIndustry] = useState<string>('');
  const [filterUniversity, setFilterUniversity] = useState<string>(searchParams.get('university') || '');
  const [filterInvestment, setFilterInvestment] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Collapsible states
  const [openSections, setOpenSections] = useState({
    university: true,
    category: true,
    stage: true,
    investment: false
  });

  // Sync URL params with filter state
  useEffect(() => {
    const universityParam = searchParams.get('university');
    if (universityParam) {
      setFilterUniversity(universityParam);
    }
  }, [searchParams]);

  // Update URL when university filter changes
  const handleUniversityFilter = (universityId: string) => {
    const newValue = filterUniversity === universityId ? '' : universityId;
    setFilterUniversity(newValue);
    if (newValue) {
      setSearchParams({ university: newValue });
    } else {
      setSearchParams({});
    }
  };

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
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    const { data, error } = await supabase
      .from('universities')
      .select('id, name')
      .order('name');

    if (!error && data) {
      setUniversities(data);
    }
  };

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
              .select('id, name')
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

  // Calculate counts
  const counts = useMemo(() => {
    const universityCounts: Record<string, number> = {};
    const industryCounts: Record<string, number> = {};
    const stageCounts: Record<string, number> = {};
    const investmentCounts: Record<string, number> = {};

    startups.forEach((startup) => {
      // University counts
      if (startup.founder?.university?.id) {
        const uniId = startup.founder.university.id;
        universityCounts[uniId] = (universityCounts[uniId] || 0) + 1;
      }

      // Industry counts
      if (startup.industry) {
        industryCounts[startup.industry] = (industryCounts[startup.industry] || 0) + 1;
      }

      // Stage counts
      if (startup.stage) {
        stageCounts[startup.stage] = (stageCounts[startup.stage] || 0) + 1;
      }

      // Investment range counts
      if (startup.funding_goal) {
        for (const range of investmentRanges) {
          if (startup.funding_goal >= range.min && startup.funding_goal < range.max) {
            investmentCounts[range.value] = (investmentCounts[range.value] || 0) + 1;
            break;
          }
        }
      }
    });

    return { universityCounts, industryCounts, stageCounts, investmentCounts };
  }, [startups]);

  const filteredStartups = startups.filter((startup) => {
    const matchesSearch = startup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      startup.tagline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      startup.industry?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStage = !filterStage || startup.stage === filterStage;
    const matchesIndustry = !filterIndustry || startup.industry === filterIndustry;
    const matchesUniversity = !filterUniversity || startup.founder?.university?.id === filterUniversity;
    
    let matchesInvestment = true;
    if (filterInvestment) {
      const range = investmentRanges.find(r => r.value === filterInvestment);
      if (range && startup.funding_goal) {
        matchesInvestment = startup.funding_goal >= range.min && startup.funding_goal < range.max;
      } else {
        matchesInvestment = false;
      }
    }

    return matchesSearch && matchesStage && matchesIndustry && matchesUniversity && matchesInvestment;
  });

  const getStageColor = (stage: string | null) => {
    const found = stages.find(s => s.value === stage);
    return found?.color || 'bg-muted';
  };

  const clearFilters = () => {
    setFilterStage('');
    setFilterIndustry('');
    setFilterUniversity('');
    setFilterInvestment('');
    setSearchQuery('');
    setSearchParams({});
  };

  const hasActiveFilters = filterStage || filterIndustry || filterUniversity || filterInvestment;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const FilterSidebar = () => (
    <div className="space-y-4">
      {/* University Filter */}
      <Collapsible 
        open={openSections.university} 
        onOpenChange={(open) => setOpenSections(prev => ({ ...prev, university: open }))}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-lg transition-colors">
          <div className="flex items-center gap-2 font-medium">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span>University</span>
          </div>
          {openSections.university ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <ScrollArea className="h-[180px]">
            <div className="space-y-1 pr-2">
              {universities.filter(uni => counts.universityCounts[uni.id]).map((uni) => (
                <button
                  key={uni.id}
                  onClick={() => handleUniversityFilter(uni.id)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-md transition-colors ${
                    filterUniversity === uni.id 
                      ? 'bg-primary/10 text-primary' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <span className="truncate">{uni.name}</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {counts.universityCounts[uni.id] || 0}
                  </Badge>
                </button>
              ))}
              {universities.filter(uni => counts.universityCounts[uni.id]).length === 0 && (
                <p className="text-xs text-muted-foreground px-2">No universities found</p>
              )}
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>

      {/* Category/Industry Filter */}
      <Collapsible 
        open={openSections.category} 
        onOpenChange={(open) => setOpenSections(prev => ({ ...prev, category: open }))}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-lg transition-colors">
          <div className="flex items-center gap-2 font-medium">
            <Briefcase className="h-4 w-4 text-primary" />
            <span>Category</span>
          </div>
          {openSections.category ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <ScrollArea className="h-[180px]">
            <div className="space-y-1 pr-2">
              {industries.filter(ind => counts.industryCounts[ind]).map((industry) => (
                <button
                  key={industry}
                  onClick={() => setFilterIndustry(filterIndustry === industry ? '' : industry)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-md transition-colors ${
                    filterIndustry === industry 
                      ? 'bg-primary/10 text-primary' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <span>{industry}</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {counts.industryCounts[industry] || 0}
                  </Badge>
                </button>
              ))}
              {industries.filter(ind => counts.industryCounts[ind]).length === 0 && (
                <p className="text-xs text-muted-foreground px-2">No categories found</p>
              )}
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>

      {/* Stage Filter */}
      <Collapsible 
        open={openSections.stage} 
        onOpenChange={(open) => setOpenSections(prev => ({ ...prev, stage: open }))}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-lg transition-colors">
          <div className="flex items-center gap-2 font-medium">
            <Layers className="h-4 w-4 text-primary" />
            <span>Stage</span>
          </div>
          {openSections.stage ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="space-y-1">
            {stages.map((stage) => (
              <button
                key={stage.value}
                onClick={() => setFilterStage(filterStage === stage.value ? '' : stage.value)}
                className={`w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-md transition-colors ${
                  filterStage === stage.value 
                    ? 'bg-primary/10 text-primary' 
                    : 'hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Badge className={`${stage.color} border text-xs`}>{stage.label}</Badge>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {counts.stageCounts[stage.value] || 0}
                </Badge>
              </button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Investment Filter */}
      <Collapsible 
        open={openSections.investment} 
        onOpenChange={(open) => setOpenSections(prev => ({ ...prev, investment: open }))}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-lg transition-colors">
          <div className="flex items-center gap-2 font-medium">
            <DollarSign className="h-4 w-4 text-primary" />
            <span>Investment Goal</span>
          </div>
          {openSections.investment ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="space-y-1">
            {investmentRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => setFilterInvestment(filterInvestment === range.value ? '' : range.value)}
                className={`w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-md transition-colors ${
                  filterInvestment === range.value 
                    ? 'bg-primary/10 text-primary' 
                    : 'hover:bg-muted'
                }`}
              >
                <span>{range.label}</span>
                <Badge variant="secondary" className="text-xs">
                  {counts.investmentCounts[range.value] || 0}
                </Badge>
              </button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Startups</h1>
          <p className="text-muted-foreground">
            Discover and connect with university startups
            <span className="ml-2 text-sm">({startups.length} total)</span>
          </p>
          {/* Institution counts summary */}
          <div className="flex flex-wrap gap-2 mt-2">
            {universities
              .filter(uni => counts.universityCounts[uni.id])
              .slice(0, 5)
              .map(uni => (
                <button
                  key={uni.id}
                  onClick={() => handleUniversityFilter(uni.id)}
                  className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
                    filterUniversity === uni.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                >
                  <GraduationCap className="h-3 w-3" />
                  {uni.name.length > 20 ? uni.name.slice(0, 20) + '...' : uni.name}
                  <span className="font-semibold">{counts.universityCounts[uni.id]}</span>
                </button>
              ))}
            {universities.filter(uni => counts.universityCounts[uni.id]).length > 5 && (
              <span className="text-xs text-muted-foreground self-center">
                +{universities.filter(uni => counts.universityCounts[uni.id]).length - 5} more
              </span>
            )}
          </div>
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

      {/* Search and Mobile Filter Toggle */}
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
        <Button 
          variant="outline" 
          className="lg:hidden"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
              {[filterStage, filterIndustry, filterUniversity, filterInvestment].filter(Boolean).length}
            </Badge>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filterUniversity && (
            <Badge variant="secondary" className="gap-1">
              <GraduationCap className="h-3 w-3" />
              {universities.find(u => u.id === filterUniversity)?.name}
              <X className="h-3 w-3 cursor-pointer" onClick={() => { setFilterUniversity(''); setSearchParams({}); }} />
            </Badge>
          )}
          {filterIndustry && (
            <Badge variant="secondary" className="gap-1">
              <Briefcase className="h-3 w-3" />
              {filterIndustry}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterIndustry('')} />
            </Badge>
          )}
          {filterStage && (
            <Badge variant="secondary" className="gap-1">
              <Layers className="h-3 w-3" />
              {stages.find(s => s.value === filterStage)?.label}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterStage('')} />
            </Badge>
          )}
          {filterInvestment && (
            <Badge variant="secondary" className="gap-1">
              <DollarSign className="h-3 w-3" />
              {investmentRanges.find(r => r.value === filterInvestment)?.label}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterInvestment('')} />
            </Badge>
          )}
        </div>
      )}

      <div className="flex gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <Card className="sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter Startups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FilterSidebar />
            </CardContent>
          </Card>
        </aside>

        {/* Mobile Sidebar Sheet */}
        <AnimatePresence>
          {showFilters && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black z-40 lg:hidden"
                onClick={() => setShowFilters(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="fixed left-0 top-0 h-full w-80 bg-background z-50 lg:hidden overflow-y-auto"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filter Startups
                    </h2>
                    <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <FilterSidebar />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1">
          {/* Results Count */}
          <p className="text-sm text-muted-foreground mb-4">
            Showing {filteredStartups.length} of {startups.length} startups
          </p>

          {/* Startups Grid */}
          {filteredStartups.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {hasActiveFilters 
                  ? 'No startups match your filters. Try adjusting your criteria.'
                  : 'No startups found. Be the first to create one!'
                }
              </p>
              {hasActiveFilters && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUniversityFilter(startup.founder!.university!.id);
                                }}
                                className="text-xs text-primary hover:underline truncate flex items-center gap-1"
                              >
                                <GraduationCap className="h-3 w-3" />
                                {startup.founder.university.name}
                              </button>
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
      </div>
    </div>
  );
};

export default Startups;