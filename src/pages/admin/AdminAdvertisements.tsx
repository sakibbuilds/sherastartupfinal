import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Upload, 
  X, 
  Loader2,
  Image,
  Video,
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface Advertisement {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  media_url: string;
  media_type: string;
  link_url: string | null;
  placement: string;
  is_active: boolean;
  priority: number;
  created_at: string;
}

const AdminAdvertisements = () => {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    media_url: '',
    media_type: 'image',
    link_url: '',
    placement: 'sidebar',
    priority: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    const { data, error } = await supabase
      .from('advertisements')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ads:', error);
      toast({ title: 'Error', description: 'Failed to load advertisements', variant: 'destructive' });
    } else {
      setAds(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      media_url: '',
      media_type: 'image',
      link_url: '',
      placement: 'sidebar',
      priority: 0,
      is_active: true,
    });
    setSelectedAd(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (ad: Advertisement) => {
    setSelectedAd(ad);
    setFormData({
      title: ad.title,
      subtitle: ad.subtitle || '',
      description: ad.description || '',
      media_url: ad.media_url,
      media_type: ad.media_type,
      link_url: ad.link_url || '',
      placement: ad.placement,
      priority: ad.priority || 0,
      is_active: ad.is_active,
    });
    setDialogOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      toast({ title: 'Invalid File', description: 'Please upload an image (JPG, PNG, GIF, WebP) or video (MP4, WebM)', variant: 'destructive' });
      return;
    }

    // Max 50MB
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: 'File Too Large', description: 'Maximum file size is 50MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('advertisements')
      .upload(fileName, file);

    if (error) {
      toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('advertisements')
      .getPublicUrl(fileName);

    const mediaType = file.type.startsWith('video/') ? 'video' : file.type === 'image/gif' ? 'gif' : 'image';

    setFormData(prev => ({
      ...prev,
      media_url: urlData.publicUrl,
      media_type: mediaType,
    }));

    setUploading(false);
    toast({ title: 'Uploaded', description: 'Media uploaded successfully' });
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }
    if (!formData.media_url.trim()) {
      toast({ title: 'Error', description: 'Please upload media', variant: 'destructive' });
      return;
    }

    setSaving(true);

    const adData = {
      title: formData.title.trim(),
      subtitle: formData.subtitle.trim() || null,
      description: formData.description.trim() || null,
      media_url: formData.media_url,
      media_type: formData.media_type,
      link_url: formData.link_url.trim() || null,
      placement: formData.placement,
      priority: formData.priority,
      is_active: formData.is_active,
    };

    if (selectedAd) {
      // Update
      const { error } = await supabase
        .from('advertisements')
        .update(adData)
        .eq('id', selectedAd.id);

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Updated', description: 'Advertisement updated successfully' });
        setDialogOpen(false);
        fetchAds();
      }
    } else {
      // Create
      const { error } = await supabase
        .from('advertisements')
        .insert(adData);

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Created', description: 'Advertisement created successfully' });
        setDialogOpen(false);
        fetchAds();
      }
    }

    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedAd) return;

    const { error } = await supabase
      .from('advertisements')
      .delete()
      .eq('id', selectedAd.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Advertisement deleted successfully' });
      fetchAds();
    }

    setDeleteDialogOpen(false);
    setSelectedAd(null);
  };

  const toggleActive = async (ad: Advertisement) => {
    const { error } = await supabase
      .from('advertisements')
      .update({ is_active: !ad.is_active })
      .eq('id', ad.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      fetchAds();
    }
  };

  const getPlacementLabel = (placement: string) => {
    switch (placement) {
      case 'left_sidebar': return 'Left Sidebar';
      case 'right_sidebar': return 'Right Sidebar';
      case 'feed': return 'In Feed';
      default: return 'Sidebar';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Advertisements</h1>
          <p className="text-muted-foreground">Manage banner ads for the dashboard</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Advertisement
        </Button>
      </div>

      {ads.length === 0 ? (
        <Card className="p-12 text-center">
          <Image className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Advertisements</h3>
          <p className="text-muted-foreground mb-4">Create your first advertisement to display on the dashboard.</p>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Advertisement
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ads.map(ad => (
            <Card key={ad.id} className={`overflow-hidden ${!ad.is_active ? 'opacity-60' : ''}`}>
              <div className="relative aspect-video bg-muted">
                {ad.media_type === 'video' ? (
                  <video 
                    src={ad.media_url} 
                    className="w-full h-full object-cover"
                    muted 
                    loop 
                    playsInline
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => e.currentTarget.pause()}
                  />
                ) : (
                  <img 
                    src={ad.media_url} 
                    alt={ad.title}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                  <Badge variant={ad.is_active ? 'default' : 'secondary'} className="text-xs">
                    {ad.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-background/80">
                    {ad.media_type === 'video' ? <Video className="w-3 h-3 mr-1" /> : <Image className="w-3 h-3 mr-1" />}
                    {ad.media_type.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold truncate">{ad.title}</h3>
                  {ad.subtitle && <p className="text-sm text-muted-foreground truncate">{ad.subtitle}</p>}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <Badge variant="outline">{getPlacementLabel(ad.placement)}</Badge>
                  <span>Priority: {ad.priority}</span>
                </div>
                {ad.link_url && (
                  <a 
                    href={ad.link_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {new URL(ad.link_url).hostname}
                  </a>
                )}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={ad.is_active} 
                      onCheckedChange={() => toggleActive(ad)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {ad.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => openEditDialog(ad)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setSelectedAd(ad);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAd ? 'Edit Advertisement' : 'Create Advertisement'}</DialogTitle>
            <DialogDescription>
              {selectedAd ? 'Update the advertisement details below.' : 'Fill in the details to create a new advertisement.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Media Upload */}
            <div className="space-y-2">
              <Label>Media (Image/GIF/Video) *</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm"
                onChange={handleFileUpload}
                className="hidden"
              />
              {formData.media_url ? (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  {formData.media_type === 'video' ? (
                    <video 
                      src={formData.media_url} 
                      className="w-full h-full object-cover"
                      controls
                    />
                  ) : (
                    <img 
                      src={formData.media_url} 
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={() => setFormData(prev => ({ ...prev, media_url: '', media_type: 'image' }))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-32 border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6" />
                      <span>Click to upload image, GIF or video</span>
                      <span className="text-xs text-muted-foreground">Max 50MB</span>
                    </div>
                  )}
                </Button>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Study Abroad Program"
              />
            </div>

            {/* Subtitle */}
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="e.g., Apply now for Spring 2026"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the advertisement..."
                rows={3}
              />
            </div>

            {/* Link URL */}
            <div className="space-y-2">
              <Label htmlFor="link_url">Link URL</Label>
              <Input
                id="link_url"
                type="url"
                value={formData.link_url}
                onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>

            {/* Placement & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Placement</Label>
                <Select
                  value={formData.placement}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, placement: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sidebar">Sidebar</SelectItem>
                    <SelectItem value="left_sidebar">Left Sidebar</SelectItem>
                    <SelectItem value="right_sidebar">Right Sidebar</SelectItem>
                    <SelectItem value="feed">In Feed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Show this ad on the dashboard</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {selectedAd ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Advertisement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedAd?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminAdvertisements;
