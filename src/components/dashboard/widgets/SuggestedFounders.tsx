import { useState, useEffect, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { UserBadges } from '@/components/common/UserBadges';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

interface SuggestedFoundersProps {
  displayMode?: 'list' | 'carousel';
}

export const SuggestedFounders = forwardRef<HTMLDivElement, SuggestedFoundersProps>(({ displayMode = 'list' }, ref) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [founders, setFounders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingIds, setConnectingIds] = useState<Set<string>>(new Set());
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchFounders();
      fetchExistingConnections();
    }
  }, [user]);

  const fetchExistingConnections = async () => {
    if (!user) return;
    
    const { data: matches } = await supabase
      .from('matches')
      .select('matched_user_id, status')
      .eq('user_id', user.id)
      .in('status', ['pending', 'accepted']);
    
    if (matches) {
      setConnectedIds(new Set(matches.map(m => m.matched_user_id)));
    }
  };

  const fetchFounders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, title, verified, is_mentor')
      .eq('user_type', 'founder')
      .neq('user_id', user?.id)
      .limit(displayMode === 'carousel' ? 10 : 5);

    if (data) setFounders(data);
    setLoading(false);
  };

  const handleConnect = async (founderId: string, founderName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || connectingIds.has(founderId) || connectedIds.has(founderId)) return;

    setConnectingIds(prev => new Set([...prev, founderId]));

    try {
      // Check if already matched
      const { data: existingMatch } = await supabase
        .from('matches')
        .select('id, status')
        .or(`and(user_id.eq.${user.id},matched_user_id.eq.${founderId}),and(user_id.eq.${founderId},matched_user_id.eq.${user.id})`)
        .maybeSingle();

      if (existingMatch) {
        if (existingMatch.status === 'accepted') {
          setConnectedIds(prev => new Set([...prev, founderId]));
          toast({ description: "Already connected!" });
          return;
        }
        if (existingMatch.status === 'pending') {
          setConnectedIds(prev => new Set([...prev, founderId]));
          toast({ description: "Request already sent!" });
          return;
        }
      }

      // Create match request
      const { error } = await supabase
        .from('matches')
        .insert({
          user_id: user.id,
          matched_user_id: founderId,
          status: 'pending'
        });

      if (error) throw error;

      // Send notification
      await supabase
        .from('notifications')
        .insert({
          user_id: founderId,
          type: 'connection_request',
          title: 'New Connection Request',
          message: `${user.user_metadata?.full_name || 'Someone'} wants to connect with you.`,
          reference_id: user.id,
          reference_type: 'profile'
        });

      setConnectedIds(prev => new Set([...prev, founderId]));
      toast({ description: `Connection request sent to ${founderName}!` });
    } catch (error) {
      console.error('Error connecting:', error);
      toast({ title: "Error", description: "Failed to send request", variant: "destructive" });
    } finally {
      setConnectingIds(prev => {
        const next = new Set(prev);
        next.delete(founderId);
        return next;
      });
    }
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
        <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 scrollbar-hide touch-pan-x">
          {founders.map((founder) => {
            const isConnected = connectedIds.has(founder.user_id);
            const isConnecting = connectingIds.has(founder.user_id);
            
            return (
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
                  <Button 
                    size="sm" 
                    variant={isConnected ? "secondary" : "outline"} 
                    className="w-full h-7 text-xs gap-1"
                    onClick={(e) => handleConnect(founder.user_id, founder.full_name, e)}
                    disabled={isConnecting || isConnected}
                  >
                    {isConnecting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : isConnected ? (
                      <>
                        <UserCheck className="h-3 w-3" />
                        Sent
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-3 w-3" />
                        Connect
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
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
        {founders.map((founder) => {
          const isConnected = connectedIds.has(founder.user_id);
          const isConnecting = connectingIds.has(founder.user_id);
          
          return (
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
              <Button 
                size="icon" 
                variant={isConnected ? "secondary" : "ghost"} 
                className="h-8 w-8 rounded-full"
                onClick={(e) => handleConnect(founder.user_id, founder.full_name, e)}
                disabled={isConnecting || isConnected}
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isConnected ? (
                  <UserCheck className="h-4 w-4" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
});

SuggestedFounders.displayName = 'SuggestedFounders';
