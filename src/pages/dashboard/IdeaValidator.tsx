import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lightbulb, Sparkles, Loader2, ArrowLeft, CheckCircle, XCircle, AlertTriangle, Target, Users, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface ValidationResult {
  overallScore: number;
  viabilityScore: number;
  marketScore: number;
  competitionScore: number;
  uniquenessScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  competitors: Array<{ name: string; description: string; marketShare?: string }>;
  marketInsights: {
    targetAudience: string;
    marketSize: string;
    growthPotential: string;
    entryBarriers: string;
  };
  recommendations: string[];
  verdict: 'strong' | 'moderate' | 'weak';
}

const IdeaValidator = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    ideaName: '',
    ideaDescription: '',
    targetAudience: '',
    problemSolved: '',
    proposedSolution: '',
    revenueModel: '',
    competitors: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleValidate = async () => {
    if (!formData.ideaName || !formData.ideaDescription || !formData.problemSolved) {
      toast.error('Please fill in at least the idea name, description, and problem solved');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('startup-tools-ai', {
        body: { toolType: 'idea-validator', data: formData }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResult(data.result);
      toast.success('Idea validation complete!');
    } catch (error) {
      console.error('Error validating idea:', error);
      toast.error('Failed to validate idea. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getVerdictConfig = (verdict: string) => {
    switch (verdict) {
      case 'strong':
        return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Strong Potential' };
      case 'moderate':
        return { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Moderate Potential' };
      default:
        return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Needs Work' };
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-20 lg:pb-6">
      <Button
        variant="ghost"
        className="mb-4 gap-2"
        onClick={() => navigate('/dashboard/tools')}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tools
      </Button>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500">
          <Lightbulb className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            AI Idea Validator
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              AI Powered
            </Badge>
          </h1>
          <p className="text-muted-foreground">Validate your startup idea with AI-powered market research</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Describe Your Startup Idea</CardTitle>
                <CardDescription>
                  Provide details about your idea and we'll analyze its market viability
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ideaName">Idea/Company Name *</Label>
                    <Input
                      id="ideaName"
                      placeholder="e.g., EcoDeliver"
                      value={formData.ideaName}
                      onChange={(e) => handleInputChange('ideaName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetAudience">Target Audience</Label>
                    <Input
                      id="targetAudience"
                      placeholder="e.g., Urban millennials, Small businesses"
                      value={formData.targetAudience}
                      onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ideaDescription">Idea Description *</Label>
                  <Textarea
                    id="ideaDescription"
                    placeholder="Describe your startup idea in detail..."
                    value={formData.ideaDescription}
                    onChange={(e) => handleInputChange('ideaDescription', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="problemSolved">Problem Being Solved *</Label>
                  <Textarea
                    id="problemSolved"
                    placeholder="What specific problem does your idea solve?"
                    value={formData.problemSolved}
                    onChange={(e) => handleInputChange('problemSolved', e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proposedSolution">Proposed Solution</Label>
                  <Textarea
                    id="proposedSolution"
                    placeholder="How does your product/service solve this problem?"
                    value={formData.proposedSolution}
                    onChange={(e) => handleInputChange('proposedSolution', e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="revenueModel">Revenue Model</Label>
                    <Input
                      id="revenueModel"
                      placeholder="e.g., Subscription, Marketplace fee"
                      value={formData.revenueModel}
                      onChange={(e) => handleInputChange('revenueModel', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="competitors">Known Competitors</Label>
                    <Input
                      id="competitors"
                      placeholder="e.g., Uber, DoorDash"
                      value={formData.competitors}
                      onChange={(e) => handleInputChange('competitors', e.target.value)}
                    />
                  </div>
                </div>

                <Button 
                  className="w-full gap-2" 
                  size="lg"
                  onClick={handleValidate}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Validating Idea...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Validate My Idea
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Overall Score Card */}
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold">{formData.ideaName}</h2>
                    <p className="text-muted-foreground">Validation Results</p>
                  </div>
                  {result.verdict && (() => {
                    const config = getVerdictConfig(result.verdict);
                    return (
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${config.bg}`}>
                        <config.icon className={`h-5 w-5 ${config.color}`} />
                        <span className={`font-medium ${config.color}`}>{config.label}</span>
                      </div>
                    );
                  })()}
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  {[
                    { label: 'Overall', score: result.overallScore, icon: Target },
                    { label: 'Viability', score: result.viabilityScore, icon: CheckCircle },
                    { label: 'Market', score: result.marketScore, icon: Users },
                    { label: 'Uniqueness', score: result.uniquenessScore, icon: TrendingUp }
                  ].map(({ label, score, icon: Icon }) => (
                    <div key={label} className="text-center p-4 rounded-lg bg-muted/50">
                      <Icon className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                      <div className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}/100</div>
                      <p className="text-sm text-muted-foreground">{label}</p>
                      <Progress value={score} className="mt-2 h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Executive Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{result.summary}</p>
              </CardContent>
            </Card>

            {/* Strengths & Weaknesses */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-500">
                    <CheckCircle className="h-5 w-5" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.strengths.map((strength, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-500">
                    <XCircle className="h-5 w-5" />
                    Weaknesses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.weaknesses.map((weakness, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-500 mt-1 flex-shrink-0" />
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Market Insights */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Market Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(result.marketInsights).map(([key, value]) => (
                    <div key={key} className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                      <p className="font-medium mt-1">{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Competitors */}
            {result.competitors?.length > 0 && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Competitor Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {result.competitors.map((comp, i) => (
                      <div key={i} className="p-4 rounded-lg border bg-card">
                        <h4 className="font-medium">{comp.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{comp.description}</p>
                        {comp.marketShare && (
                          <Badge variant="outline" className="mt-2">{comp.marketShare}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                        {i + 1}
                      </span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button variant="outline" className="flex-1" onClick={() => setResult(null)}>
                Validate Another Idea
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => navigate('/dashboard/tools')}>
                Back to Tools
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IdeaValidator;
