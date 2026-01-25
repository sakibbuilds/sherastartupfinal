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
  TrendingUp,
  Sparkles,
  RefreshCw,
  DollarSign,
  Target,
  MessageSquare,
  BarChart3,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface InvestmentData {
  companyName: string;
  industry: string;
  stage: string;
  currentRevenue: number;
  projectedRevenue: number;
  fundingAmount: number;
  equityOffered: number;
  useOfFunds: string;
}

interface SimulationResult {
  investorFeedback: string;
  valuationAnalysis: {
    impliedValuation: number;
    industryComparable: number;
    recommendedValuation: number;
    valuationReasoning: string;
  };
  negotiationSimulation: Array<{
    round: number;
    investorOffer?: string;
    counterOffer?: string;
    finalTerms?: string;
    reasoning: string;
  }>;
  pitchScore: {
    overall: number;
    problem: number;
    solution: number;
    market: number;
    team: number;
    financials: number;
  };
  improvements: string[];
  dealLikelihood: number;
}

const stages = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C+'];
const industries = ['SaaS', 'Fintech', 'E-commerce', 'Healthcare', 'EdTech', 'AI/ML', 'Consumer', 'Enterprise'];

const InvestmentSimulation = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<InvestmentData>({
    companyName: '',
    industry: '',
    stage: 'Seed',
    currentRevenue: 100000,
    projectedRevenue: 500000,
    fundingAmount: 500000,
    equityOffered: 15,
    useOfFunds: ''
  });
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleInputChange = (field: keyof InvestmentData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const runSimulation = async () => {
    if (!formData.companyName || !formData.industry) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in the company name and industry.',
        variant: 'destructive'
      });
      return;
    }

    setIsSimulating(true);

    try {
      const { data, error } = await supabase.functions.invoke('startup-tools-ai', {
        body: {
          toolType: 'investment-simulation',
          data: formData
        }
      });

      if (error) throw error;

      if (data?.result) {
        setResult(data.result);
        toast({
          title: 'Simulation Complete!',
          description: 'Your investment simulation results are ready.'
        });
      }
    } catch (error) {
      console.error('Error running simulation:', error);
      toast({
        title: 'Error',
        description: 'Failed to run simulation. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-20 lg:pb-6">
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
          <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold">AI Investment Simulation</h1>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            AI Powered
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Practice investment pitches and negotiations with AI investors
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Input Form */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Investment Details</CardTitle>
            <CardDescription>Enter your funding parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Company Name</Label>
              <Input
                placeholder="e.g., TechFlow Inc."
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
              <Label>Current Annual Revenue ($)</Label>
              <Input
                type="number"
                value={formData.currentRevenue}
                onChange={(e) => handleInputChange('currentRevenue', parseInt(e.target.value) || 0)}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Projected Revenue (Next Year) ($)</Label>
              <Input
                type="number"
                value={formData.projectedRevenue}
                onChange={(e) => handleInputChange('projectedRevenue', parseInt(e.target.value) || 0)}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Funding Amount Requested ($)</Label>
              <Input
                type="number"
                value={formData.fundingAmount}
                onChange={(e) => handleInputChange('fundingAmount', parseInt(e.target.value) || 0)}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Equity Offered (%)</Label>
              <Input
                type="number"
                value={formData.equityOffered}
                onChange={(e) => handleInputChange('equityOffered', parseFloat(e.target.value) || 0)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Implied valuation: {formatCurrency((formData.fundingAmount / formData.equityOffered) * 100)}
              </p>
            </div>

            <div>
              <Label>Use of Funds</Label>
              <Textarea
                placeholder="How will you use this investment?"
                value={formData.useOfFunds}
                onChange={(e) => handleInputChange('useOfFunds', e.target.value)}
                className="mt-2 min-h-[80px]"
              />
            </div>

            <Button 
              className="w-full gap-2" 
              size="lg"
              onClick={runSimulation}
              disabled={isSimulating}
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Simulating Investment...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Start AI Investment Simulation
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3 space-y-4"
          >
            {/* Deal Likelihood */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Deal Likelihood
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Progress value={result.dealLikelihood} className="flex-1" />
                  <span className={cn(
                    "text-2xl font-bold",
                    result.dealLikelihood >= 70 ? "text-green-500" :
                    result.dealLikelihood >= 40 ? "text-yellow-500" : "text-red-500"
                  )}>
                    {result.dealLikelihood}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Pitch Score */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Pitch Score Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-3xl font-bold">{result.pitchScore.overall}</span>
                  <span className="text-muted-foreground">/ 100</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Problem', score: result.pitchScore.problem },
                    { label: 'Solution', score: result.pitchScore.solution },
                    { label: 'Market', score: result.pitchScore.market },
                    { label: 'Team', score: result.pitchScore.team },
                    { label: 'Financials', score: result.pitchScore.financials }
                  ].map(({ label, score }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-sm">{label}</span>
                      <span className={cn("font-medium", getScoreColor(score))}>
                        {score}/100
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Valuation Analysis */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Valuation Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your Implied Valuation:</span>
                  <span className="font-medium">{formatCurrency(result.valuationAnalysis.impliedValuation)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Industry Comparable:</span>
                  <span className="font-medium">{formatCurrency(result.valuationAnalysis.industryComparable)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">AI Recommended:</span>
                  <span className="font-medium text-primary">{formatCurrency(result.valuationAnalysis.recommendedValuation)}</span>
                </div>
                <p className="text-sm text-muted-foreground pt-2 border-t">
                  {result.valuationAnalysis.valuationReasoning}
                </p>
              </CardContent>
            </Card>

            {/* Negotiation Simulation */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Negotiation Simulation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.negotiationSimulation.map((round, i) => (
                    <div key={i} className="p-3 bg-muted/50 rounded-lg">
                      <Badge variant="outline" className="mb-2">Round {round.round}</Badge>
                      {round.investorOffer && (
                        <p className="text-sm mb-1">
                          <span className="font-medium">Investor:</span> {round.investorOffer}
                        </p>
                      )}
                      {round.counterOffer && (
                        <p className="text-sm mb-1">
                          <span className="font-medium">Counter:</span> {round.counterOffer}
                        </p>
                      )}
                      {round.finalTerms && (
                        <p className="text-sm mb-1">
                          <span className="font-medium text-green-500">Final Terms:</span> {round.finalTerms}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">{round.reasoning}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Investor Feedback */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">AI Investor Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{result.investorFeedback}</p>
              </CardContent>
            </Card>

            {/* Improvements */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Suggested Improvements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.improvements.map((imp, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      {imp}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default InvestmentSimulation;
