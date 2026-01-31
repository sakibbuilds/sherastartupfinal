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
  Link as LinkIcon,
  RefreshCcw
} from 'lucide-react';
import { motion } from 'framer-motion';

interface MentorApplication {
  id: string;
  expertise: string[];
  bio: string;
  status: string;
  created_at: string;
}

const BecomeMentor = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [existingApplication, setExistingApplication] = useState<MentorApplication | null>(null);
  const [isMentor, setIsMentor] = useState(false);

  // Form state
  const [expertise, setExpertise] = useState<string[]>([]);
  const [expertiseInput, setExpertiseInput] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (user) {
      checkUserStatus();
    }
  }, [user]);

  const checkUserStatus = async () => {
    if (!user) return;
    setLoading(true);

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('user_id', user.id)
      .single();

    if (profile?.user_type === 'mentor') {
      setIsMentor(true);
      setLoading(false);
      return;
    }

    await fetchApplication();
    setLoading(false);
  };

  const fetchApplication = async () => {
    if (!user) return;
    const { data: application } = await supabase
      .from('mentor_applications')
      .select('id, expertise, bio, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    setExistingApplication(application);
    if (application) {
      setExpertise(application.expertise || []);
      setBio(application.bio || '');
    }
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

    if (expertise.length === 0 || !bio.trim()) {
      toast({ title: 'Missing Information', description: 'Please provide your expertise and a bio.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from('mentor_applications').insert({
      user_id: user.id,
      expertise,
      bio,
      status: 'pending',
    });

    if (error) {
      toast({ title: 'Error', description: 'Failed to submit application. Please try again.', variant: 'destructive' });
    } else {
      toast({ title: 'Application Submitted!', description: 'We will review your application shortly.' });
      await fetchApplication();
    }

    setSubmitting(false);
  };
  
  const handleCancelApplication = async () => {
    if (!existingApplication) return;
    
    setCancelling(true);
    const { error } = await supabase
      .from('mentor_applications')
      .delete()
      .eq('id', existingApplication.id);
      
    if (error) {
      toast({ title: 'Error Cancelling', description: 'Could not cancel application. Please try again.', variant: 'destructive' });
    } else {
      toast({ title: 'Application Cancelled', description: 'You can now submit a new application.'});
      setExistingApplication(null);
      setExpertise([]);
      setBio('');
    }
    setCancelling(false);
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (isMentor) {
    return (
       <div className="max-w-2xl mx-auto py-8 px-4">
        <Card className="glass-card text-center">
          <CardHeader>
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <CardTitle className="mt-4">You Are Already a Mentor</CardTitle>
            <CardDescription>Thank you for being part of our community.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (existingApplication) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Card className="glass-card text-center">
          <CardHeader>
             <Clock className="mx-auto h-12 w-12 text-yellow-500" />
            <CardTitle className="mt-4">Application Submitted</CardTitle>
            <CardDescription>Your application is currently under review.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="p-4 rounded-lg bg-muted/50 text-left">
                <h4 className="font-medium mb-2">Your Submission:</h4>
                <p className="text-sm text-muted-foreground mb-2"><strong>Bio:</strong> {bio}</p>
                <div className="flex flex-wrap gap-2">
                    {expertise.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                </div>
            </div>
            <Button onClick={handleCancelApplication} variant="destructive" disabled={cancelling} className="w-full">
              {cancelling ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <XCircle className="h-4 w-4 mr-2"/>}
              Cancel Application
            </Button>
            <p className="text-xs text-muted-foreground">You can cancel to edit and resubmit your application.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
                <GraduationCap className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Become a Mentor</CardTitle>
                <CardDescription>Share your expertise with the next generation of founders.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="expertise">Areas of Expertise *</Label>
                <div className="flex gap-2">
                  <Input id="expertise" placeholder="e.g., SaaS, B2C Marketing" value={expertiseInput} onChange={(e) => setExpertiseInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addExpertise())} />
                  <Button type="button" variant="secondary" onClick={addExpertise}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {expertise.map(skill => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                      <button type="button" onClick={() => removeExpertise(skill)} className="ml-2 text-muted-foreground hover:text-foreground"><X className="h-3 w-3"/></button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Short Bio *</Label>
                <Textarea id="bio" placeholder="Describe your background and what you can help with..." value={bio} onChange={(e) => setBio(e.target.value)} className="min-h-[120px]" />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <GraduationCap className="h-4 w-4 mr-2" />}
                Submit Application
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default BecomeMentor;
