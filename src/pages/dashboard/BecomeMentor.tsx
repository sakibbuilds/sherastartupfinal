import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

// Note: This feature requires the 'mentor_applications' table to be created via database migration
const BecomeMentor = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Become a Mentor</CardTitle>
          </div>
          <CardDescription>
            Share your expertise and guide the next generation of founders.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium text-amber-500">Feature Coming Soon</p>
              <p className="text-sm text-muted-foreground mt-1">
                The mentor application system is currently being set up. Check back soon to apply as a mentor.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full">
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BecomeMentor;