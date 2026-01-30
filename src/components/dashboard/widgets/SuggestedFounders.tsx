import { useState, useEffect, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus } from 'lucide-react';
import { UserBadges } from '@/components/common/UserBadges';
import { Skeleton } from '@/components/ui/skeleton';

interface SuggestedFoundersProps {
  displayMode?: 'list' | 'carousel';
}

export const SuggestedFounders = forwardRef<HTMLDivElement, SuggestedFoundersProps>(({ displayMode = 'list' }, ref) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [founders, setFounders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchFounders();
  }, [user]);

  const fetchFounders = async () => {
    setLoading(true);
    // Simple logic: fetch random founders who are not the current user
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, title, verified, is_mentor')
      .eq('user_type', 'founder')
      .neq('user_id', user?.id)
      .limit(displayMode === 'carousel' ? 10 : 5);

    if (data) setFounders(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <Card ref={ref} className="glass-card">
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (founders.length === 0) return null;

  if (displayMode === 'carousel') {
    return (
      <div ref={ref} className="mb-4">
        <h3 className="font-semibold text-sm mb-2 px-1">Founders you may connect</h3>
        <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 scrollbar-hide">
          {founders.map((founder) => (
            <Card key={founder.user_id} className="min-w-[150px] w-[150px] flex-shrink-0 glass-card">
              <CardContent className="p-3 flex flex-col items-center text-center gap-2">
                <Avatar 
                  className="h-16 w-16 cursor-pointer"
                  onClick={() => navigate(`/dashboard/profile/${founder.user_id}`)}
                >
                  <AvatarImage src={founder.avatar_url || ''} />
                  <AvatarFallback>{founder.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="w-full">
                  <div className="flex items-center justify-center gap-1 cursor-pointer hover:underline" onClick={() => navigate(`/dashboard/profile/${founder.user_id}`)}>
                    <p className="text-sm font-medium truncate">
                      {founder.full_name}
                    </p>
                    <UserBadges verified={founder.verified} isMentor={founder.is_mentor} size="sm" />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{founder.title || 'Founder'}</p>
                </div>
                <Button size="sm" variant="outline" className="w-full h-7 text-xs gap-1">
                  <UserPlus className="h-3 w-3" />
                  Connect
                </Button>
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
        <CardTitle className="text-sm font-semibold">Founders you may connect</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {founders.map((founder) => (
          <div key={founder.user_id} className="flex items-center gap-3">
            <Avatar 
              className="h-8 w-8 cursor-pointer"
              onClick={() => navigate(`/dashboard/profile/${founder.user_id}`)}
            >
              <AvatarImage src={founder.avatar_url || ''} />
              <AvatarFallback>{founder.full_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 cursor-pointer hover:underline" onClick={() => navigate(`/dashboard/profile/${founder.user_id}`)}>
                <p className="text-sm font-medium truncate">
                  {founder.full_name}
                </p>
                <UserBadges verified={founder.verified} isMentor={founder.is_mentor} size="sm" />
              </div>
              <p className="text-xs text-muted-foreground truncate">{founder.title || 'Founder'}</p>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
});

SuggestedFounders.displayName = 'SuggestedFounders';
