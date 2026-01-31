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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Trash2, CheckCircle, XCircle, MoreVertical, Loader2 } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  };

  const handleVerifyUser = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verified: !currentStatus } as any)
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(users.map(u => 
        u.user_id === userId ? { ...u, verified: !currentStatus } : u
      ));
      
      toast({
        title: !currentStatus ? "User Verified" : "Verification Removed",
        description: `User status has been updated.`
      });
    } catch (error) {
      console.error('Verification update failed:', error);
      toast({
        title: "Update Failed",
        description: "Could not update user verification status.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('This will permanently delete the user and all their associated data (startups, pitches, etc). This action cannot be undone. Are you sure?')) return;

    setDeletingUser(userId);
    try {
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
      });

      if (error) {
        // The error object from a function invocation might have more details
        // in the 'context' or a nested 'error' property.
        const errorMessage = error.context?.body?.error || error.message;
        throw new Error(errorMessage);
      }

      setUsers(prevUsers => prevUsers.filter(u => u.user_id !== userId));
      toast({
        title: "User Removed",
        description: "The user has been successfully removed from the platform.",
      });
    } catch (error) {
      console.error('Deletion failed:', error);
      toast({
        title: "Deletion Failed",
        description: `An error occurred: ${(error as Error).message}. If this persists, check the function logs in your Supabase dashboard.`,
        variant: "destructive"
      });
    } finally {
      setDeletingUser(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.user_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage all registered users</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
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
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">Loading users...</TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">No users found.</TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.user_id} className={`border-white/10 hover:bg-white/5 ${deletingUser === user.user_id ? 'opacity-50 pointer-events-none' : ''}`}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>{user.full_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">{user.full_name}</span>
                          {user.verified && <VerifiedBadge size="sm" />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {user.title || 'No title'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {user.user_type || 'User'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={user.onboarding_completed 
                        ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" 
                        : "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"}
                    >
                      {user.onboarding_completed ? 'Active' : 'Incomplete'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={deletingUser === user.user_id}>
                          {deletingUser === user.user_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleVerifyUser(user.user_id, user.verified)}>
                          {user.verified ? (
                            <>
                              <XCircle className="h-4 w-4 mr-2 text-yellow-500" />
                              Revoke Verification
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                              Verify User
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-500 focus:text-red-500"
                          onClick={() => handleDeleteUser(user.user_id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Ban / Remove
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
  );
};

export default AdminUsers;
