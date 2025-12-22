import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const VerifiedBadge = ({ className, size = 'md' }: VerifiedBadgeProps) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={cn("inline-flex items-center justify-center", className)} title="Verified">
      <BadgeCheck 
        className={cn(
          "text-white fill-primary", // Twitter style: Solid filled shape with white check
          sizeClasses[size]
        )} 
      />
    </div>
  );
};
