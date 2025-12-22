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
import { Search, Trash2, CheckCircle, XCircle, MoreVertical, ExternalLink, Rocket } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';

const AdminStartups = () => {
  const [startups, setStartups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchStartups();
  }, []);

  const fetchStartups = async () => {
    setLoading(true);
    // Remove the join with profiles if foreign key is not set up correctly or name is different
    // Or try a simpler query first to debug
    const { data, error } = await supabase
      .from('startups')
      .select('*, profiles:founder_id(*)') // Fetch all profile fields to be safe
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Map the data to flatten the profile structure if needed
      const mappedData = data.map((s: any) => ({
        ...s,
        profiles: s.profiles // Keep it as is, access via profiles.full_name
      }));
      setStartups(mappedData);
    } else {
        console.error("Error fetching startups:", error);
        // Fallback fetch without join if relation fails
        const { data: simpleData, error: simpleError } = await supabase
            .from('startups')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (!simpleError && simpleData) {
            // Try to fetch profiles manually if join failed
            const founderIds = simpleData.map((s: any) => s.founder_id).filter(Boolean);
            if (founderIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('user_id, full_name')
                    .in('user_id', founderIds);
                
                if (profiles) {
                    const merged = simpleData.map((s: any) => ({
                        ...s,
                        profiles: profiles.find((p: any) => p.user_id === s.founder_id)
                    }));
                    setStartups(merged);
                    setLoading(false);
                    return;
                }
            }
            setStartups(simpleData);
        }
    }
    setLoading(false);
  };

  const handleVerifyStartup = async (startupId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('startups')
        .update({ verified: !currentStatus } as any)
        .eq('id', startupId);

      if (error) throw error;

      setStartups(startups.map(s => 
        s.id === startupId ? { ...s, verified: !currentStatus } : s
      ));
      
      toast({
        title: !currentStatus ? "Startup Verified" : "Verification Removed",
        description: `Startup status has been updated.`
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Database schema may need 'verified' column.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteStartup = async (startupId: string) => {
    if (!confirm('Are you sure you want to delete this startup?')) return;

    try {
      const { error } = await supabase
        .from('startups')
        .delete()
        .eq('id', startupId);

      if (error) throw error;

      setStartups(startups.filter(s => s.id !== startupId));
      toast({
        title: "Startup Removed",
        description: "Startup has been deleted."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete startup.",
        variant: "destructive"
      });
    }
  };

  const filteredStartups = startups.filter(startup => 
    startup.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    startup.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Startup Management</h1>
          <p className="text-muted-foreground">Manage listed startups</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search startups..."
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
              <TableHead>Startup</TableHead>
              <TableHead>Founder</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">Loading startups...</TableCell>
              </TableRow>
            ) : filteredStartups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">No startups found.</TableCell>
              </TableRow>
            ) : (
              filteredStartups.map((startup) => (
                <TableRow key={startup.id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden">
                        {startup.logo_url ? (
                          <img src={startup.logo_url} alt={startup.name} className="w-full h-full object-cover" />
                        ) : (
                          <Rocket className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">{startup.name}</span>
                          {startup.verified && <VerifiedBadge size="sm" />}
                        </div>
                        {startup.website && (
                          <a 
                            href={startup.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            Website <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {startup.profiles 
                      ? (Array.isArray(startup.profiles) 
                          ? startup.profiles[0]?.full_name 
                          : startup.profiles.full_name) 
                      : 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {startup.industry || 'Uncategorized'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {startup.stage || 'Idea'}
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
                        <DropdownMenuItem onClick={() => handleVerifyStartup(startup.id, startup.verified)}>
                          {startup.verified ? (
                            <>
                              <XCircle className="h-4 w-4 mr-2 text-yellow-500" />
                              Revoke Verification
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                              Verify Startup
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-500 focus:text-red-500"
                          onClick={() => handleDeleteStartup(startup.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Startup
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

export default AdminStartups;
