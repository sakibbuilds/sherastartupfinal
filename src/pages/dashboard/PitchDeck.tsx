import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  ArrowRight,
  PresentationIcon,
  Sparkles,
  RefreshCw,
  Download,
  Copy,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PitchDeckData {
  companyName: string;
  industry: string;
  stage: string;
  problemStatement: string;
  solution: string;
  targetMarket: string;
  businessModel: string;
  traction: string;
  team: string;
  fundingAsk: string;
}

interface Slide {
  title: string;
  content: string;
  speakerNotes: string;
}

const stages = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C+'];
const industries = ['SaaS', 'Fintech', 'E-commerce', 'Healthcare', 'EdTech', 'AI/ML', 'Consumer', 'Enterprise', 'Other'];

const PitchDeck = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<PitchDeckData>({
    companyName: '',
    industry: '',
    stage: '',
    problemStatement: '',
    solution: '',
    targetMarket: '',
    businessModel: '',
    traction: '',
    team: '',
    fundingAsk: ''
  });
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleInputChange = (field: keyof PitchDeckData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateDeck = async () => {
    if (!formData.companyName || !formData.problemStatement || !formData.solution) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in at least the company name, problem, and solution.',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('startup-tools-ai', {
        body: {
          toolType: 'pitch-deck',
          data: formData
        }
      });

      if (error) throw error;

      if (data?.result?.slides) {
        setSlides(data.result.slides);
        setShowResults(true);
        toast({
          title: 'Pitch Deck Generated!',
          description: 'Your AI-powered pitch deck is ready.'
        });
      } else if (typeof data?.result === 'string') {
        // Handle text response
        toast({
          title: 'Generated',
          description: 'Pitch deck content generated. Parsing...'
        });
      }
    } catch (error) {
      console.error('Error generating pitch deck:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate pitch deck. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copySlideContent = async () => {
    if (slides.length === 0) return;
    const content = slides.map(s => `# ${s.title}\n\n${s.content}\n\nSpeaker Notes: ${s.speakerNotes}`).join('\n\n---\n\n');
    await navigator.clipboard.writeText(content);
    toast({ title: 'Copied!', description: 'All slides copied to clipboard.' });
  };

  const exportToMarkdown = () => {
    if (slides.length === 0) return;
    const content = slides.map(s => `# ${s.title}\n\n${s.content}\n\n> Speaker Notes: ${s.speakerNotes}`).join('\n\n---\n\n');
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.companyName || 'pitch-deck'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded!', description: 'Pitch deck exported as Markdown.' });
  };

  if (showResults && slides.length > 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6 pb-20 lg:pb-6">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => setShowResults(false)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Editor
        </Button>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">{formData.companyName} Pitch Deck</h1>
              <p className="text-muted-foreground">AI-generated investor pitch deck</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={copySlideContent}>
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </Button>
              <Button onClick={exportToMarkdown}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Slide Preview */}
        <Card className="glass-card mb-6">
          <CardContent className="p-8">
            <div className="min-h-[400px] flex flex-col">
              <Badge variant="secondary" className="w-fit mb-4">
                Slide {currentSlide + 1} of {slides.length}
              </Badge>
              <h2 className="text-3xl font-bold mb-6">{slides[currentSlide].title}</h2>
              <div className="flex-1 whitespace-pre-wrap text-lg leading-relaxed">
                {slides[currentSlide].content}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Speaker Notes */}
        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Speaker Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{slides[currentSlide].speakerNotes}</p>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex gap-1">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  i === currentSlide ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>

          <Button
            variant="outline"
            onClick={() => setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1))}
            disabled={currentSlide === slides.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

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
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <PresentationIcon className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold">AI Pitch Deck Creator</h1>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            AI Powered
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Generate a professional 10-slide pitch deck with AI-powered content
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>Fill in your startup details to generate a customized pitch deck</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Company Name *</Label>
              <Input
                placeholder="e.g., TechFlow"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Industry</Label>
              <select
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className="mt-2 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select industry</option>
                {industries.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>Stage</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {stages.map(stage => (
                <Badge
                  key={stage}
                  variant={formData.stage === stage ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleInputChange('stage', stage)}
                >
                  {stage}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Problem Statement *</Label>
            <Textarea
              placeholder="What problem are you solving? Who experiences this problem?"
              value={formData.problemStatement}
              onChange={(e) => handleInputChange('problemStatement', e.target.value)}
              className="mt-2 min-h-[100px]"
            />
          </div>

          <div>
            <Label>Your Solution *</Label>
            <Textarea
              placeholder="How does your product/service solve this problem?"
              value={formData.solution}
              onChange={(e) => handleInputChange('solution', e.target.value)}
              className="mt-2 min-h-[100px]"
            />
          </div>

          <div>
            <Label>Target Market</Label>
            <Textarea
              placeholder="Who are your customers? What's the market size?"
              value={formData.targetMarket}
              onChange={(e) => handleInputChange('targetMarket', e.target.value)}
              className="mt-2 min-h-[80px]"
            />
          </div>

          <div>
            <Label>Business Model</Label>
            <Textarea
              placeholder="How do you make money? Pricing strategy?"
              value={formData.businessModel}
              onChange={(e) => handleInputChange('businessModel', e.target.value)}
              className="mt-2 min-h-[80px]"
            />
          </div>

          <div>
            <Label>Traction & Milestones</Label>
            <Textarea
              placeholder="Key metrics, customer growth, revenue, partnerships..."
              value={formData.traction}
              onChange={(e) => handleInputChange('traction', e.target.value)}
              className="mt-2 min-h-[80px]"
            />
          </div>

          <div>
            <Label>Team</Label>
            <Textarea
              placeholder="Key team members and their relevant experience"
              value={formData.team}
              onChange={(e) => handleInputChange('team', e.target.value)}
              className="mt-2 min-h-[80px]"
            />
          </div>

          <div>
            <Label>Funding Ask</Label>
            <Input
              placeholder="e.g., $1M seed round for 18 months runway"
              value={formData.fundingAsk}
              onChange={(e) => handleInputChange('fundingAsk', e.target.value)}
              className="mt-2"
            />
          </div>

          <Button 
            className="w-full gap-2" 
            size="lg"
            onClick={generateDeck}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating Pitch Deck...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Pitch Deck with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PitchDeck;
