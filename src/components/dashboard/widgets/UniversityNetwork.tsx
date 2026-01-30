import { useState, useEffect, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap } from 'lucide-react';
import { UserBadges } from '@/components/common/UserBadges';
import { Skeleton } from '@/components/ui/skeleton';

interface UniversityNetworkProps {
  displayMode?: 'list' | 'carousel';
}

export const UniversityNetwork = forwardRef<HTMLDivElement, UniversityNetworkProps>(({ displayMode = 'list' }, ref) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [network, setNetwork] = useState<any[]>([]);
  const [university, setUniversity] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchNetwork();
  }, [user]);

  const fetchNetwork = async () => {
    setLoading(true);
    // First get user's university
    const { data: userData } = await supabase
      .from('profiles')
      .select('university')
      .eq('user_id', user?.id)
      .single();

    if (userData?.university) {
      setUniversity(userData.university);
      
      const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, title, verified, is_mentor')
      .eq('university', university)
      .neq('user_id', user?.id)
      .limit(displayMode === 'carousel' ? 10 : 5);

      if (data) setNetwork(data);
    }
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

  if (!university || network.length === 0) return null;

  if (displayMode === 'carousel') {
    return (
      <div ref={ref} className="mb-4">
        <h3 className="font-semibold text-sm mb-2 px-1 flex items-center gap-2">
          <GraduationCap className="h-4 w-4" /> Your University Network
        </h3>
        <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 scrollbar-hide">
          {network.map((person) => (
            <Card key={person.user_id} className="min-w-[150px] w-[150px] flex-shrink-0 glass-card">
              <CardContent className="p-3 flex flex-col items-center text-center gap-2">
                <Avatar 
                  className="h-16 w-16 cursor-pointer"
                  onClick={() => navigate(`/dashboard/profile/${person.user_id}`)}
                >
                  <AvatarImage src={person.avatar_url || ''} />
                  <AvatarFallback>{person.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="w-full">
                  <p 
                    className="text-sm font-medium truncate cursor-pointer hover:underline"
                    onClick={() => navigate(`/dashboard/profile/${person.user_id}`)}
                  >
                    {person.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{person.title || 'Student'}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          <div className="min-w-[100px] flex items-center justify-center">
            <Button variant="link" className="text-xs" onClick={() => navigate('/dashboard/network')}>
              View all
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card ref={ref} className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          Your University Network
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {network.map((person) => (
          <div key={person.user_id} className="flex items-center gap-3">
            <Avatar 
              className="h-8 w-8 cursor-pointer"
              onClick={() => navigate(`/dashboard/profile/${person.user_id}`)}
            >
              <AvatarImage src={person.avatar_url || ''} />
              <AvatarFallback>{person.full_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 cursor-pointer hover:underline" onClick={() => navigate(`/dashboard/profile/${person.user_id}`)}>
                <p className="text-sm font-medium truncate">
                  {person.full_name}
                </p>
                <UserBadges verified={person.verified} isMentor={person.is_mentor} size="sm" />
              </div>
              <p className="text-xs text-muted-foreground truncate">{person.title || 'Student'}</p>
            </div>
          </div>
        ))}
        <Button variant="link" className="w-full text-xs h-auto p-0" onClick={() => navigate('/dashboard/network')}>
          View all from {university}
        </Button>
      </CardContent>
    </Card>
  );
});

UniversityNetwork.displayName = 'UniversityNetwork';
