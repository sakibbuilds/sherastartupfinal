import { useState, useEffect, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TrendingUp } from 'lucide-react';

interface TrendingStartupsProps {
  displayMode?: 'list' | 'carousel';
}

export const TrendingStartups = forwardRef<HTMLDivElement, TrendingStartupsProps>(({ displayMode = 'list' }, ref) => {
  const navigate = useNavigate();
  const [startups, setStartups] = useState<any[]>([]);

  useEffect(() => {
    fetchStartups();
  }, []);

  const fetchStartups = async () => {
    const { data } = await supabase
      .from('startups')
      .select('id, name, logo_url, tagline, views')
      .order('views', { ascending: false })
      .limit(displayMode === 'carousel' ? 8 : 5);

    if (data) setStartups(data);
  };

  if (startups.length === 0) return null;

  if (displayMode === 'carousel') {
    return (
      <div ref={ref} className="mb-4">
        <h3 className="font-semibold text-sm mb-2 px-1 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" /> Trending Startups
        </h3>
        <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 scrollbar-hide">
          {startups.map((startup) => (
            <Card key={startup.id} className="min-w-[200px] w-[200px] flex-shrink-0 glass-card cursor-pointer hover:border-primary transition-colors" onClick={() => navigate(`/dashboard/startups/${startup.id}`)}>
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
          <TrendingUp className="h-4 w-4" />
          Trending Startups
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
});

TrendingStartups.displayName = 'TrendingStartups';
