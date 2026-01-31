import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, MoreVertical, GraduationCap, Trash2, CheckCircle, XCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';

const AdminMentors = () => {
  const [mentors, setMentors] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchMentors();
    fetchApplications();
  }, []);

  const fetchMentors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_type', 'mentor')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMentors(data);
    }
    setLoading(false);
  };

  const fetchApplications = async () => {
    const { data, error } = await supabase
      .from('mentor_applications')
      .select('*, profiles:user_id(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setApplications(data);
    }
  };

  const handleApprove = async (applicationId: string, userId: string) => {
    try {
      // 1. Update mentor_applications table
      const { error: appError } = await supabase
        .from('mentor_applications')
        .update({ status: 'approved' })
        .eq('id', applicationId);
      if (appError) throw appError;

      // 2. Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ user_type: 'mentor' })
        .eq('user_id', userId);
      if (profileError) throw profileError;
      
      // 3. Update UI
      setApplications(applications.filter(app => app.id !== applicationId));
      fetchMentors(); // Refresh mentor list
      toast({
        title: "Application Approved",
        description: "The user is now a mentor.",
      });

    } catch (error) {
      toast({
        title: "Error Approving Application",
        description: "Could not approve the application.",
        variant: "destructive",
      });
    }
  };
  
  const handleReject = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from('mentor_applications')
        .update({ status: 'rejected' })
        .eq('id', applicationId);
      if (error) throw error;
      
      setApplications(applications.filter(app => app.id !== applicationId));
      toast({
        title: "Application Rejected",
        description: "The application has been rejected.",
      });

    } catch (error) {
      toast({
        title: "Error Rejection Application",
        description: "Could not reject the application.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this mentor?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      setMentors(mentors.filter(m => m.user_id !== userId));
      toast({
        title: "Mentor Removed",
        description: "Mentor has been removed from the platform."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove mentor.",
        variant: "destructive"
      });
    }
  };

  const handleVerifyUser = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verified: !currentStatus } as any)
        .eq('user_id', userId);

      if (error) throw error;

      setMentors(mentors.map(m =>
        m.user_id === userId ? { ...m, verified: !currentStatus } : m
      ));

      toast({
        title: !currentStatus ? "Mentor Verified" : "Verification Removed",
        description: `Mentor status has been updated.`
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Database schema may need 'verified' column.",
        variant: "destructive"
      });
    }
  };

  const filteredMentors = mentors.filter(mentor =>
    mentor.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mentor.expertise?.some((e: string) => e.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Mentor Management</h1>
          <p className="text-muted-foreground">Manage platform mentors and applications.</p>
        </div>
      </div>
      
      {/* Mentor Applications */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Pending Applications</h2>
        <div className="rounded-md border border-white/10 overflow-hidden bg-black/20 backdrop-blur-sm">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead>Applicant</TableHead>
                <TableHead>Expertise</TableHead>
                <TableHead>Links</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">Loading applications...</TableCell>
                </TableRow>
              ) : applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">No pending applications.</TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow key={app.id} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={app.profiles?.avatar_url} />
                          <AvatarFallback>{app.profiles?.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-semibold">{app.profiles?.full_name}</span>
                          <p className="text-xs text-muted-foreground">{app.profiles?.title}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {app.expertise?.slice(0, 3).map((skill: string) => (
                          <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <a href={app.cv_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">CV</a>
                        <a href={app.demo_video_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Demo</a>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button onClick={() => handleApprove(app.id, app.user_id)} size="sm" variant="ghost" className="text-green-500 hover:bg-green-500/10">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button onClick={() => handleReject(app.id)} size="sm" variant="ghost" className="text-red-500 hover:bg-red-500/10 ml-2">
                         <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Existing Mentors */}
      <div className="space-y-4">
         <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Current Mentors</h2>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search mentors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 bg-white/5 border-white/10"
              />
            </div>
         </div>
        <div className="rounded-md border border-white/10 overflow-hidden bg-black/20 backdrop-blur-sm">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead>Mentor</TableHead>
                <TableHead>Expertise</TableHead>
                <TableHead>University</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">Loading mentors...</TableCell>
                </TableRow>
              ) : filteredMentors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">No mentors found.</TableCell>
                </TableRow>
              ) : (
                filteredMentors.map((mentor) => (
                  <TableRow key={mentor.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={mentor.avatar_url} />
                          <AvatarFallback>{mentor.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold">{mentor.full_name}</span>
                            {mentor.verified && <VerifiedBadge size="sm" />}
                          </div>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {mentor.title || 'Mentor'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {mentor.expertise?.slice(0, 2).map((skill: string) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {mentor.expertise?.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{mentor.expertise.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {mentor.university ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <GraduationCap className="h-3 w-3 text-muted-foreground" />
                          {mentor.university}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={mentor.verified
                          ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                          : "bg-zinc-500/20 text-zinc-400 hover:bg-zinc-500/30"}
                      >
                        {mentor.verified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleVerifyUser(mentor.user_id, mentor.verified)}>
                            {mentor.verified ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2 text-yellow-500" />
                                Revoke Verification
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                Verify Mentor
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-500 focus:text-red-500"
                            onClick={() => handleDeleteUser(mentor.user_id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Mentor
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AdminMentors;
