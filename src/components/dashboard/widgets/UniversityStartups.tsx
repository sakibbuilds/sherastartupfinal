import { useState, useEffect, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Building2 } from 'lucide-react';

interface UniversityStartupsProps {
  displayMode?: 'list' | 'carousel';
}

export const UniversityStartups = forwardRef<HTMLDivElement, UniversityStartupsProps>(
  ({ displayMode = 'list' }, ref) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [startups, setStartups] = useState<any[]>([]);
    const [university, setUniversity] = useState<string | null>(null);

    useEffect(() => {
      if (user) fetchStartups();
    }, [user]);

    const fetchStartups = async () => {
      // 1. Get user's university
      const { data: userData } = await supabase
        .from('profiles')
        .select('university')
        .eq('user_id', user?.id)
        .single();

      if (!userData?.university) return;
      setUniversity(userData.university);

      // 2. Get founders from that university
      const { data: founders } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('university', userData.university);

      if (!founders || founders.length === 0) return;

      const founderIds = founders.map(f => f.user_id);

      // 3. Get startups by those founders
      const { data: startupsData } = await supabase
        .from('startups')
        .select('id, name, logo_url, tagline')
        .in('founder_id', founderIds)
        .limit(displayMode === 'carousel' ? 8 : 5);

      if (startupsData) setStartups(startupsData);
    };

    if (!university || startups.length === 0) return null;

    if (displayMode === 'carousel') {
      return (
        <div ref={ref} className="mb-4">
          <h3 className="font-semibold text-sm mb-2 px-1 flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Startups from {university}
          </h3>
          <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 scrollbar-hide">
            {startups.map((startup) => (
              <Card key={startup.id} className="min-w-[200px] w-[200px] flex-shrink-0 cursor-pointer glass-card hover:-translate-y-1" onClick={() => navigate(`/dashboard/startups/${startup.id}`)}>
                <CardContent className="p-3 flex items-center gap-3">
                  <Avatar className="h-10 w-10 rounded-lg">
                    <AvatarImage src={startup.logo_url || ''} />
                    <AvatarFallback className="rounded-lg">{startup.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-medium truncate">
                      {startup.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {startup.tagline || 'No tagline'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    }

    return (
      <Card ref={ref} className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Startups from {university}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {startups.map((startup) => (
            <div 
              key={startup.id} 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => navigate(`/dashboard/startups/${startup.id}`)}
            >
              <Avatar className="h-10 w-10 rounded-lg">
                <AvatarImage src={startup.logo_url || ''} />
                <AvatarFallback className="rounded-lg">{startup.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {startup.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {startup.tagline || 'No tagline'}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
);

UniversityStartups.displayName = 'UniversityStartups';
