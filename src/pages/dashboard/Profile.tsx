import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, Save, X, Plus, Camera, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { AvatarCropper } from '@/components/common/AvatarCropper';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  university: string | null;
  title: string | null;
  expertise: string[] | null;
  hourly_rate: number | null;
  is_available: boolean;
  linkedin_url: string | null;
  user_type: string | null;
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cropper state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [university, setUniversity] = useState('');
  const [title, setTitle] = useState('');
  const [expertise, setExpertise] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
    } else if (data) {
      setProfile(data);
      setFullName(data.full_name || '');
      setBio(data.bio || '');
      setUniversity(data.university || '');
      setTitle(data.title || '');
      setExpertise(data.expertise || []);
      setHourlyRate(data.hourly_rate?.toString() || '');
      setLinkedinUrl(data.linkedin_url || '');
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        bio: bio || null,
        university: university || null,
        title: title || null,
        expertise: expertise.length > 0 ? expertise : null,
        hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
        linkedin_url: linkedinUrl || null,
      })
      .eq('user_id', user.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
    } else {
      toast({ title: 'Saved!', description: 'Your profile has been updated.' });
    }

    setSaving(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file', variant: 'destructive' });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please select an image under 10MB', variant: 'destructive' });
      return;
    }

    // Read file and open cropper
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user) return;

    setUploadingAvatar(true);
    setCropperOpen(false);

    try {
      // Generate unique filename with user folder structure
      const fileName = `${Date.now()}.jpg`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to avatars bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedBlob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      toast({ title: 'Avatar updated!', description: 'Your profile picture has been changed.' });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({ title: 'Upload failed', description: 'Failed to upload avatar. Please try again.', variant: 'destructive' });
    } finally {
      setUploadingAvatar(false);
      setSelectedImage(null);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !expertise.includes(newSkill.trim())) {
      setExpertise([...expertise, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setExpertise(expertise.filter(s => s !== skill));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
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
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20 lg:pb-6">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-4">
              {/* Avatar with upload button */}
              <div className="relative group">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {fullName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                {/* Upload overlay */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </button>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              
              <div className="flex-1">
                <h2 className="text-xl font-bold">{fullName || 'Your Name'}</h2>
                <p className="text-muted-foreground">{user?.email}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Change Photo
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title / Role</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Startup Founder, Mentor, etc."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="university">University</Label>
              <Input
                id="university"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="Stanford University"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              <Input
                id="linkedinUrl"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about yourself, your experience, and what you're working on..."
                className="resize-none min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Expertise / Skills</Label>
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a skill..."
                />
                <Button type="button" onClick={addSkill} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {expertise.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {expertise.map((skill) => (
                    <Badge key={skill} variant="secondary" className="gap-1">
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate (for mentoring)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="hourlyRate"
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="0"
                  className="pl-7"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty if you're not offering paid mentoring sessions
              </p>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Avatar Cropper Dialog */}
      {selectedImage && (
        <AvatarCropper
          open={cropperOpen}
          onClose={() => {
            setCropperOpen(false);
            setSelectedImage(null);
          }}
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
};

export default ProfilePage;