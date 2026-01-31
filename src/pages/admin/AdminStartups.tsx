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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Trash2, CheckCircle, XCircle, MoreVertical, Rocket, XSquare, PlusCircle, Edit } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';

const AdminStartups = () => {
  const [startups, setStartups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStartups, setSelectedStartups] = useState<Set<string>>(new Set());
  const [editingStartup, setEditingStartup] = useState<any | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchStartups();
  }, []);

  const fetchStartups = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('startups')
      .select('*, profiles:founder_id(user_id, full_name)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setStartups(data);
    } else {
      console.error("Error fetching startups with join:", error);
      const { data: startupsData, error: startupsError } = await supabase.from('startups').select('*').order('created_at', { ascending: false });
      if (startupsError) {
        setStartups([]);
      } else if (startupsData) {
        const founderIds = startupsData.map(s => s.founder_id).filter(Boolean);
        if (founderIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('user_id, full_name').in('user_id', founderIds);
          if (profilesError) {
            setStartups(startupsData);
          } else {
            const profilesMap = new Map(profilesData.map(p => [p.user_id, p.full_name]));
            const mergedData = startupsData.map(s => ({ ...s, profiles: { full_name: profilesMap.get(s.founder_id) } }));
            setStartups(mergedData);
          }
        } else {
          setStartups(startupsData);
        }
      }
    }
    setLoading(false);
  };

  const handleSelectAll = () => {
    const currentIds = filteredStartups.map(s => s.id);
    if (selectedStartups.size === currentIds.length) {
      setSelectedStartups(new Set());
    } else {
      setSelectedStartups(new Set(currentIds));
    }
  };

  const handleSelectStartup = (startupId: string) => {
    const newSelected = new Set(selectedStartups);
    if (newSelected.has(startupId)) newSelected.delete(startupId); else newSelected.add(startupId);
    setSelectedStartups(newSelected);
  };

  const handleVerifyStartup = async (startupId: string, currentStatus: boolean) => {
    const { error } = await supabase.from('startups').update({ verified: !currentStatus }).eq('id', startupId);
    if (error) toast({ title: "Update Failed", variant: "destructive" });
    else {
      setStartups(startups.map(s => s.id === startupId ? { ...s, verified: !currentStatus } : s));
      toast({ title: !currentStatus ? "Startup Verified" : "Verification Removed" });
    }
  };

  const handleDelete = async (startupIds: string[]) => {
    if (!confirm(`Are you sure you want to delete ${startupIds.length} startup(s)?`)) return;
    const { error } = await supabase.functions.invoke('delete-user', { body: { startupIds } });
    if (error) toast({ title: "Error deleting startup(s)", description: (error as Error).message, variant: "destructive" });
    else {
      setStartups(startups.filter(s => !startupIds.includes(s.id)));
      const newSelected = new Set(selectedStartups);
      startupIds.forEach(id => newSelected.delete(id));
      setSelectedStartups(newSelected);
      toast({ title: `${startupIds.length} startup(s) deleted.` });
    }
  };

  const handleSaveStartup = async () => {
    if (!editingStartup) return;
    const { profiles, ...startupData } = editingStartup;

    const { data, error } = await supabase
      .from('startups')
      .upsert(startupData)
      .select('*, profiles:founder_id(user_id, full_name)')
      .single();

    if (error) {
      toast({ title: "Save Failed", description: error.message, variant: "destructive" });
    } else {
      if (startups.some(s => s.id === data.id)) {
        setStartups(startups.map(s => s.id === data.id ? data : s));
      } else {
        setStartups([data, ...startups]);
      }
      toast({ title: "Startup Saved" });
      setEditingStartup(null);
    }
  };

  const filteredStartups = startups.filter(startup => 
    startup.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    startup.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    startup.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Startup Management</h1>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search startups..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 bg-white/5 border-white/10" />
          </div>
          <Button onClick={() => setEditingStartup({})}><PlusCircle className="h-4 w-4 mr-2" />Add Startup</Button>
        </div>
      </div>

      {selectedStartups.size > 0 && (
        <div className="flex items-center gap-4 p-3 bg-primary/10 rounded-lg">
          <span>{selectedStartups.size} selected</span>
          <div className="flex-grow" />
          <Button size="sm" variant="outline" onClick={() => setSelectedStartups(new Set())}><XSquare className="h-4 w-4 mr-2" />Clear</Button>
          <Button size="sm" variant="destructive" onClick={() => handleDelete(Array.from(selectedStartups))}><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
        </div>
      )}

      <div className="rounded-md border border-white/10 bg-black/20">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="w-12"><Checkbox checked={filteredStartups.length > 0 && selectedStartups.size === filteredStartups.length} onCheckedChange={handleSelectAll} /></TableHead>
              <TableHead>Startup</TableHead>
              <TableHead>Founder</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading startups...</TableCell></TableRow> : 
            filteredStartups.length === 0 ? <TableRow><TableCell colSpan={6} className="h-24 text-center">No startups found.</TableCell></TableRow> :
            filteredStartups.map((startup) => (
              <TableRow key={startup.id} className="border-white/10 hover:bg-white/5">
                <TableCell><Checkbox checked={selectedStartups.has(startup.id)} onCheckedChange={() => handleSelectStartup(startup.id)} /></TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden">
                      {startup.logo_url ? <img src={startup.logo_url} alt={startup.name} className="w-full h-full object-cover" /> : <Rocket className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <div>
                      <span className="font-semibold">{startup.name}</span>
                      {startup.verified && <VerifiedBadge size="sm" />}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{startup.profiles?.full_name || 'Unknown'}</TableCell>
                <TableCell><Badge variant="secondary">{startup.industry || 'N/A'}</Badge></TableCell>
                <TableCell><Badge variant="outline">{startup.stage || 'N/A'}</Badge></TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingStartup(startup)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleVerifyStartup(startup.id, startup.verified)}>
                        {startup.verified ? <XCircle className="h-4 w-4 mr-2 text-yellow-500" /> : <CheckCircle className="h-4 w-4 mr-2 text-green-500" />} 
                        {startup.verified ? 'Revoke Verification' : 'Verify Startup'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDelete([startup.id])} className="text-red-500 focus:text-red-500"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingStartup} onOpenChange={(open) => !open && setEditingStartup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStartup?.id ? 'Edit Startup' : 'Add New Startup'}</DialogTitle>
            <DialogDescription>Fill in the details for the startup. The founder ID must be a valid user ID.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input placeholder="Startup Name" value={editingStartup?.name || ''} onChange={(e) => setEditingStartup({...editingStartup, name: e.target.value})} />
            <Input placeholder="Founder ID (UUID)" value={editingStartup?.founder_id || ''} onChange={(e) => setEditingStartup({...editingStartup, founder_id: e.target.value})} />
            <Input placeholder="Industry" value={editingStartup?.industry || ''} onChange={(e) => setEditingStartup({...editingStartup, industry: e.target.value})} />
            <Input placeholder="Stage (e.g., Idea, MVP)" value={editingStartup?.stage || ''} onChange={(e) => setEditingStartup({...editingStartup, stage: e.target.value})} />
            <Textarea placeholder="Description" value={editingStartup?.description || ''} onChange={(e) => setEditingStartup({...editingStartup, description: e.target.value})} />
            <Input placeholder="Website URL" value={editingStartup?.website || ''} onChange={(e) => setEditingStartup({...editingStartup, website: e.target.value})} />
            <Input placeholder="Logo URL" value={editingStartup?.logo_url || ''} onChange={(e) => setEditingStartup({...editingStartup, logo_url: e.target.value})} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStartup(null)}>Cancel</Button>
            <Button onClick={handleSaveStartup}>Save Startup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStartups;
