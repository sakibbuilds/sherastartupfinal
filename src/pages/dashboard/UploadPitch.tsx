import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Loader2, 
  Upload,
  X,
  Video,
  Image,
  ArrowLeft
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const motives = [
  { value: 'investment', label: 'Raising Investment' },
  { value: 'mentorship', label: 'Seeking Mentorship' },
  { value: 'cofounder', label: 'Looking for Co-Founder' },
  { value: 'investor', label: 'Investor Looking to Invest' },
  { value: 'networking', label: 'Networking' },
  { value: 'general', label: 'General Pitch' },
];

const UploadPitch = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    motive: '',
    video: null as File | null,
    thumbnail: null as File | null,
  });

  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, video: file });
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, thumbnail: file });
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!user || !formData.video || !formData.title.trim() || !formData.motive) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setUploading(true);

    try {
      // Upload video
      const videoExt = formData.video.name.split('.').pop();
      const videoFileName = `${user.id}/${Date.now()}.${videoExt}`;

      const { error: videoError } = await supabase.storage
        .from('pitch-videos')
        .upload(videoFileName, formData.video);

      if (videoError) throw videoError;

      const { data: { publicUrl: videoUrl } } = supabase.storage
        .from('pitch-videos')
        .getPublicUrl(videoFileName);

      // Upload thumbnail if provided
      let thumbnailUrl = null;
      if (formData.thumbnail) {
        const thumbExt = formData.thumbnail.name.split('.').pop();
        const thumbFileName = `${user.id}/${Date.now()}-thumb.${thumbExt}`;

        const { error: thumbError } = await supabase.storage
          .from('pitch-thumbnails')
          .upload(thumbFileName, formData.thumbnail);

        if (thumbError) {
          console.error('Thumbnail upload error:', thumbError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('pitch-thumbnails')
            .getPublicUrl(thumbFileName);
          thumbnailUrl = publicUrl;
        }
      }

      // Insert pitch record
      const { error: insertError } = await supabase
        .from('video_pitches')
        .insert({
          user_id: user.id,
          title: formData.title.trim(),
          description: formData.description || null,
          motive: formData.motive,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl
        });

      if (insertError) throw insertError;

      toast({ title: 'Success!', description: 'Your pitch video has been uploaded.' });
      navigate('/dashboard/pitches/my');
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Error', description: 'Failed to upload video', variant: 'destructive' });
    }

    setUploading(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20 lg:pb-6">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Upload Pitch Video</CardTitle>
          <CardDescription>
            Create a compelling pitch video to attract investors, mentors, or co-founders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Give your pitch a catchy title"
            />
          </div>

          {/* Motive */}
          <div className="space-y-2">
            <Label>What are you looking for? *</Label>
            <Select
              value={formData.motive}
              onValueChange={(v) => setFormData({ ...formData, motive: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your motive" />
              </SelectTrigger>
              <SelectContent>
                {motives.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell viewers about your startup, what problem you're solving, and what you need..."
              className="resize-none min-h-[100px]"
            />
          </div>

          {/* Video Upload */}
          <div className="space-y-2">
            <Label>Pitch Video *</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6">
              {videoPreview ? (
                <div className="space-y-4">
                  <video
                    src={videoPreview}
                    className="w-full max-h-[300px] rounded-lg object-contain bg-black"
                    controls
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground truncate">
                      {formData.video?.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFormData({ ...formData, video: null });
                        setVideoPreview(null);
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center">
                  <Video className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">Click to upload video</p>
                  <p className="text-xs text-muted-foreground mt-1">MP4, WebM, MOV (Max 100MB)</p>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    onChange={handleVideoChange}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Thumbnail Upload */}
          <div className="space-y-2">
            <Label>Thumbnail (Optional)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6">
              {thumbnailPreview ? (
                <div className="space-y-4">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full max-h-[200px] rounded-lg object-contain"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground truncate">
                      {formData.thumbnail?.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFormData({ ...formData, thumbnail: null });
                        setThumbnailPreview(null);
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center">
                  <Image className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">Click to upload thumbnail</p>
                  <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, WebP (Max 5MB)</p>
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleThumbnailChange}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={!formData.title.trim() || !formData.video || !formData.motive || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Pitch
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadPitch;