import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Advertisement {
  id: string;
  image_url: string;
  link_url: string | null;
  title: string | null;
  active: boolean;
  created_at: string;
}

const AdminAdvertisements = () => {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [image, setImage] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    const { data, error } = await supabase
      .from('advertisements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ads:', error);
      toast({ title: 'Error', description: 'Failed to fetch advertisements', variant: 'destructive' });
    } else {
      setAds(data || []);
    }
    setLoading(false);
  };

  const handleCreateAd = async () => {
    if (!image) {
      toast({ title: 'Error', description: 'Please select an image', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      // Upload image
      const fileExt = image.name.split('.').pop();
      const fileName = `ads/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('post_media') // Using same bucket for simplicity
        .upload(fileName, image);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('post_media')
        .getPublicUrl(fileName);

      // Create record
      const { data, error } = await supabase
        .from('advertisements')
        .insert({
          image_url: publicUrl,
          link_url: linkUrl || null,
          title: title || null,
          active: true
        })
        .select()
        .single();

      if (error) throw error;

      setAds([data, ...ads]);
      setCreateOpen(false);
      setImage(null);
      setLinkUrl('');
      setTitle('');
      toast({ title: 'Success', description: 'Advertisement created successfully' });

    } catch (error: any) {
      console.error('Error creating ad:', error);
      toast({ title: 'Error', description: error.message || 'Failed to create advertisement', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('advertisements')
      .update({ active: !currentStatus })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } else {
      setAds(ads.map(ad => ad.id === id ? { ...ad, active: !currentStatus } : ad));
    }
  };

  const deleteAd = async (id: string) => {
    if (!confirm('Are you sure you want to delete this advertisement?')) return;

    const { error } = await supabase
      .from('advertisements')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete advertisement', variant: 'destructive' });
    } else {
      setAds(ads.filter(ad => ad.id !== id));
      toast({ title: 'Deleted', description: 'Advertisement deleted' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
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
          <DialogContent>
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
                />
              </div>
              <div className="space-y-2">
                <Label>Title (Optional)</Label>
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Ad Title"
                />
              </div>
              <div className="space-y-2">
                <Label>Link URL (Optional)</Label>
                <Input 
                  value={linkUrl} 
                  onChange={(e) => setLinkUrl(e.target.value)} 
                  placeholder="https://example.com"
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
            <Card key={ad.id} className="overflow-hidden">
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
