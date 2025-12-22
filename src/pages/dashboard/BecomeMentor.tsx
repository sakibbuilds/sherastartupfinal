import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Loader2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BecomeMentor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    expertise: '',
    capabilities: '',
    cv_url: '',
    portfolio_url: '',
    website: '',
    demo_video_url: '',
    case_style: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('mentor_applications')
        .insert({
          user_id: user.id,
          expertise: formData.expertise.split(',').map(s => s.trim()),
          capabilities: formData.capabilities,
          cv_url: formData.cv_url,
          portfolio_url: formData.portfolio_url,
          website: formData.website || null,
          demo_video_url: formData.demo_video_url,
          case_style: formData.case_style,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: "We will review your application and get back to you soon.",
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: "Could not submit application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Become a Mentor</CardTitle>
          <CardDescription>
            Share your expertise and guide the next generation of founders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="expertise">Expertise (comma separated)</Label>
              <Input
                id="expertise"
                placeholder="e.g., Marketing, Fundraising, Product Design"
                value={formData.expertise}
                onChange={(e) => setFormData(prev => ({ ...prev, expertise: e.target.value }))}
                required
                className="bg-white/5 border-white/10 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capabilities">Capabilities / Bio</Label>
              <Textarea
                id="capabilities"
                placeholder="Describe your experience and what you can offer to mentees..."
                value={formData.capabilities}
                onChange={(e) => setFormData(prev => ({ ...prev, capabilities: e.target.value }))}
                required
                className="min-h-[100px] bg-white/5 border-white/10 focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cv_url">CV / Resume Link</Label>
                <Input
                  id="cv_url"
                  type="url"
                  placeholder="https://..."
                  value={formData.cv_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, cv_url: e.target.value }))}
                  required
                  className="bg-white/5 border-white/10 focus:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="portfolio_url">Portfolio Link</Label>
                <Input
                  id="portfolio_url"
                  type="url"
                  placeholder="https://..."
                  value={formData.portfolio_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, portfolio_url: e.target.value }))}
                  required
                  className="bg-white/5 border-white/10 focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://..."
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  className="bg-white/5 border-white/10 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="demo_video_url">Demo Video Link</Label>
                <Input
                  id="demo_video_url"
                  type="url"
                  placeholder="https://youtube.com/..."
                  value={formData.demo_video_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, demo_video_url: e.target.value }))}
                  required
                  className="bg-white/5 border-white/10 focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="case_style">Case Studies / Mentorship Style</Label>
              <Textarea
                id="case_style"
                placeholder="Share some success stories or your approach to mentorship..."
                value={formData.case_style}
                onChange={(e) => setFormData(prev => ({ ...prev, case_style: e.target.value }))}
                required
                className="min-h-[100px] bg-white/5 border-white/10 focus:border-primary"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Submit Application
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BecomeMentor;
