import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PresenceContextType {
  onlineUsers: Set<string>;
  isOnline: (userId: string) => boolean;
  onlineCount: number;
}

const PresenceContext = createContext<PresenceContextType>({
  onlineUsers: new Set(),
  isOnline: () => false,
  onlineCount: 0
});

export const PresenceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = new Set<string>();
        
        Object.keys(state).forEach((key) => {
          online.add(key);
        });
        
        setOnlineUsers(online);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers(prev => new Set([...prev, key]));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
            status: 'online'
          });
        }
      });

    // Update presence on visibility change
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await channel.track({
          user_id: user.id,
          online_at: new Date().toISOString(),
          status: 'online'
        });
      } else {
        await channel.track({
          user_id: user.id,
          online_at: new Date().toISOString(),
          status: 'away'
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Heartbeat to keep presence alive
    const heartbeat = setInterval(async () => {
      if (document.visibilityState === 'visible') {
        await channel.track({
          user_id: user.id,
          online_at: new Date().toISOString(),
          status: 'online'
        });
      }
    }, 30000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(heartbeat);
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isOnline = useCallback((userId: string) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  return (
    <PresenceContext.Provider value={{ onlineUsers, isOnline, onlineCount: onlineUsers.size }}>
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = () => useContext(PresenceContext);
