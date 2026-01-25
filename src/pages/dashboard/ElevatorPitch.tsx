import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  ArrowRight, 
  Copy, 
  Mic, 
  RefreshCw, 
  Sparkles,
  Clock,
  Target,
  Lightbulb,
  Users,
  TrendingUp,
  CheckCircle,
  Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PitchData {
  companyName: string;
  problemStatement: string;
  solution: string;
  targetMarket: string;
  uniqueValue: string;
  traction: string;
  ask: string;
}

const steps = [
  { id: 'problem', title: 'The Problem', icon: Target, description: 'What pain point are you solving?' },
  { id: 'solution', title: 'Your Solution', icon: Lightbulb, description: 'How do you solve it?' },
  { id: 'market', title: 'Target Market', icon: Users, description: 'Who are your customers?' },
  { id: 'value', title: 'Unique Value', icon: Sparkles, description: 'What makes you different?' },
  { id: 'traction', title: 'Traction', icon: TrendingUp, description: 'What progress have you made?' },
  { id: 'ask', title: 'The Ask', icon: CheckCircle, description: 'What do you need?' }
];

const ElevatorPitch = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [pitchData, setPitchData] = useState<PitchData>({
    companyName: '',
    problemStatement: '',
    solution: '',
    targetMarket: '',
    uniqueValue: '',
    traction: '',
    ask: ''
  });
  const [generatedPitch, setGeneratedPitch] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImproving, setIsImproving] = useState(false);

  const handleInputChange = (field: keyof PitchData, value: string) => {
    setPitchData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      generatePitch();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const generatePitch = async () => {
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('startup-tools-ai', {
        body: {
          toolType: 'elevator-pitch',
          data: pitchData
        }
      });

      if (error) throw error;

      if (data?.result) {
        setGeneratedPitch(data.result);
        setCurrentStep(steps.length);
        toast({
          title: 'Pitch Generated!',
          description: 'Your AI-powered elevator pitch is ready.'
        });
      }
    } catch (error) {
      console.error('Error generating pitch:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate pitch. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const improvePitch = async () => {
    if (!generatedPitch.trim()) return;
    
    setIsImproving(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('startup-tools-ai', {
        body: {
          toolType: 'improve-pitch',
          data: { currentPitch: generatedPitch }
        }
      });

      if (error) throw error;

      if (data?.result) {
        setGeneratedPitch(data.result);
        toast({
          title: 'Pitch Improved!',
          description: 'Your pitch has been enhanced by AI.'
        });
      }
    } catch (error) {
      console.error('Error improving pitch:', error);
      toast({
        title: 'Error',
        description: 'Failed to improve pitch. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsImproving(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedPitch);
    toast({ title: 'Copied!', description: 'Pitch copied to clipboard.' });
  };

  const resetBuilder = () => {
    setPitchData({
      companyName: '',
      problemStatement: '',
      solution: '',
      targetMarket: '',
      uniqueValue: '',
      traction: '',
      ask: ''
    });
    setGeneratedPitch('');
    setCurrentStep(0);
  };

  const progress = ((currentStep + 1) / (steps.length + 1)) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <Label>Company Name</Label>
              <Input
                placeholder="e.g., TechFlow"
                value={pitchData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Problem Statement</Label>
              <Textarea
                placeholder="e.g., Small businesses waste 10+ hours weekly on manual invoicing and payment tracking"
                value={pitchData.problemStatement}
                onChange={(e) => handleInputChange('problemStatement', e.target.value)}
                className="mt-2 min-h-[120px]"
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div>
            <Label>Your Solution</Label>
            <Textarea
              placeholder="e.g., An AI-powered invoicing platform that automates billing, tracks payments, and predicts cash flow"
              value={pitchData.solution}
              onChange={(e) => handleInputChange('solution', e.target.value)}
              className="mt-2 min-h-[150px]"
            />
          </div>
        );
      case 2:
        return (
          <div>
            <Label>Target Market</Label>
            <Textarea
              placeholder="e.g., 30 million small businesses in the US with 1-50 employees who handle their own finances"
              value={pitchData.targetMarket}
              onChange={(e) => handleInputChange('targetMarket', e.target.value)}
              className="mt-2 min-h-[150px]"
            />
          </div>
        );
      case 3:
        return (
          <div>
            <Label>Unique Value Proposition</Label>
            <Textarea
              placeholder="e.g., We're the only solution that combines AI forecasting with WhatsApp integration for payment reminders"
              value={pitchData.uniqueValue}
              onChange={(e) => handleInputChange('uniqueValue', e.target.value)}
              className="mt-2 min-h-[150px]"
            />
          </div>
        );
      case 4:
        return (
          <div>
            <Label>Traction & Milestones</Label>
            <Textarea
              placeholder="e.g., 500+ paying customers, $50K MRR, 40% month-over-month growth"
              value={pitchData.traction}
              onChange={(e) => handleInputChange('traction', e.target.value)}
              className="mt-2 min-h-[150px]"
            />
          </div>
        );
      case 5:
        return (
          <div>
            <Label>Your Ask</Label>
            <Textarea
              placeholder="e.g., $500K seed funding to expand our sales team and enter new markets"
              value={pitchData.ask}
              onChange={(e) => handleInputChange('ask', e.target.value)}
              className="mt-2 min-h-[150px]"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-20 lg:pb-6">
      <Button 
        variant="ghost" 
        className="mb-6"
        onClick={() => navigate('/dashboard/tools')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Tools
      </Button>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
            <Mic className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold">AI Elevator Pitch Builder</h1>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            AI Powered
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Craft a compelling 60-second pitch in 6 simple steps with AI assistance
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">
            {currentStep < steps.length ? `Step ${currentStep + 1} of ${steps.length}` : 'Complete!'}
          </span>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>~60 seconds</span>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step indicators */}
      {currentStep < steps.length && (
        <div className="flex justify-between mb-8 overflow-x-auto pb-2">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={cn(
                "flex flex-col items-center gap-1 min-w-[60px]",
                index <= currentStep ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                index < currentStep ? "bg-primary text-primary-foreground" :
                index === currentStep ? "bg-primary/20 border-2 border-primary" :
                "bg-muted"
              )}>
                <step.icon className="h-4 w-4" />
              </div>
              <span className="text-xs text-center hidden sm:block">{step.title}</span>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {currentStep < steps.length ? (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {(() => {
                    const StepIcon = steps[currentStep].icon;
                    return <StepIcon className="h-5 w-5" />;
                  })()}
                  {steps[currentStep].title}
                </CardTitle>
                <CardDescription>{steps[currentStep].description}</CardDescription>
              </CardHeader>
              <CardContent>
                {renderStepContent()}
                
                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button onClick={nextStep} disabled={isGenerating}>
                    {currentStep === steps.length - 1 ? (
                      isGenerating ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate with AI
                        </>
                      )
                    ) : (
                      <>
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Your AI-Generated Elevator Pitch
                  </CardTitle>
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3 w-3" />
                    ~60 sec
                  </Badge>
                </div>
                <CardDescription>
                  Here's your AI-generated pitch. You can edit it or use AI to improve it further!
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">AI is crafting your perfect pitch...</p>
                  </div>
                ) : (
                  <>
                    <Textarea
                      value={generatedPitch}
                      onChange={(e) => setGeneratedPitch(e.target.value)}
                      className="min-h-[300px] text-base leading-relaxed"
                    />
                    
                    <div className="flex flex-wrap gap-3 mt-6">
                      <Button onClick={copyToClipboard}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button 
                        variant="secondary" 
                        onClick={improvePitch}
                        disabled={isImproving}
                      >
                        {isImproving ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Improving...
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-4 w-4 mr-2" />
                            Improve with AI
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={resetBuilder}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Start Over
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setCurrentStep(0)}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Edit Inputs
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ElevatorPitch;
