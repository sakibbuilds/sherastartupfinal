import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  Building2,
  Sparkles,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Target,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BizSimulationData {
  businessType: string;
  industry: string;
  initialInvestment: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  marketGrowthRate: number;
  competitorCount: number;
}

interface SimulationResult {
  summary: string;
  projections: {
    month3: { revenue: number; expenses: number; profit: number; cashBalance: number };
    month6: { revenue: number; expenses: number; profit: number; cashBalance: number };
    month12: { revenue: number; expenses: number; profit: number; cashBalance: number };
  };
  risks: string[];
  opportunities: string[];
  recommendations: string[];
  successProbability: number;
  breakEvenMonth: number;
}

const industries = ['SaaS', 'E-commerce', 'Marketplace', 'Fintech', 'Healthcare', 'EdTech', 'Consumer', 'Enterprise'];

const BizSimulation = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<BizSimulationData>({
    businessType: '',
    industry: '',
    initialInvestment: 50000,
    monthlyRevenue: 10000,
    monthlyExpenses: 8000,
    marketGrowthRate: 10,
    competitorCount: 5
  });
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleInputChange = (field: keyof BizSimulationData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const runSimulation = async () => {
    if (!formData.businessType || !formData.industry) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in the business type and industry.',
        variant: 'destructive'
      });
      return;
    }

    setIsSimulating(true);

    try {
      const { data, error } = await supabase.functions.invoke('startup-tools-ai', {
        body: {
          toolType: 'biz-simulation',
          data: formData
        }
      });

      if (error) throw error;

      if (data?.result) {
        setResult(data.result);
        toast({
          title: 'Simulation Complete!',
          description: 'Your business simulation results are ready.'
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-20 lg:pb-6">
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
          <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold">AI Business Simulation</h1>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            AI Powered
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Test your business strategies with AI-powered market simulations
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Business Parameters</CardTitle>
            <CardDescription>Enter your business details for simulation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Business Type</Label>
              <Input
                placeholder="e.g., B2B SaaS Platform"
                value={formData.businessType}
                onChange={(e) => handleInputChange('businessType', e.target.value)}
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
              <Label>Initial Investment ($)</Label>
              <Input
                type="number"
                value={formData.initialInvestment}
                onChange={(e) => handleInputChange('initialInvestment', parseInt(e.target.value) || 0)}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Monthly Revenue ($)</Label>
              <Input
                type="number"
                value={formData.monthlyRevenue}
                onChange={(e) => handleInputChange('monthlyRevenue', parseInt(e.target.value) || 0)}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Monthly Expenses ($)</Label>
              <Input
                type="number"
                value={formData.monthlyExpenses}
                onChange={(e) => handleInputChange('monthlyExpenses', parseInt(e.target.value) || 0)}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Market Growth Rate (%)</Label>
              <Input
                type="number"
                value={formData.marketGrowthRate}
                onChange={(e) => handleInputChange('marketGrowthRate', parseInt(e.target.value) || 0)}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Number of Competitors</Label>
              <Input
                type="number"
                value={formData.competitorCount}
                onChange={(e) => handleInputChange('competitorCount', parseInt(e.target.value) || 0)}
                className="mt-2"
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
                  Running Simulation...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Run AI Simulation
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
            className="space-y-4"
          >
            {/* Success Probability */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Success Probability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Progress value={result.successProbability} className="flex-1" />
                  <span className={cn(
                    "text-2xl font-bold",
                    result.successProbability >= 70 ? "text-green-500" :
                    result.successProbability >= 40 ? "text-yellow-500" : "text-red-500"
                  )}>
                    {result.successProbability}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Break-even projected at month {result.breakEvenMonth}
                </p>
              </CardContent>
            </Card>

            {/* Projections */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Financial Projections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: '3 Months', data: result.projections.month3 },
                    { label: '6 Months', data: result.projections.month6 },
                    { label: '12 Months', data: result.projections.month12 }
                  ].map(({ label, data }) => (
                    <div key={label} className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium mb-2">{label}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Revenue:</span>
                          <span className="text-green-500">{formatCurrency(data.revenue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Expenses:</span>
                          <span className="text-red-500">{formatCurrency(data.expenses)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Profit:</span>
                          <span className={data.profit >= 0 ? "text-green-500" : "text-red-500"}>
                            {formatCurrency(data.profit)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cash:</span>
                          <span>{formatCurrency(data.cashBalance)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Risks & Opportunities */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-red-500">
                    <AlertTriangle className="h-5 w-5" />
                    Risks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.risks.map((risk, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        {risk}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-green-500">
                    <TrendingUp className="h-5 w-5" />
                    Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.opportunities.map((opp, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-green-500">•</span>
                        {opp}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Recommendations */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Executive Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{result.summary}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BizSimulation;
