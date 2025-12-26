import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Users, 
  Briefcase, 
  GraduationCap, 
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  UserPlus,
  MessageSquare,
  UserCheck,
  Building2,
  Loader2,
  Check,
  Plus,
  Clock
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  university: string | null;
  title: string | null;
  expertise: string[] | null;
  created_at: string;
  verified?: boolean;
}

interface Startup {
  id: string;
  name: string;
  industry: string | null;
  founder_id: string;
}

import { VerifiedBadge } from '@/components/common/VerifiedBadge';

const Founders = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [startups, setStartups] = useState<Record<string, Startup>>({});
  const [connectionStatus, setConnectionStatus] = useState<Record<string, 'none' | 'pending' | 'accepted' | 'incoming'>>({});
  const [connectionCounts, setConnectionCounts] = useState<Record<string, number>>({});
  const [startupCounts, setStartupCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUniversity, setFilterUniversity] = useState<string>('');
  const [filterExpertise, setFilterExpertise] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Derived lists for filter dropdowns (could be fetched from DB for scalability)
  const [availableUniversities, setAvailableUniversities] = useState<string[]>([]);
  const [availableExpertise, setAvailableExpertise] = useState<string[]>([]);

  // Collapsible states
  const [openSections, setOpenSections] = useState({
    university: true,
    expertise: true,
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterUniversity, filterExpertise]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      if (profilesData) {
        setProfiles(profilesData);
        
        // Extract unique universities and expertise for filters
        const universities = Array.from(new Set(profilesData.map(p => p.university).filter(Boolean))) as string[];
        setAvailableUniversities(universities.sort());

        const allExpertise = profilesData.flatMap(p => p.expertise || []).filter(Boolean);
        const uniqueExpertise = Array.from(new Set(allExpertise));
        setAvailableExpertise(uniqueExpertise.sort());

          // Fetch Startups and Counts
        const userIds = profilesData.map(p => p.user_id);
        if (userIds.length > 0) {
          // Fetch Startups for display and count
          const { data: startupsData } = await supabase
            .from('startups')
            .select('id, name, industry, founder_id')
            .in('founder_id', userIds);
          
          if (startupsData) {
            const startupsMap: Record<string, Startup> = {};
            const sCounts: Record<string, number> = {};
            
            startupsData.forEach(s => {
              // Map for badge (takes the last one found, or we could handle multiple)
              startupsMap[s.founder_id] = s;
              // Count
              sCounts[s.founder_id] = (sCounts[s.founder_id] || 0) + 1;
            });
            setStartups(startupsMap);
            setStartupCounts(sCounts);
          }

          // Fetch Global Connection Counts for these users
          // We need to count matches where status='accepted' for each user
          // Query all accepted matches involving these users
          const { data: allMatches } = await supabase
            .from('matches')
            .select('user_id, matched_user_id')
            .eq('status', 'accepted')
            .or(`user_id.in.(${userIds.join(',')}),matched_user_id.in.(${userIds.join(',')})`);

          if (allMatches) {
            const cCounts: Record<string, number> = {};
            allMatches.forEach(m => {
              // Increment for user_id if they are in our list
              if (userIds.includes(m.user_id)) {
                cCounts[m.user_id] = (cCounts[m.user_id] || 0) + 1;
              }
              // Increment for matched_user_id if they are in our list
              if (userIds.includes(m.matched_user_id)) {
                cCounts[m.matched_user_id] = (cCounts[m.matched_user_id] || 0) + 1;
              }
            });
            setConnectionCounts(cCounts);
          }

          // Fetch Connections status for logged in user
          if (user) {
            const { data: matchesData } = await supabase
              .from('matches')
              .select('user_id, matched_user_id, status')
              .or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`);
            
            if (matchesData) {
              const statusMap: Record<string, 'none' | 'pending' | 'accepted' | 'incoming'> = {};
              
              matchesData.forEach(match => {
                const otherUserId = match.user_id === user.id ? match.matched_user_id : match.user_id;
                
                if (match.status === 'accepted') {
                  statusMap[otherUserId] = 'accepted';
                } else if (match.status === 'pending') {
                  if (match.user_id === user.id) {
                    statusMap[otherUserId] = 'pending'; // I sent request
                  } else {
                    statusMap[otherUserId] = 'incoming'; // They sent request
                  }
                }
              });
              setConnectionStatus(statusMap);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load founders directory.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e: React.MouseEvent, targetUserId: string) => {
    e.stopPropagation();
    if (!user) {
      navigate('/auth');
      return;
    }

    setActionLoading(targetUserId);
    try {
      // Check existing connection again to be safe
      const { data: existingMatch } = await supabase
        .from('matches')
        .select('*')
        .or(`and(user_id.eq.${user.id},matched_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},matched_user_id.eq.${user.id})`)
        .maybeSingle();

      if (existingMatch) {
        if (existingMatch.status === 'accepted') {
           setConnectionStatus(prev => ({ ...prev, [targetUserId]: 'accepted' }));
           toast({ title: "Info", description: "You are already connected." });
           return;
        } else if (existingMatch.user_id === user.id) {
           setConnectionStatus(prev => ({ ...prev, [targetUserId]: 'pending' }));
           toast({ title: "Info", description: "Request already sent." });
           return;
        }
      }

      // Create match request (upsert to be safe)
      const { error: matchError } = await supabase
        .from('matches')
        .upsert({
          user_id: user.id,
          matched_user_id: targetUserId,
          status: 'pending'
        });

      if (matchError) throw matchError;

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          type: 'connection_request',
          title: 'New Connection Request',
          message: `${user.user_metadata.full_name || 'Someone'} wants to connect with you.`,
          reference_id: user.id,
          reference_type: 'profile'
        });

      setConnectionStatus(prev => ({ ...prev, [targetUserId]: 'pending' }));
      toast({
        title: "Success",
        description: "Connection request sent!",
      });

    } catch (error) {
      console.error('Error connecting:', error);
      toast({
        title: "Error",
        description: "Failed to send connection request.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleMessage = async (e: React.MouseEvent, targetUserId: string) => {
    e.stopPropagation();
    if (!user) return;
    
    // Navigate to profile for messaging logic (simpler than duplicating conversation creation here)
    // Or we could implement quick message here, but navigation is safer for now
    navigate(`/dashboard/profile/${targetUserId}`);
  };

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = 
      (profile.full_name && profile.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (profile.title && profile.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (profile.bio && profile.bio.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesUniversity = filterUniversity 
      ? profile.university === filterUniversity 
      : true;

    const matchesExpertise = filterExpertise
      ? profile.expertise?.includes(filterExpertise)
      : true;

    return matchesSearch && matchesUniversity && matchesExpertise;
  });

  const totalPages = Math.ceil(filteredProfiles.length / ITEMS_PER_PAGE);
  const paginatedProfiles = filteredProfiles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const clearFilters = () => {
    setSearchQuery('');
    setFilterUniversity('');
    setFilterExpertise('');
    setSearchParams({});
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Calculate counts for filters
  const universityCounts = profiles.reduce((acc, profile) => {
    if (profile.university) {
      acc[profile.university] = (acc[profile.university] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const expertiseCounts = profiles.reduce((acc, profile) => {
    if (profile.expertise) {
      profile.expertise.forEach(exp => {
        acc[exp] = (acc[exp] || 0) + 1;
      });
    }
    return acc;
  }, {} as Record<string, number>);

  const isVerified = (profile: Profile) => {
    return profile.verified === true;
  };

  return (
    <div className="px-6 md:px-10 py-8 space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Founders Directory</h1>
          <p className="text-muted-foreground mt-1">
            Connect with innovative founders and entrepreneurs.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters Sidebar - Desktop */}
        <div 
          className={`w-full md:w-64 space-y-6 ${showFilters ? 'block' : 'hidden md:block'}`}
        >
          <div className="flex items-center justify-between md:hidden mb-4">
            <h3 className="font-semibold">Filters</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search founders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 focus:border-primary"
              />
            </div>

            {(filterUniversity || filterExpertise) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                <X className="mr-2 h-3 w-3" />
                Clear Filters
              </Button>
            )}

            {/* University Filter */}
            <Collapsible
              open={openSections.university}
              onOpenChange={() => toggleSection('university')}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium hover:text-primary transition-colors">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    <span>University</span>
                  </div>
                  {openSections.university ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="space-y-2">
                <ScrollArea className="h-[200px] pr-4">
                  <div className="space-y-1">
                    <Button
                      variant={filterUniversity === '' ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full justify-start font-normal"
                      onClick={() => setFilterUniversity('')}
                    >
                      All Universities
                    </Button>
                    {availableUniversities.map((uni) => (
                      <Button
                        key={uni}
                        variant={filterUniversity === uni ? "secondary" : "ghost"}
                        size="sm"
                        className="w-full justify-between font-normal"
                        onClick={() => setFilterUniversity(uni)}
                      >
                        <span className="truncate">{uni}</span>
                        <span className="ml-2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{universityCounts[uni]}</span>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </CollapsibleContent>
            </Collapsible>

            <div className="h-px bg-border" />

            {/* Expertise Filter */}
            <Collapsible
              open={openSections.expertise}
              onOpenChange={() => toggleSection('expertise')}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium hover:text-primary transition-colors">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span>Expertise</span>
                  </div>
                  {openSections.expertise ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="space-y-2">
                <ScrollArea className="h-[200px] pr-4">
                  <div className="space-y-1">
                    <Button
                      variant={filterExpertise === '' ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full justify-start font-normal"
                      onClick={() => setFilterExpertise('')}
                    >
                      All Expertise
                    </Button>
                    {availableExpertise.map((exp) => (
                      <Button
                        key={exp}
                        variant={filterExpertise === exp ? "secondary" : "ghost"}
                        size="sm"
                        className="w-full justify-between font-normal"
                        onClick={() => setFilterExpertise(exp)}
                      >
                        <span className="truncate">{exp}</span>
                        <span className="ml-2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{expertiseCounts[exp]}</span>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        {/* Profiles Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i} className="animate-pulse glass-card">
                      <CardHeader className="h-24 bg-muted/20 rounded-t-lg" />
                      <CardContent className="pt-8">
                    <div className="h-16 w-16 rounded-full bg-muted -mt-16 border-4 border-background mb-4 mx-auto" />
                    <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2 mx-auto" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProfiles.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginatedProfiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer group shadow-lg"
                    onClick={() => navigate(`/dashboard/profile/${profile.user_id}`)}
                  >
                    {/* Background Image */}
                    {profile.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt={profile.full_name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary/30 to-purple-600/30 flex items-center justify-center">
                        <span className="text-5xl font-bold text-white/20">
                          {profile.full_name?.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform transition-transform duration-300 translate-y-1 group-hover:translate-y-0">
                      {/* Name and Badge */}
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="text-lg font-bold truncate">{profile.full_name}</h3>
                        {/* Verified Badge */}
                        {isVerified(profile) && (
                          <VerifiedBadge size="sm" />
                        )}
                      </div>

                      {/* Bio/Title */}
                      <p className="text-xs text-gray-300 line-clamp-1 mb-3 font-medium">
                        {profile.title || profile.bio || 'Founder'}
                      </p>

                      {/* Stats & Action */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs font-medium text-gray-300">
                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            <span>{connectionCounts[profile.user_id] || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5" />
                            <span>{startupCounts[profile.user_id] || 0}</span>
                          </div>
                        </div>
                        
                        <Button 
                          size="sm" 
                          className="rounded-full bg-white text-black hover:bg-white/90 px-4 font-semibold transition-all hover:scale-105 active:scale-95 h-8 text-xs"
                          onClick={(e) => handleConnect(e, profile.user_id)}
                        >
                          {connectionStatus[profile.user_id] === 'accepted' ? (
                            <>Message <MessageSquare className="w-3 h-3 ml-1" /></>
                          ) : connectionStatus[profile.user_id] === 'pending' ? (
                            <>Pending <Clock className="w-3 h-3 ml-1" /></>
                          ) : (
                            <>Connect <Plus className="w-3 h-3 ml-1" /></>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Top Badges (University/Startup) */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      {startups[profile.user_id] && (
                         <Badge 
                           className="bg-black/40 backdrop-blur-md border-white/10 text-white hover:bg-black/60 px-2 py-0.5 text-xs"
                           onClick={(e) => {
                             e.stopPropagation();
                             navigate(`/dashboard/startups/${startups[profile.user_id].id}`);
                           }}
                         >
                           <Building2 className="h-2.5 w-2.5 mr-1" />
                           {startups[profile.user_id].name}
                         </Badge>
                      )}
                      
                      {profile.university && (
                          <Badge 
                            variant="secondary" 
                            className="bg-white/20 backdrop-blur-md border-transparent text-white hover:bg-white/30 px-2 py-0.5 text-xs w-fit"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFilterUniversity(profile.university!);
                            }}
                          >
                            <GraduationCap className="h-2.5 w-2.5 mr-1" />
                            {profile.university}
                          </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronDown className="h-4 w-4 rotate-90" />
                    Previous
                  </Button>
                  <span className="text-sm font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronDown className="h-4 w-4 -rotate-90" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {profiles.length === 0 
                  ? "No founders have joined yet. Be the first!" 
                  : "No founders match your search criteria."}
              </p>
              {(searchQuery || filterUniversity || filterExpertise) && (
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Founders;
