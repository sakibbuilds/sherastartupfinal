import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, Check, X, ExternalLink } from 'lucide-react';

interface Application {
  id: string;
  user_id: string;
  expertise: string[];
  capabilities: string;
  cv_url: string;
  demo_video_url: string;
  website: string;
  portfolio_url: string;
  case_style: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

const AdminMentorships = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('mentor_applications')
      .select('*, profiles(full_name, avatar_url)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to fetch applications', variant: 'destructive' });
    } else {
      setApplications(data as any || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: 'approved' | 'rejected', userId: string) => {
    try {
      const { error } = await supabase
        .from('mentor_applications')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      if (newStatus === 'approved') {
        // Update user role and profile type
        await supabase
          .from('user_roles')
          .upsert({ user_id: userId, role: 'mentor' });
        
        await supabase
          .from('profiles')
          .update({ user_type: 'mentor' })
          .eq('user_id', userId);
      }

      toast({ title: `Application ${newStatus}`, description: `User has been ${newStatus}.` });
      fetchApplications();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Mentorship Applications</h1>
      <div className="space-y-4">
        {applications.length === 0 ? (
          <p className="text-muted-foreground">No pending applications.</p>
        ) : (
          applications.map((app) => (
            <Card key={app.id}>
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
