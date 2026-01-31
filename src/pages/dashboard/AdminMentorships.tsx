import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X, Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const AdminMentorships = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('mentor_applications')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: 'Error Fetching Applications',
        description: error.message,
        variant: 'destructive',
      });
    } else if (data) {
      setApplications(data);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (applicationId: string, userId: string, newStatus: 'approved' | 'rejected') => {
    setUpdatingId(applicationId);
    try {
      // 1. Update the application status
      const { error: appError } = await supabase
        .from('mentor_applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (appError) throw appError;

      // 2. If approved, update the user's role
      if (newStatus === 'approved') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ user_type: 'mentor' })
          .eq('user_id', userId);

        if (profileError) throw profileError;
      }

      // 3. Update UI
      setApplications(prev => prev.filter(app => app.id !== applicationId));
      toast({
        title: `Application ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
        description: `The application has been successfully ${newStatus}.`,
      });

    } catch (error) {
      toast({
        title: 'Update Failed',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Mentor Applications</h1>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Pending Applications</CardTitle>
          <CardDescription>
            Review and approve or reject applications from users who want to become mentors.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-white/10">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead>Applicant</TableHead>
                  <TableHead>Expertise</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Applied At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No pending applications.
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((app) => (
                    <TableRow key={app.id} className="border-white/10 hover:bg-white/5">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={app.profile?.avatar_url} />
                            <AvatarFallback>{app.profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{app.profile?.full_name}</div>
                            <div className="text-sm text-muted-foreground">{app.profile?.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {app.expertise_areas?.map((area: string) => (
                            <Badge key={area} variant="outline" className="capitalize">{area}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{app.reason}</TableCell>
                      <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(app.id, app.user_id, 'rejected')}
                            disabled={updatingId === app.id}
                            className="border-red-500 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(app.id, app.user_id, 'approved')}
                            disabled={updatingId === app.id}
                            className="border-green-500 text-green-500 hover:bg-green-500/10 hover:text-green-400"
                          >
                             {updatingId === app.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                            Approve
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMentorships;
