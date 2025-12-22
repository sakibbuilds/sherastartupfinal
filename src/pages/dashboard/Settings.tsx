import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Lock, User, Palette, Moon, Sun, Shield, BadgeCheck, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';

import { Loader2 } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [verificationStatus, setVerificationStatus] = useState<'none' | 'pending' | 'verified' | 'rejected'>('none');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("account");

  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  // Verification Form State
  const [verificationForm, setVerificationForm] = useState({
    fullName: '',
    linkedinUrl: '',
    reason: '',
    documentUrl: '' // For now just a link, could be file upload
  });

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user?.id)
      .single();

    if (data) {
      setProfile(data);
      if (data.verified) {
        setVerificationStatus('verified');
        // Clear any pending local state if verified
        localStorage.removeItem(`verification_pending_${user?.id}`);
      } else {
        // Check verification_requests table
        const { data: requestData } = await supabase
          .from('verification_requests')
          .select('status, rejection_reason')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (requestData) {
          setVerificationStatus(requestData.status as any);
          if (requestData.status === 'rejected') {
            setRejectionReason(requestData.rejection_reason);
            // Clear local pending if rejected, so we don't show pending
            localStorage.removeItem(`verification_pending_${user?.id}`);
          }
        } else {
          // Fallback to local storage if table doesn't exist or no record
           const isPending = localStorage.getItem(`verification_pending_${user?.id}`);
           if (isPending === 'true') {
             setVerificationStatus('pending');
           } else {
             setVerificationStatus('none');
           }
        }
      }
    }
    setLoading(false);
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    try {
      // Insert into verification_requests
      const { error } = await supabase
        .from('verification_requests')
        .insert({
          user_id: user.id,
          full_name: verificationForm.fullName,
          linkedin_url: verificationForm.linkedinUrl,
          reason: verificationForm.reason,
          document_url: verificationForm.documentUrl,
          status: 'pending'
        });

      if (error) {
        console.error('Error submitting verification:', error);
        // Fallback if table missing
        localStorage.setItem(`verification_pending_${user.id}`, 'true');
      } else {
        localStorage.removeItem(`verification_pending_${user.id}`); // Clear local fallback if success
      }

      toast({
        title: "Request Submitted",
        description: "Your verification request has been received. We will review it shortly.",
      });

      setVerificationStatus('pending');
    } catch (err) {
      console.error('Submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderVerificationContent = () => {
    if (verificationStatus === 'verified') {
      return (
        <div className="text-center py-8 space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
            <VerifiedBadge size="lg" className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-primary">You are Verified!</h3>
            <p className="text-muted-foreground">Your profile displays the verified badge, building trust with the community.</p>
          </div>
        </div>
      );
    }

    if (verificationStatus === 'pending') {
      return (
        <div className="space-y-4">
          <Alert className="bg-yellow-500/10 border-yellow-500/20 text-yellow-500">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Verification Pending</AlertTitle>
            <AlertDescription>
              Your request is currently under review. This process typically takes 24-48 hours.
            </AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              // Allow cancelling/resetting for demo purposes or if stuck
              localStorage.removeItem(`verification_pending_${user?.id}`);
              setVerificationStatus('none');
            }}
          >
            Cancel Request
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {verificationStatus === 'rejected' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Verification Rejected</AlertTitle>
            <AlertDescription>
              Your previous request was not approved.
              {rejectionReason && (
                <div className="mt-2 p-2 bg-red-950/30 rounded border border-red-900/50 text-sm">
                  <strong>Admin Reason:</strong> {rejectionReason}
                </div>
              )}
              <div className="mt-2">Please review your details and submit a new request.</div>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleVerificationSubmit} className="space-y-6">
        <Alert>
          <BadgeCheck className="h-4 w-4 text-primary" />
          <AlertTitle>Get Verified</AlertTitle>
          <AlertDescription>
            Verified users get a badge on their profile and higher visibility in search results.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name (as per ID)</Label>
            <Input 
              required 
              value={verificationForm.fullName}
              onChange={(e) => setVerificationForm({...verificationForm, fullName: e.target.value})}
              placeholder="John Doe" 
            />
          </div>

          <div className="space-y-2">
            <Label>LinkedIn Profile URL</Label>
            <Input 
              required 
              type="url"
              value={verificationForm.linkedinUrl}
              onChange={(e) => setVerificationForm({...verificationForm, linkedinUrl: e.target.value})}
              placeholder="https://linkedin.com/in/johndoe" 
            />
          </div>

          {profile?.user_type === 'startup' || profile?.user_type === 'founder' ? (
             <div className="space-y-2">
               <Label>Startup Registration Number / Tax ID</Label>
               <Input placeholder="Optional but recommended" />
             </div>
          ) : profile?.user_type === 'investor' ? (
            <div className="space-y-2">
              <Label>Firm / Portfolio Link</Label>
              <Input required placeholder="https://..." />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>University Email (if applicable)</Label>
              <Input type="email" placeholder="john@university.edu" />
            </div>
          )}

          <div className="space-y-2">
            <Label>Why should we verify you?</Label>
            <Textarea 
              required
              value={verificationForm.reason}
              onChange={(e) => setVerificationForm({...verificationForm, reason: e.target.value})}
              placeholder="Tell us about your background and contributions..." 
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Verification Request'
          )}
        </Button>
      </form>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-20 lg:pb-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-8 bg-black/20 backdrop-blur-lg border border-white/10 p-1 rounded-xl">
          <TabsTrigger value="account" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <User className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger value="verification" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <BadgeCheck className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Verification</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <Bell className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <Palette className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <Shield className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <TabsContent value="account">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Update your account details and preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" defaultValue={user?.email || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input id="full_name" defaultValue={profile?.full_name || ''} />
                </div>
                <div className="pt-4">
                  <Button>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verification">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Verification Status</CardTitle>
                <CardDescription>
                  Apply for a verified badge to build trust.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderVerificationContent()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive emails about your account activity.
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label className="text-base">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications on your device.
                    </p>
                  </div>
                  <Switch
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label className="text-base">Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive emails about new features and offers.
                    </p>
                  </div>
                  <Switch
                    checked={marketingEmails}
                    onCheckedChange={setMarketingEmails}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize the look and feel of the application.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <button className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-primary bg-primary/10 transition-all">
                      <Moon className="h-6 w-6" />
                      <span className="font-medium">Dark</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-transparent hover:bg-white/5 transition-all opacity-50 cursor-not-allowed" disabled title="Only Dark Mode available">
                      <Sun className="h-6 w-6" />
                      <span className="font-medium">Light</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-transparent hover:bg-white/5 transition-all opacity-50 cursor-not-allowed" disabled title="Only Dark Mode available">
                      <Palette className="h-6 w-6" />
                      <span className="font-medium">System</span>
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Zyricon currently supports Dark Mode only for the best experience.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>
                  Manage your password and security settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
                <div className="pt-4">
                  <Button>Update Password</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </motion.div>
      </Tabs>
    </div>
  );
};

export default Settings;
