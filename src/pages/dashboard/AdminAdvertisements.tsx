import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, Trash2, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Note: advertisements table needs to be created via migration
const AdminAdvertisements = () => {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // New ad form state
  const [image, setImage] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAds(data || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
      // Fallback for when table doesn't exist yet
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAd = async () => {
    if (!image) {
      toast({ title: 'Error', description: 'Please select an image', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      // 1. Upload Image
      const fileExt = image.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `ads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('post_media') // Using existing bucket for now
        .upload(filePath, image);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('post_media')
        .getPublicUrl(filePath);

      // 2. Create Record
      const { error: dbError } = await supabase
        .from('advertisements')
        .insert({
          image_url: publicUrl,
          title: title || null,
          link_url: linkUrl || null,
          active: true
        });

      if (dbError) throw dbError;

      toast({ title: 'Success', description: 'Advertisement created' });
      setCreateOpen(false);
      setImage(null);
      setTitle('');
      setLinkUrl('');
      fetchAds();
    } catch (error: any) {
      console.error('Error creating ad:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('advertisements')
        .update({ active: !currentActive })
        .eq('id', id);

      if (error) throw error;
      setAds(ads.map(ad => ad.id === id ? { ...ad, active: !currentActive } : ad));
    } catch (error) {
      console.error('Error updating ad:', error);
      toast({ title: 'Error', description: 'Could not update status', variant: 'destructive' });
    }
  };

  const deleteAd = async (id: string) => {
    if (!confirm('Are you sure you want to delete this advertisement?')) return;

    try {
      const { error } = await supabase
        .from('advertisements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setAds(ads.filter(ad => ad.id !== id));
      toast({ title: 'Deleted', description: 'Advertisement removed' });
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast({ title: 'Error', description: 'Could not delete ad', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manage Advertisements</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Ad
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-white/10">
            <DialogHeader>
              <DialogTitle>Create Advertisement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Image</Label>
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setImage(e.target.files?.[0] || null)} 
                  className="bg-white/5 border-white/10 focus:border-primary file:text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label>Title (Optional)</Label>
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Ad Title"
                  className="bg-white/5 border-white/10 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label>Link URL (Optional)</Label>
                <Input 
                  value={linkUrl} 
                  onChange={(e) => setLinkUrl(e.target.value)} 
                  placeholder="https://example.com"
                  className="bg-white/5 border-white/10 focus:border-primary"
                />
              </div>
              <Button onClick={handleCreateAd} disabled={creating} className="w-full">
                {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create Ad
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {ads.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No advertisements found.</p>
        ) : (
          ads.map((ad) => (
            <Card key={ad.id} className="overflow-hidden glass-card">
              <div className="flex flex-col sm:flex-row gap-4 p-4">
                <div className="w-full sm:w-48 h-32 bg-muted rounded-md overflow-hidden flex-shrink-0">
                  <img src={ad.image_url} alt="Ad" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{ad.title || 'Untitled Ad'}</h3>
                      {ad.link_url && (
                        <a 
                          href={ad.link_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                        >
                          {ad.link_url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`active-${ad.id}`} className="text-xs">Active</Label>
                      <Switch 
                        id={`active-${ad.id}`}
                        checked={ad.active}
                        onCheckedChange={() => toggleActive(ad.id, ad.active)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button variant="destructive" size="sm" onClick={() => deleteAd(ad.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminAdvertisements;
