import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Check, X, ExternalLink, Loader2 } from 'lucide-react';

interface MentorApplication {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  expertise: string[];
  capabilities: string;
  case_style: string;
  cv_url?: string;
  demo_video_url?: string;
  portfolio_url?: string;
  website?: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

const AdminMentorships = () => {
  const [applications, setApplications] = useState<MentorApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('mentor_applications')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      // Fallback if table missing
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected', userId: string) => {
    try {
      // 1. Update application status
      const { error: appError } = await supabase
        .from('mentor_applications')
        .update({ status })
        .eq('id', id);

      if (appError) throw appError;

      // 2. If approved, update user profile to is_mentor = true
      if (status === 'approved') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ is_mentor: true })
          .eq('user_id', userId);

        if (profileError) throw profileError;
      }

      toast({ title: "Success", description: `Application ${status}` });
      setApplications(prev => prev.filter(app => app.id !== id));
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: "Error", description: "Could not update application", variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Mentorship Applications</h1>
      <div className="space-y-4">
        {applications.length === 0 ? (
          <p className="text-muted-foreground">No pending applications.</p>
        ) : (
          applications.map((app) => (
            <Card key={app.id} className="glass-card">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{app.profiles.full_name}</CardTitle>
                    <CardDescription>Applied on {new Date(app.created_at).toLocaleDateString()}</CardDescription>
                  </div>
                  <Badge>{app.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-1">Expertise</h4>
                  <div className="flex gap-2 flex-wrap">
                    {app.expertise?.map(e => <Badge key={e} variant="secondary">{e}</Badge>)}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-1">Capabilities / Bio</h4>
                  <p className="text-sm text-muted-foreground">{app.capabilities}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-1">Case Style</h4>
                  <p className="text-sm text-muted-foreground">{app.case_style}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {app.cv_url && (
                    <a href={app.cv_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                      <ExternalLink className="h-4 w-4" /> CV / Resume
                    </a>
                  )}
                  {app.demo_video_url && (
                    <a href={app.demo_video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                      <ExternalLink className="h-4 w-4" /> Demo Video
                    </a>
                  )}
                  {app.portfolio_url && (
                    <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                      <ExternalLink className="h-4 w-4" /> Portfolio
                    </a>
                  )}
                  {app.website && (
                    <a href={app.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                      <ExternalLink className="h-4 w-4" /> Website
                    </a>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="destructive" onClick={() => handleStatusUpdate(app.id, 'rejected', app.user_id)}>
                    <X className="mr-2 h-4 w-4" /> Reject
                  </Button>
                  <Button onClick={() => handleStatusUpdate(app.id, 'approved', app.user_id)}>
                    <Check className="mr-2 h-4 w-4" /> Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminMentorships;
