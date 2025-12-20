import { cn } from '@/lib/utils';
import { usePresence } from '@/hooks/usePresence';

interface OnlineIndicatorProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function OnlineIndicator({ 
  userId, 
  size = 'md', 
  showLabel = false,
  className 
}: OnlineIndicatorProps) {
  const { isOnline } = usePresence();
  const online = isOnline(userId);

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3'
  };

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span 
        className={cn(
          'rounded-full flex-shrink-0',
          sizeClasses[size],
          online 
            ? 'bg-mint animate-pulse' 
            : 'bg-muted-foreground/40'
        )}
      />
      {showLabel && (
        <span className={cn(
          'text-xs',
          online ? 'text-mint' : 'text-muted-foreground'
        )}>
          {online ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  );
}

// Avatar wrapper with online indicator
interface AvatarWithPresenceProps {
  userId: string;
  children: React.ReactNode;
  indicatorPosition?: 'bottom-right' | 'top-right';
  indicatorSize?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AvatarWithPresence({
  userId,
  children,
  indicatorPosition = 'bottom-right',
  indicatorSize = 'md',
  className
}: AvatarWithPresenceProps) {
  const { isOnline } = usePresence();
  const online = isOnline(userId);

  const positionClasses = {
    'bottom-right': 'bottom-0 right-0',
    'top-right': 'top-0 right-0'
  };

  const sizeClasses = {
    sm: 'w-2 h-2 border',
    md: 'w-3 h-3 border-2',
    lg: 'w-4 h-4 border-2'
  };

  return (
    <div className={cn('relative inline-block', className)}>
      {children}
      <span 
        className={cn(
          'absolute rounded-full border-background',
          positionClasses[indicatorPosition],
          sizeClasses[indicatorSize],
          online 
            ? 'bg-mint' 
            : 'bg-muted-foreground/40'
        )}
      />
    </div>
  );
}
