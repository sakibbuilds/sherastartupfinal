import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Rocket, User, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const AdminVerification = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [startups, setStartups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const [selectedUserFullInfo, setSelectedUserFullInfo] = useState<any | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const viewDetails = (request: any) => {
    setSelectedUserFullInfo(request);
    setDetailsDialogOpen(true);
  };
  // Rejection Dialog State
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRejectType, setSelectedRejectType] = useState<'user' | 'startup'>('user');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedRejectId, setSelectedRejectId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    
    // Fetch pending verification requests
    const { data: requests, error } = await supabase
      .from('verification_requests')
      .select('*, profiles:user_id(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (requests) {
      setUsers(requests);
    } else if (error) {
      console.warn("Could not fetch verification_requests table, falling back to profile check", error);
       // Fallback: Fetch unverified users with complete profiles (Legacy)
       const { data: userData } = await supabase
       .from('profiles')
       .select('*')
       .not('avatar_url', 'is', null)
       .limit(20);
 
        if (userData) {
          const candidates = userData.filter(u => !u.verified && u.bio && u.bio.length > 20);
          setUsers(candidates.map(u => ({
            id: 'legacy_' + u.id,
            user_id: u.user_id,
            full_name: u.full_name,
            reason: u.bio, // Use bio as reason for legacy
            linkedin_url: u.linkedin_url,
            profiles: u,
            is_legacy: true
          })));
        }
    }

    // Fetch unverified startups (Keep existing logic for startups for now)
    const { data: startupData } = await supabase
      .from('startups')
      .select('*, profiles(full_name)')
      .not('logo_url', 'is', null)
      .limit(50);

    if (startupData) {
      const candidates = startupData.filter(s => 
        !s.verified && 
        s.description && s.description.length > 50 &&
        s.website
      );
      setStartups(candidates);
    }
    
    setLoading(false);
  };

  const handleApprove = async (type: 'user' | 'startup', id: string, requestId?: string) => {
    const table = type === 'user' ? 'profiles' : 'startups';
    const idField = type === 'user' ? 'user_id' : 'id';

    try {
      // 1. Update the main entity (profile or startup)
      const { error } = await supabase
        .from(table)
        .update({ verified: true } as any)
        .eq(idField, id);

      if (error) throw error;

      // 2. If it's a request from the new table, update the request status
      if (requestId && type === 'user') {
        const { error: reqError } = await supabase
          .from('verification_requests')
          .update({ status: 'approved' } as any)
          .eq('id', requestId);
          
         if (reqError) console.warn("Failed to update request status", reqError);
      }

      if (type === 'user') {
        if (requestId) {
          setUsers(prev => prev.filter(u => u.id !== requestId));
        } else {
          setUsers(prev => prev.filter(u => u.user_id !== id));
        }
      } else {
        setStartups(prev => prev.filter(s => s.id !== id));
      }

      toast({
        title: "Approved",
        description: `${type === 'user' ? 'User' : 'Startup'} has been verified.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update verification status.",
        variant: "destructive"
      });
    }
  };

  const openRejectDialog = (type: 'user' | 'startup', id: string, requestId?: string) => {
    setSelectedRejectType(type);
    setSelectedRejectId(id);
    setSelectedRequestId(requestId || null);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const confirmRejection = async () => {
    if (!selectedRejectId) return;
    setRejecting(true);

    try {
      if (selectedRequestId && selectedRejectType === 'user') {
        // Try to update with reason first
        const { error } = await supabase
          .from('verification_requests')
          .update({ 
            status: 'rejected',
            rejection_reason: rejectionReason 
          } as any)
          .eq('id', selectedRequestId);
          
        if (error) {
          console.warn("Failed to update with reason, trying status only", error);
          // Fallback: Try updating only status
          const { error: fallbackError } = await supabase
            .from('verification_requests')
            .update({ status: 'rejected' } as any)
            .eq('id', selectedRequestId);
            
          if (fallbackError) throw fallbackError;
        }
      }

      // Remove from list
      if (selectedRejectType === 'user') {
        // Use request ID if available for more precise removal, otherwise fallback to user_id
        if (selectedRequestId) {
           setUsers(prev => prev.filter(u => u.id !== selectedRequestId));
        } else {
           setUsers(prev => prev.filter(u => u.user_id !== selectedRejectId));
        }
      } else {
        setStartups(prev => prev.filter(s => s.id !== selectedRejectId));
      }

      toast({
        title: "Declined",
        description: "Request has been rejected."
      });
      
      setRejectDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to reject request.",
        variant: "destructive"
      });
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Verification Requests</h1>
        <p className="text-muted-foreground">Review and approve verification for users and startups</p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="users" className="data-[state=active]:bg-primary/20">
            Users ({users.length})
          </TabsTrigger>
          <TabsTrigger value="startups" className="data-[state=active]:bg-primary/20">
            Startups ({startups.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          {loading ? (
            <div className="text-center py-12">Loading candidates...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed border-white/10 rounded-lg">
              No pending user verifications found.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {users.map((request) => (
                <Card key={request.id} className="glass-card">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.profiles?.avatar_url} />
                        <AvatarFallback>{request.full_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold">{request.full_name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {request.profiles?.user_type || 'User'}
                          {request.is_legacy && <Badge variant="secondary" className="ml-2 text-[10px]">Legacy</Badge>}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <div className="text-sm bg-white/5 p-3 rounded-md">
                        <span className="text-muted-foreground text-xs block mb-1">
                          {request.is_legacy ? 'Bio' : 'Reason for Verification'}
                        </span>
                        <p className="line-clamp-3 italic">"{request.reason}"</p>
                      </div>
                      
                      {request.linkedin_url && (
                        <a 
                          href={request.linkedin_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-400 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" /> LinkedIn Profile
                        </a>
                      )}

                      {request.document_url && (
                        <a 
                          href={request.document_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-green-400 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" /> View Document
                        </a>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        variant="secondary"
                        className="flex-1"
                        onClick={() => viewDetails(request)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                      <Button 
                        className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-500 border border-green-500/50"
                        onClick={() => handleApprove('user', request.user_id, request.is_legacy ? undefined : request.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button 
                        variant="outline"
                        className="flex-1 border-red-500/50 text-red-500 hover:bg-red-500/10"
                        onClick={() => openRejectDialog('user', request.user_id, request.is_legacy ? undefined : request.id)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="startups" className="mt-6">
          {loading ? (
            <div className="text-center py-12">Loading candidates...</div>
          ) : startups.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed border-white/10 rounded-lg">
              No pending startup verifications found.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {startups.map((startup) => (
                <Card key={startup.id} className="glass-card">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden">
                        {startup.logo_url ? (
                          <img src={startup.logo_url} alt={startup.name} className="w-full h-full object-cover" />
                        ) : (
                          <Rocket className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold">{startup.name}</h3>
                        <p className="text-sm text-muted-foreground">by {startup.profiles?.full_name}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <Badge variant="outline">{startup.industry}</Badge>
                      <div className="text-sm bg-white/5 p-3 rounded-md">
                        <span className="text-muted-foreground text-xs block mb-1">Description</span>
                        <p className="line-clamp-3">{startup.description}</p>
                      </div>
                      {startup.website && (
                        <a 
                          href={startup.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-400 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" /> Website
                        </a>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-500 border border-green-500/50"
                        onClick={() => handleApprove('startup', startup.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button 
                        variant="outline"
                        className="flex-1 border-red-500/50 text-red-500 hover:bg-red-500/10"
                        onClick={() => openRejectDialog('startup', startup.id)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-white/10">
          <DialogHeader>
            <DialogTitle>Reject Verification Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request. This will be visible to the user.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="e.g. Document unclear, Profile incomplete..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={rejecting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRejection} disabled={rejecting}>
              {rejecting ? "Rejecting..." : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-zinc-950 border-white/10 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Verification Details</DialogTitle>
            <DialogDescription>Review the information submitted by the user.</DialogDescription>
          </DialogHeader>
          
          {selectedUserFullInfo && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUserFullInfo.profiles?.avatar_url} />
                  <AvatarFallback>{selectedUserFullInfo.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{selectedUserFullInfo.full_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">{selectedUserFullInfo.profiles?.user_type || 'User'}</Badge>
                    <span className="text-xs text-muted-foreground">ID: {selectedUserFullInfo.user_id}</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Reason for Verification</Label>
                  <div className="p-4 bg-white/5 rounded-lg text-sm leading-relaxed border border-white/10">
                    {selectedUserFullInfo.reason}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">LinkedIn Profile</Label>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between">
                      <span className="text-sm truncate max-w-[200px]">{selectedUserFullInfo.linkedin_url || 'Not provided'}</span>
                      {selectedUserFullInfo.linkedin_url && (
                        <a href={selectedUserFullInfo.linkedin_url} target="_blank" rel="noreferrer">
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Supporting Document</Label>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between">
                      <span className="text-sm truncate max-w-[200px]">
                        {selectedUserFullInfo.document_url ? 'Document Attached' : 'No document provided'}
                      </span>
                      {selectedUserFullInfo.document_url && (
                        <a href={selectedUserFullInfo.document_url} target="_blank" rel="noreferrer">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-green-400 hover:text-green-300">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                
                {selectedUserFullInfo.profiles?.bio && (
                   <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Profile Bio</Label>
                    <div className="p-4 bg-white/5 rounded-lg text-sm text-muted-foreground border border-white/10">
                      {selectedUserFullInfo.profiles.bio}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>Close</Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                variant="destructive" 
                className="flex-1 sm:flex-none"
                onClick={() => {
                  setDetailsDialogOpen(false);
                  openRejectDialog('user', selectedUserFullInfo.user_id, selectedUserFullInfo.is_legacy ? undefined : selectedUserFullInfo.id);
                }}
              >
                Reject
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                onClick={() => {
                  setDetailsDialogOpen(false);
                  handleApprove('user', selectedUserFullInfo.user_id, selectedUserFullInfo.is_legacy ? undefined : selectedUserFullInfo.id);
                }}
              >
                Approve Request
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVerification;
