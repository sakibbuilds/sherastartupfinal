import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  GraduationCap, 
  Loader2, 
  CheckCircle, 
  Clock, 
  XCircle,
  Plus,
  X,
  DollarSign,
  Briefcase,
  Link as LinkIcon
} from 'lucide-react';
import { motion } from 'framer-motion';

interface MentorApplication {
  id: string;
  expertise: string[];
  bio: string;
  experience_years: number | null;
  hourly_rate: number | null;
  linkedin_url: string | null;
  motivation: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

const BecomeMentor = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingApplication, setExistingApplication] = useState<MentorApplication | null>(null);
  const [isMentor, setIsMentor] = useState(false);

  // Form state
  const [expertise, setExpertise] = useState<string[]>([]);
  const [expertiseInput, setExpertiseInput] = useState('');
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [motivation, setMotivation] = useState('');

  useEffect(() => {
    if (user) {
      checkExistingApplication();
    }
  }, [user]);

  const checkExistingApplication = async () => {
    if (!user) return;

    // Check if already a mentor
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_mentor, expertise, bio, hourly_rate, linkedin_url')
      .eq('user_id', user.id)
      .single();

    if (profile?.is_mentor) {
      setIsMentor(true);
      setLoading(false);
      return;
    }

    // Pre-fill from profile
    if (profile) {
      if (profile.expertise) setExpertise(profile.expertise);
      if (profile.bio) setBio(profile.bio);
      if (profile.hourly_rate) setHourlyRate(profile.hourly_rate.toString());
      if (profile.linkedin_url) setLinkedinUrl(profile.linkedin_url);
    }

    // Check for existing application
    const { data: application } = await supabase
      .from('mentor_applications')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (application) {
      setExistingApplication(application);
      setExpertise(application.expertise || []);
      setBio(application.bio || '');
      setExperienceYears(application.experience_years?.toString() || '');
      setHourlyRate(application.hourly_rate?.toString() || '');
      setLinkedinUrl(application.linkedin_url || '');
      setMotivation(application.motivation || '');
    }

    setLoading(false);
  };

  const addExpertise = () => {
    if (expertiseInput.trim() && !expertise.includes(expertiseInput.trim())) {
      setExpertise([...expertise, expertiseInput.trim()]);
      setExpertiseInput('');
    }
  };

  const removeExpertise = (skill: string) => {
    setExpertise(expertise.filter(e => e !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (expertise.length === 0) {
      toast({ title: 'Error', description: 'Please add at least one area of expertise', variant: 'destructive' });
      return;
    }

    if (!bio.trim()) {
      toast({ title: 'Error', description: 'Please provide a bio', variant: 'destructive' });
      return;
    }

    setSubmitting(true);

    const applicationData = {
      user_id: user.id,
      expertise,
      bio: bio.trim(),
      experience_years: experienceYears ? parseInt(experienceYears) : null,
      hourly_rate: hourlyRate ? parseInt(hourlyRate) : null,
      linkedin_url: linkedinUrl.trim() || null,
      motivation: motivation.trim() || null,
      status: 'pending'
    };

    if (existingApplication && existingApplication.status === 'pending') {
      // Update existing application
      const { error } = await supabase
        .from('mentor_applications')
        .update(applicationData)
        .eq('id', existingApplication.id);

      if (error) {
        toast({ title: 'Error', description: 'Failed to update application', variant: 'destructive' });
      } else {
        toast({ title: 'Application Updated', description: 'Your mentor application has been updated.' });
        checkExistingApplication();
      }
    } else {
      // Create new application
      const { error } = await supabase
        .from('mentor_applications')
        .insert(applicationData);

      if (error) {
        if (error.code === '23505') {
          toast({ title: 'Error', description: 'You already have an application', variant: 'destructive' });
        } else {
          toast({ title: 'Error', description: 'Failed to submit application', variant: 'destructive' });
        }
      } else {
        toast({ title: 'Application Submitted!', description: 'Your mentor application is now under review.' });
        checkExistingApplication();
      }
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Card className="glass-card">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isMentor) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-full bg-primary/20">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle>You're Already a Mentor!</CardTitle>
                  <CardDescription>You can now receive booking requests from mentees.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Check your bookings page to manage incoming session requests.
              </p>
              <div className="flex gap-3">
                <Button onClick={() => navigate('/dashboard/bookings')}>
                  View My Bookings
                </Button>
                <Button variant="outline" onClick={() => navigate('/dashboard/settings')}>
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Show application status if exists
  if (existingApplication && existingApplication.status !== 'rejected') {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-3 rounded-full ${
                  existingApplication.status === 'approved' 
                    ? 'bg-primary/20' 
                    : 'bg-amber-500/20'
                }`}>
                  {existingApplication.status === 'approved' ? (
                    <CheckCircle className="h-8 w-8 text-primary" />
                  ) : (
                    <Clock className="h-8 w-8 text-amber-500" />
                  )}
                </div>
                <div>
                  <CardTitle>
                    {existingApplication.status === 'approved' 
                      ? 'Application Approved!' 
                      : 'Application Under Review'}
                  </CardTitle>
                  <CardDescription>
                    {existingApplication.status === 'approved'
                      ? 'Welcome to the mentor team!'
                      : 'We\'ll notify you once your application is reviewed.'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Your Application Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex flex-wrap gap-1">
                    <span className="text-muted-foreground">Expertise:</span>
                    {existingApplication.expertise.map((skill, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                    ))}
                  </div>
                  {existingApplication.hourly_rate && (
                    <p><span className="text-muted-foreground">Hourly Rate:</span> ${existingApplication.hourly_rate}</p>
                  )}
                  {existingApplication.experience_years && (
                    <p><span className="text-muted-foreground">Experience:</span> {existingApplication.experience_years} years</p>
                  )}
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full">
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Become a Mentor</CardTitle>
                <CardDescription>
                  Share your expertise and guide the next generation of founders.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {existingApplication?.status === 'rejected' && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 mb-6">
                <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Previous Application Rejected</p>
                  {existingApplication.rejection_reason && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Reason: {existingApplication.rejection_reason}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    You can submit a new application below.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Expertise */}
              <div className="space-y-2">
                <Label htmlFor="expertise">Areas of Expertise *</Label>
                <div className="flex gap-2">
                  <Input
                    id="expertise"
                    placeholder="e.g., Product Strategy, Fundraising..."
                    value={expertiseInput}
                    onChange={(e) => setExpertiseInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addExpertise();
                      }
                    }}
                  />
                  <Button type="button" variant="secondary" onClick={addExpertise}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {expertise.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {expertise.map((skill, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {skill}
                        <button type="button" onClick={() => removeExpertise(skill)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Professional Bio *</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell mentees about your background, experience, and what you can help them with..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
              </div>

              {/* Experience Years */}
              <div className="space-y-2">
                <Label htmlFor="experience">Years of Experience</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="experience"
                    type="number"
                    placeholder="5"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="pl-10"
                    min="0"
                    max="50"
                  />
                </div>
              </div>

              {/* Hourly Rate */}
              <div className="space-y-2">
                <Label htmlFor="rate">Hourly Rate (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="rate"
                    type="number"
                    placeholder="100"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="pl-10"
                    min="0"
                  />
                </div>
              </div>

              {/* LinkedIn */}
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn Profile</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="linkedin"
                    type="url"
                    placeholder="https://linkedin.com/in/yourprofile"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Motivation */}
              <div className="space-y-2">
                <Label htmlFor="motivation">Why do you want to be a mentor?</Label>
                <Textarea
                  id="motivation"
                  placeholder="Share your motivation for mentoring..."
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default BecomeMentor;
