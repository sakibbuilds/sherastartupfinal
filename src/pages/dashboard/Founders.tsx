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
  Loader2
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
}

interface Startup {
  id: string;
  name: string;
  industry: string | null;
  founder_id: string;
}

const Founders = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [startups, setStartups] = useState<Record<string, Startup>>({});
  const [connectionStatus, setConnectionStatus] = useState<Record<string, 'none' | 'pending' | 'accepted' | 'incoming'>>({});
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

        // Fetch Startups
        const userIds = profilesData.map(p => p.user_id);
        if (userIds.length > 0) {
          const { data: startupsData } = await supabase
            .from('startups')
            .select('id, name, industry, founder_id')
            .in('founder_id', userIds);
          
          if (startupsData) {
            const startupsMap: Record<string, Startup> = {};
            startupsData.forEach(s => {
              startupsMap[s.founder_id] = s;
            });
            setStartups(startupsMap);
          }

          // Fetch Connections if user is logged in
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
                className="pl-9 bg-card"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="h-24 bg-muted rounded-t-lg" />
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedProfiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="h-full"
                  >
                    <Card 
                      className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden border-border/50"
                      onClick={() => navigate(`/dashboard/profile/${profile.user_id}`)}
                    >
                      <CardContent className="pt-6 text-center relative pb-20 px-4 flex flex-col h-full">
                        {/* Top Badges Row */}
                        <div className="flex justify-between items-start mb-6">
                          {startups[profile.user_id] ? (
                             <Badge 
                               variant="outline" 
                               className="text-xs border-primary/20 text-primary flex items-center gap-1 max-w-[120px] truncate cursor-pointer hover:bg-primary/10 transition-colors"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 navigate(`/dashboard/startups/${startups[profile.user_id].id}`);
                               }}
                             >
                               <Building2 className="h-3 w-3 shrink-0" />
                               <span className="truncate">{startups[profile.user_id].name}</span>
                             </Badge>
                          ) : (
                            <div /> // Spacer if no startup
                          )}
                          
                          {profile.university && (
                              <Badge 
                                variant="secondary" 
                                className="text-xs max-w-[120px] truncate cursor-pointer hover:bg-secondary/80 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFilterUniversity(profile.university!);
                                }}
                              >
                                <GraduationCap className="h-3 w-3 mr-1 shrink-0" />
                                <span className="truncate">{profile.university}</span>
                              </Badge>
                          )}
                        </div>

                        <div className="flex justify-center mb-4">
                          <Avatar className="h-24 w-24 border-4 border-background shadow-sm">
                            <AvatarImage src={profile.avatar_url || ''} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xl">
                              {profile.full_name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        
                        <div className="space-y-3 flex-grow">
                          <div>
                            <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                              {profile.full_name}
                            </h3>
                            {profile.title && (
                              <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1.5">
                                <Briefcase className="h-3 w-3" />
                                {profile.title}
                              </p>
                            )}
                          </div>

                          {profile.bio && (
                            <p className="text-sm text-muted-foreground line-clamp-2 px-2">
                              {profile.bio}
                            </p>
                          )}

                          {profile.expertise && profile.expertise.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                              {profile.expertise.slice(0, 3).map((exp, i) => (
                                <Badge 
                                  key={i} 
                                  variant="outline" 
                                  className="text-xs bg-muted/50 font-normal cursor-pointer hover:bg-muted transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFilterExpertise(exp);
                                  }}
                                >
                                  {exp}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="absolute bottom-6 left-0 right-0 px-4 flex gap-2 justify-center">
                          {user && user.id === profile.user_id ? (
                            <Button variant="outline" size="sm" className="w-full">
                              View Profile
                            </Button>
                          ) : (
                            <>
                              {connectionStatus[profile.user_id] === 'accepted' ? (
                                <Button 
                                  size="sm" 
                                  variant="secondary"
                                  className="flex-1 bg-green-100 text-green-700 hover:bg-green-200 border-green-200"
                                  disabled
                                >
                                  <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                                  Connected
                                </Button>
                              ) : connectionStatus[profile.user_id] === 'pending' ? (
                                <Button 
                                  size="sm" 
                                  variant="secondary"
                                  className="flex-1"
                                  disabled
                                >
                                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                  Pending
                                </Button>
                              ) : connectionStatus[profile.user_id] === 'incoming' ? (
                                <Button 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/dashboard/profile/${profile.user_id}`);
                                  }}
                                >
                                  <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                                  Accept
                                </Button>
                              ) : (
                                <Button 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={(e) => handleConnect(e, profile.user_id)}
                                  disabled={actionLoading === profile.user_id}
                                >
                                  {actionLoading === profile.user_id ? (
                                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                  ) : (
                                    <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                                  )}
                                  Connect
                                </Button>
                              )}
                              
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="flex-1"
                                onClick={(e) => handleMessage(e, profile.user_id)}
                              >
                                <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                                Message
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
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
