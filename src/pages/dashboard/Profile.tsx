import { useState, useEffect } from 'react';
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
import { Loader2, Save, X, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

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
}

const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  // Form state
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [university, setUniversity] = useState('');
  const [title, setTitle] = useState('');
  const [expertise, setExpertise] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState('');

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
      })
      .eq('user_id', user.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
    } else {
      toast({ title: 'Saved!', description: 'Your profile has been updated.' });
    }

    setSaving(false);
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
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="text-2xl">
                  {fullName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold">{fullName || 'Your Name'}</h2>
                <p className="text-muted-foreground">{user?.email}</p>
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
    </div>
  );
};

export default ProfilePage;
