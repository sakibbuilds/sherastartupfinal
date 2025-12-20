import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Rocket } from 'lucide-react';

interface StartupBadgeProps {
  startup: {
    id: string;
    name: string;
  };
  className?: string;
}

export const StartupBadge = ({ startup, className }: StartupBadgeProps) => {
  const navigate = useNavigate();

  return (
    <Badge 
      variant="secondary" 
      className={`gap-1 cursor-pointer hover:bg-primary/20 transition-colors ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/dashboard/startups/${startup.id}`);
      }}
    >
      <Rocket className="h-3 w-3" />
      {startup.name}
    </Badge>
  );
};
