import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { toast } from '@/hooks/use-toast';
import { Loader2, Flag, AlertTriangle, Ban, Copyright, UserX, ShieldAlert } from 'lucide-react';

interface ReportPitchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  videoTitle: string;
}

const reportCategories = [
  { 
    value: 'spam', 
    label: 'Spam or Misleading', 
    description: 'Fake engagement, scam, or misleading content',
    icon: Ban
  },
  { 
    value: 'harassment', 
    label: 'Harassment or Bullying', 
    description: 'Targeting, threatening, or intimidating content',
    icon: UserX
  },
  { 
    value: 'hate_speech', 
    label: 'Hate Speech', 
    description: 'Discrimination, hatred, or violence against groups',
    icon: AlertTriangle
  },
  { 
    value: 'violence', 
    label: 'Violence or Dangerous Acts', 
    description: 'Graphic violence, harmful activities, or threats',
    icon: ShieldAlert
  },
  { 
    value: 'copyright', 
    label: 'Copyright Infringement', 
    description: 'Unauthorized use of copyrighted material',
    icon: Copyright
  },
  { 
    value: 'inappropriate', 
    label: 'Inappropriate Content', 
    description: 'Adult content, nudity, or sexually explicit material',
    icon: Flag
  },
  { 
    value: 'fraud', 
    label: 'Fraud or False Information', 
    description: 'Fake business claims or fraudulent investment offers',
    icon: AlertTriangle
  },
  { 
    value: 'other', 
    label: 'Other', 
    description: 'Other violations not listed above',
    icon: Flag
  },
];

const ReportPitchDialog = ({ open, onOpenChange, videoId, videoTitle }: ReportPitchDialogProps) => {
  const { user } = useAuth();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !category) return;

    setSubmitting(true);
    
    const { error } = await supabase
      .from('pitch_reports')
      .insert({
        video_id: videoId,
        reporter_id: user.id,
        category,
        description: description.trim() || null
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit report. Please try again.',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Report Submitted',
        description: 'Thank you for helping keep our community safe. We will review this pitch.',
      });
      setCategory('');
      setDescription('');
      onOpenChange(false);
    }
    
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <VisuallyHidden.Root>
            <DialogTitle>Report Pitch Dialog</DialogTitle>
          </VisuallyHidden.Root>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" />
            Report Pitch
          </DialogTitle>
          <DialogDescription>
            Report "{videoTitle}" for violating community guidelines
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Select a reason for reporting
            </Label>
            <RadioGroup value={category} onValueChange={setCategory} className="space-y-2">
              {reportCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div
                    key={cat.value}
                    className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      category === cat.value 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-muted-foreground/50'
                    }`}
                    onClick={() => setCategory(cat.value)}
                  >
                    <RadioGroupItem value={cat.value} id={cat.value} className="mt-0.5" />
                    <div className="flex-1">
                      <Label 
                        htmlFor={cat.value} 
                        className="flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {cat.label}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Additional details (optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide any additional context about this report..."
              className="mt-2 resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {description.length}/500
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!category || submitting}
            variant="destructive"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportPitchDialog;