import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { 
  Rocket, 
  GraduationCap, 
  TrendingUp, 
  Users, 
  Loader2, 
  ChevronRight, 
  ChevronLeft,
  Check,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface University {
  id: string;
  name: string;
  type: string;
  location: string | null;
}

const userTypes = [
  {
    id: 'student',
    icon: GraduationCap,
    title: 'Student',
    description: 'Looking to learn, collaborate, or find opportunities'
  },
  {
    id: 'founder',
    icon: Rocket,
    title: 'Founder',
    description: 'Building a startup and seeking resources, team, or funding'
  },
  {
    id: 'investor',
    icon: TrendingUp,
    title: 'Investor',
    description: 'Looking to invest in promising university startups'
  }
];

const industries = [
  'Technology', 'Healthcare', 'Fintech', 'EdTech', 'E-commerce', 
  'AgriTech', 'CleanTech', 'AI/ML', 'SaaS', 'Consumer', 'B2B',
  'Manufacturing', 'Logistics', 'Real Estate', 'Entertainment'
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  const [universityOpen, setUniversityOpen] = useState(false);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [customUniversity, setCustomUniversity] = useState('');
  const [showCustomUniversity, setShowCustomUniversity] = useState(false);
  const [bio, setBio] = useState('');
  const [title, setTitle] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [expertise, setExpertise] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  
  // Investor specific
  const [investmentFocus, setInvestmentFocus] = useState<string[]>([]);
  const [investmentRangeMin, setInvestmentRangeMin] = useState('');
  const [investmentRangeMax, setInvestmentRangeMax] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    fetchUniversities();
    if (user) {
      checkOnboardingStatus();
    }
  }, [user]);

  const fetchUniversities = async () => {
    const { data } = await supabase
      .from('universities')
      .select('*')
      .order('name');
    
    setUniversities(data || []);
  };

  const checkOnboardingStatus = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding_completed, full_name')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (error) {
      console.error("Error checking onboarding status:", error);
      return;
    }

    if (data?.onboarding_completed) {
      navigate('/dashboard');
    } else if (data?.full_name) {
      setFullName(data.full_name);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !expertise.includes(newSkill.trim())) {
      setExpertise([...expertise, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const addCustomUniversity = async () => {
    if (!customUniversity.trim()) return;

    const { data, error } = await supabase
      .from('universities')
      .insert({
        name: customUniversity.trim(),
        type: 'private',
        location: 'Bangladesh',
        is_custom: true
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: 'Failed to add university', variant: 'destructive' });
    } else if (data) {
      setUniversities([...universities, data]);
      setSelectedUniversity(data);
      setShowCustomUniversity(false);
      setCustomUniversity('');
      toast({ title: 'Added!', description: 'University added successfully.' });
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setLoading(true);

    const updateData: Record<string, unknown> = {
      full_name: fullName,
      user_type: userType,
      bio: bio || null,
      title: title || null,
      linkedin_url: linkedinUrl || null,
      expertise: expertise.length > 0 ? expertise : null,
      university_id: selectedUniversity?.id || null,
      onboarding_completed: true
    };

    if (userType === 'investor') {
      updateData.investment_focus = investmentFocus.length > 0 ? investmentFocus : null;
      updateData.investment_range_min = investmentRangeMin ? parseFloat(investmentRangeMin) : null;
      updateData.investment_range_max = investmentRangeMax ? parseFloat(investmentRangeMax) : null;
    }

    // Also add user role
    await supabase
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role: userType === 'investor' ? 'mentor' : userType === 'founder' ? 'mentee' : 'mentee'
      });

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', user.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to complete onboarding', variant: 'destructive' });
    } else {
      toast({ title: 'Welcome to CampusLaunch!', description: 'Your profile is set up.' });
      navigate('/dashboard');
    }

    setLoading(false);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return fullName.trim().length >= 2;
      case 2:
        return userType !== '';
      case 3:
        return selectedUniversity !== null || showCustomUniversity;
      case 4:
        return true;
      default:
        return false;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                s === step ? 'w-8 bg-primary' : s < step ? 'w-8 bg-mint' : 'w-2 bg-muted'
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Name */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="glass-card">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Rocket className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Welcome to SheraStartup!</CardTitle>
                  <CardDescription>Let's set up your profile. What's your name?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="text-lg"
                      autoFocus
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: User Type */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="glass-card">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">What describes you best?</CardTitle>
                  <CardDescription>This helps us personalize your experience</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userTypes.map((type) => (
                      <button
                        key={type.id}
                        className={cn(
                          'p-4 rounded-xl border-2 text-left transition-all hover:border-primary/50',
                          userType === type.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:bg-muted/50'
                        )}
                        onClick={() => setUserType(type.id)}
                      >
                        <type.icon className={cn(
                          'h-8 w-8 mb-2',
                          userType === type.id ? 'text-primary' : 'text-muted-foreground'
                        )} />
                        <h3 className="font-semibold">{type.title}</h3>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: University */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="glass-card">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Select your university</CardTitle>
                  <CardDescription>Choose from the list or add your own</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Popover open={universityOpen} onOpenChange={setUniversityOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between h-12"
                      >
                        {selectedUniversity ? selectedUniversity.name : "Select university..."}
                        <ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search universities..." />
                        <CommandList>
                          <CommandEmpty>
                            <p className="py-2">No university found.</p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setShowCustomUniversity(true);
                                setUniversityOpen(false);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add manually
                            </Button>
                          </CommandEmpty>
                          <CommandGroup heading="Public Universities">
                            {universities
                              .filter(u => u.type === 'public')
                              .map((uni) => (
                                <CommandItem
                                  key={uni.id}
                                  value={uni.name}
                                  onSelect={() => {
                                    setSelectedUniversity(uni);
                                    setUniversityOpen(false);
                                  }}
                                >
                                  <Check className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedUniversity?.id === uni.id ? "opacity-100" : "opacity-0"
                                  )} />
                                  <div>
                                    <p>{uni.name}</p>
                                    {uni.location && (
                                      <p className="text-xs text-muted-foreground">{uni.location}</p>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                          <CommandGroup heading="Private Universities">
                            {universities
                              .filter(u => u.type === 'private')
                              .map((uni) => (
                                <CommandItem
                                  key={uni.id}
                                  value={uni.name}
                                  onSelect={() => {
                                    setSelectedUniversity(uni);
                                    setUniversityOpen(false);
                                  }}
                                >
                                  <Check className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedUniversity?.id === uni.id ? "opacity-100" : "opacity-0"
                                  )} />
                                  <div>
                                    <p>{uni.name}</p>
                                    {uni.location && (
                                      <p className="text-xs text-muted-foreground">{uni.location}</p>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {selectedUniversity && (
                    <div className="p-3 bg-mint/10 rounded-lg border border-mint/20">
                      <p className="font-medium">{selectedUniversity.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedUniversity.type === 'public' ? 'Public' : 'Private'} University
                        {selectedUniversity.location && ` • ${selectedUniversity.location}`}
                      </p>
                    </div>
                  )}

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">or</span>
                    </div>
                  </div>

                  {showCustomUniversity ? (
                    <div className="space-y-3">
                      <Label>Add your university</Label>
                      <div className="flex gap-2">
                        <Input
                          value={customUniversity}
                          onChange={(e) => setCustomUniversity(e.target.value)}
                          placeholder="University name"
                        />
                        <Button onClick={addCustomUniversity}>Add</Button>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setShowCustomUniversity(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setShowCustomUniversity(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      My university is not listed
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Details */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="glass-card">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Almost there!</CardTitle>
                  <CardDescription>Add a few more details to complete your profile</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title / Role</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={
                        userType === 'founder' ? 'e.g., CEO & Co-founder' :
                        userType === 'investor' ? 'e.g., Angel Investor' :
                        userType === 'mentor' ? 'e.g., Senior Software Engineer' :
                        'e.g., Computer Science Student'
                      }
                      className="bg-white/5 border-white/10 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      className="resize-none bg-white/5 border-white/10 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn URL (optional)</Label>
                    <Input
                      id="linkedin"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="bg-white/5 border-white/10 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Skills / Expertise</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add a skill"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                        className="bg-white/5 border-white/10 focus:border-primary"
                      />
                      <Button type="button" onClick={addSkill} size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {expertise.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {expertise.map((skill) => (
                          <Badge key={skill} variant="secondary" className="gap-1">
                            {skill}
                            <button
                              onClick={() => setExpertise(expertise.filter(s => s !== skill))}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {userType === 'investor' && (
                    <>
                      <div className="space-y-2">
                        <Label>Investment Focus Areas</Label>
                        <div className="flex flex-wrap gap-2">
                          {industries.map((industry) => (
                            <Badge
                              key={industry}
                              variant={investmentFocus.includes(industry) ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => {
                                if (investmentFocus.includes(industry)) {
                                  setInvestmentFocus(investmentFocus.filter(i => i !== industry));
                                } else {
                                  setInvestmentFocus([...investmentFocus, industry]);
                                }
                              }}
                            >
                              {industry}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Min Investment (USD)</Label>
                          <Input
                            type="number"
                            value={investmentRangeMin}
                            onChange={(e) => setInvestmentRangeMin(e.target.value)}
                            placeholder="10,000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Investment (USD)</Label>
                          <Input
                            type="number"
                            value={investmentRangeMax}
                            onChange={(e) => setInvestmentRangeMax(e.target.value)}
                            placeholder="100,000"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="ghost"
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
            >
              Continue
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={loading}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Complete Setup
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
