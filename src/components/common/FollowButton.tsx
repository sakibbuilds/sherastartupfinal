import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  targetUserId: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  hideIfFollowing?: boolean;
}

export const FollowButton = ({ targetUserId, className, variant = "default", size = "sm", hideIfFollowing = false }: FollowButtonProps) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle();

      setIsFollowing(!!data);
      setLoading(false);
    };

    checkFollowStatus();
  }, [user, targetUserId]);

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigating to profile if button is inside a card
    
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be logged in to follow users.",
        variant: "destructive",
      });
      return;
    }

    if (user.id === targetUserId) {
       toast({
        title: "Cannot follow yourself",
        description: "You cannot follow your own account.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);

        if (error) throw error;
        setIsFollowing(false);
        toast({ description: "Unfollowed user" });
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId
          });

        if (error) throw error;
        setIsFollowing(true);
        toast({ description: "Following user" });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: "Error",
        description: "Could not update follow status.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return null; // Or a skeleton/spinner if preferred

  // Don't show button for own profile
  if (user?.id === targetUserId) return null;

  // Don't show if already following and hideIfFollowing is true
  if (isFollowing && hideIfFollowing) return null;

  return (
    <Button
      variant={isFollowing ? "secondary" : variant}
      size={size}
      className={cn("gap-2 transition-all", className)}
      onClick={handleFollow}
      disabled={processing}
    >
      {processing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="h-4 w-4" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          Follow
        </>
      )}
    </Button>
  );
};