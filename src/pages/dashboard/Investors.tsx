import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Loader2, 
  Search, 
  TrendingUp,
  MessageSquare,
  DollarSign,
  Filter,
  Users,
  Briefcase,
  Check
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { VerifiedBadge } from '@/components/common/VerifiedBadge';

interface Investor {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  title: string | null;
  bio: string | null;
  investment_focus: string[] | null;
  investment_range_min: number | null;
  investment_range_max: number | null;
  linkedin_url: string | null;
  verified?: boolean;
  university?: {
    name: string;
  } | null;
}

const industries = [
  'Technology', 'Healthcare', 'Fintech', 'EdTech', 'E-commerce', 
  'AgriTech', 'CleanTech', 'AI/ML', 'SaaS', 'Consumer', 'B2B'
];

const Investors = () => {
  const { user } = useAuth();
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [connectionCounts, setConnectionCounts] = useState<Record<string, number>>({});
  const [startupCounts, setStartupCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFocus, setFilterFocus] = useState<string>('');

  useEffect(() => {
    fetchInvestors();
  }, []);

  const fetchInvestors = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_type', 'investor')
      .order('full_name');

    if (error) {
      console.error('Error fetching investors:', error);
    } else if (data) {
      // Fetch university names
      const investorsWithUniversity = await Promise.all(
        data.map(async (investor) => {
          let university = null;
          if (investor.university_id) {
            const { data: uniData } = await supabase
              .from('universities')
              .select('name')
              .eq('id', investor.university_id)
              .maybeSingle();
            university = uniData;
          }
          return { ...investor, university };
        })
      );
      setInvestors(investorsWithUniversity);

      // Fetch Stats
      const userIds = data.map(i => i.user_id);
      if (userIds.length > 0) {
        // Fetch Startups (Founded by investor)
        const { data: startupsData } = await supabase
          .from('startups')
          .select('founder_id')
          .in('founder_id', userIds);
        
        if (startupsData) {
          const sCounts: Record<string, number> = {};
          startupsData.forEach(s => {
            sCounts[s.founder_id] = (sCounts[s.founder_id] || 0) + 1;
          });
          setStartupCounts(sCounts);
        }

        // Fetch Connection Counts
        const { data: allMatches } = await supabase
          .from('matches')
          .select('user_id, matched_user_id')
          .eq('status', 'accepted')
          .or(`user_id.in.(${userIds.join(',')}),matched_user_id.in.(${userIds.join(',')})`);

        if (allMatches) {
          const cCounts: Record<string, number> = {};
          allMatches.forEach(m => {
            if (userIds.includes(m.user_id)) {
              cCounts[m.user_id] = (cCounts[m.user_id] || 0) + 1;
            }
            if (userIds.includes(m.matched_user_id)) {
              cCounts[m.matched_user_id] = (cCounts[m.matched_user_id] || 0) + 1;
            }
          });
          setConnectionCounts(cCounts);
        }
      }
    }
    setLoading(false);
  };

  const filteredInvestors = investors.filter((investor) => {
    const matchesSearch = investor.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      investor.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      investor.bio?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFocus = !filterFocus || 
      investor.investment_focus?.includes(filterFocus);

    return matchesSearch && matchesFocus;
  });

  const formatInvestmentRange = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    if (max) return `Up to $${max.toLocaleString()}`;
    return null;
  };

  const isVerified = (investor: Investor) => {
    return investor.verified === true;
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Investors</h1>
        <p className="text-muted-foreground">Connect with investors looking to fund university startups</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search investors..."
            className="pl-10 bg-white/5 border-white/10 focus:border-primary"
          />
        </div>
        <Select value={filterFocus || "all"} onValueChange={(v) => setFilterFocus(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Investment Focus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Focus Areas</SelectItem>
            {industries.map((ind) => (
              <SelectItem key={ind} value={ind}>{ind}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Investors Grid */}
      {filteredInvestors.length === 0 ? (
        <div className="text-center py-12">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {investors.length === 0 
              ? "No investors have joined yet. Be the first!" 
              : "No investors match your search criteria."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredInvestors.map((investor, index) => (
            <motion.div
              key={investor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="h-full glass-card hover:bg-white/5 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={investor.avatar_url || ''} />
                      <AvatarFallback className="text-lg">
                        {investor.full_name?.charAt(0) || 'I'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold truncate">{investor.full_name}</h3>
                        {isVerified(investor) && (
                          <VerifiedBadge size="sm" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {investor.title || 'Investor'}
                      </p>
                      {investor.university && (
                        <p className="text-xs text-muted-foreground truncate">
                          {investor.university.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {investor.bio && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {investor.bio}
                    </p>
                  )}

                  {investor.investment_focus && investor.investment_focus.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {investor.investment_focus.slice(0, 4).map((focus) => (
                        <Badge key={focus} variant="secondary" className="text-xs">
                          {focus}
                        </Badge>
                      ))}
                      {investor.investment_focus.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{investor.investment_focus.length - 4}
                        </Badge>
                      )}
                    </div>
                  )}

                  {formatInvestmentRange(investor.investment_range_min, investor.investment_range_max) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <DollarSign className="h-4 w-4" />
                      <span>{formatInvestmentRange(investor.investment_range_min, investor.investment_range_max)}</span>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm font-medium text-gray-400 mb-6">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span>{connectionCounts[investor.user_id] || 0}</span>
                    </div>
                    {startupCounts[investor.user_id] ? (
                       <div className="flex items-center gap-1.5">
                         <Briefcase className="w-4 h-4" />
                         <span>{startupCounts[investor.user_id]}</span>
                       </div>
                    ) : null}
                  </div>

                  <Button className="w-full" variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Investors;
