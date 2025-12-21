import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap } from 'lucide-react';

interface UniversityNetworkProps {
  displayMode?: 'list' | 'carousel';
}

export const UniversityNetwork = ({ displayMode = 'list' }: UniversityNetworkProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [network, setNetwork] = useState<any[]>([]);
  const [university, setUniversity] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchNetwork();
  }, [user]);

  const fetchNetwork = async () => {
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
        .select('user_id, full_name, avatar_url, title')
        .eq('university', userData.university)
        .neq('user_id', user?.id)
        .limit(displayMode === 'carousel' ? 10 : 5);

      if (data) setNetwork(data);
    }
  };

  if (!university || network.length === 0) return null;

  if (displayMode === 'carousel') {
    return (
      <div className="mb-4">
        <h3 className="font-semibold text-sm mb-2 px-1 flex items-center gap-2">
          <GraduationCap className="h-4 w-4" /> Your University Network
        </h3>
        <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 scrollbar-hide">
          {network.map((person) => (
            <Card key={person.user_id} className="min-w-[150px] w-[150px] flex-shrink-0">
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
            <Button variant="link" className="text-xs" onClick={() => navigate('/dashboard/match')}>
              View all
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
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
              <p 
                className="text-sm font-medium truncate cursor-pointer hover:underline"
                onClick={() => navigate(`/dashboard/profile/${person.user_id}`)}
              >
                {person.full_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">{person.title || 'Student'}</p>
            </div>
          </div>
        ))}
        <Button variant="link" className="w-full text-xs h-auto p-0" onClick={() => navigate('/dashboard/match')}>
          View all from {university}
        </Button>
      </CardContent>
    </Card>
  );
};
