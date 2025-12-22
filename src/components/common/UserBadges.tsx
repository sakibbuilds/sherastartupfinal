import { BadgeCheck, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface UserBadgesProps {
  verified?: boolean;
  isMentor?: boolean;
  userType?: 'founder' | 'investor' | 'admin' | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const UserBadges = ({ verified, isMentor, userType, className, size = 'md' }: UserBadgesProps) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const badgeSize = sizeClasses[size];

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      {/* Verified Badge */}
      {verified && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center justify-center cursor-help">
                <BadgeCheck 
                  className={cn(
                    "text-white fill-blue-500", // Standard blue verified badge
                    badgeSize
                  )} 
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Verified User</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Mentor Badge */}
      {isMentor && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center justify-center cursor-help">
                <div className={cn(
                  "rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500",
                  size === 'sm' ? 'p-0.5' : 'p-1'
                )}>
                  <GraduationCap className={badgeSize} />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Verified Mentor</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* User Type Badge (Founder/Investor) - Only show if specifically requested or useful context */}
      {/* 
      {userType === 'investor' && (
        <Badge variant="outline" className="text-[10px] h-4 px-1 border-emerald-500/30 text-emerald-500 bg-emerald-500/5">
          Investor
        </Badge>
      )}
      */}
    </div>
  );
};
