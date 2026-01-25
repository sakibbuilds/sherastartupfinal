import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Sparkles, Loader2, ArrowLeft, DollarSign, TrendingUp, Building, BarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface ValuationResult {
  estimatedValuation: {
    low: string;
    mid: string;
    high: string;
  };
  methodology: {
    dcf: { value: string; weight: string; reasoning: string };
    comparables: { value: string; weight: string; reasoning: string };
    vcMethod: { value: string; weight: string; reasoning: string };
  };
  keyMultiples: {
    revenueMultiple: string;
    ebitdaMultiple: string;
    userMultiple?: string;
  };
  comparableCompanies: Array<{
    name: string;
    valuation: string;
    revenue: string;
    multiple: string;
  }>;
  valuationDrivers: string[];
  valuationRisks: string[];
  recommendations: string[];
  investorPerspective: string;
  exitScenarios: Array<{
    type: string;
    timeline: string;
    potentialValue: string;
    likelihood: string;
  }>;
}

const ValuationCalculator = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    stage: '',
    annualRevenue: '',
    revenueGrowthRate: '',
    grossMargin: '',
    ebitda: '',
    totalUsers: '',
    monthlyActiveUsers: '',
    totalFundingRaised: '',
    lastValuation: '',
    uniqueAdvantages: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ValuationResult | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculate = async () => {
    if (!formData.companyName || !formData.industry || !formData.stage || !formData.annualRevenue) {
      toast.error('Please fill in the required fields');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('startup-tools-ai', {
        body: { toolType: 'valuation-calculator', data: formData }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResult(data.result);
      toast.success('Valuation analysis complete!');
    } catch (error) {
      console.error('Error calculating valuation:', error);
      toast.error('Failed to calculate valuation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const stages = [
    'Pre-seed',
    'Seed',
    'Series A',
    'Series B',
    'Series C+',
    'Growth',
    'Pre-IPO'
  ];

  const industries = [
    'SaaS / Software',
    'FinTech',
    'HealthTech',
    'EdTech',
    'E-commerce',
    'Marketplace',
    'AI / ML',
    'CleanTech',
    'Consumer',
    'Enterprise',
    'Other'
  ];

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
        <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500">
          <Calculator className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            AI Valuation Calculator
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              AI Powered
            </Badge>
          </h1>
          <p className="text-muted-foreground">Estimate your startup valuation using AI analysis</p>
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
                <CardTitle>Enter Company Details</CardTitle>
                <CardDescription>
                  Provide your company metrics for a comprehensive valuation analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      placeholder="e.g., TechStartup Inc."
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry *</Label>
                    <Select
                      value={formData.industry}
                      onValueChange={(value) => handleInputChange('industry', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map(ind => (
                          <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stage">Funding Stage *</Label>
                    <Select
                      value={formData.stage}
                      onValueChange={(value) => handleInputChange('stage', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {stages.map(stage => (
                          <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="annualRevenue">Annual Revenue ($) *</Label>
                    <Input
                      id="annualRevenue"
                      type="number"
                      placeholder="e.g., 1000000"
                      value={formData.annualRevenue}
                      onChange={(e) => handleInputChange('annualRevenue', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="revenueGrowthRate">YoY Growth Rate (%)</Label>
                    <Input
                      id="revenueGrowthRate"
                      type="number"
                      placeholder="e.g., 100"
                      value={formData.revenueGrowthRate}
                      onChange={(e) => handleInputChange('revenueGrowthRate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grossMargin">Gross Margin (%)</Label>
                    <Input
                      id="grossMargin"
                      type="number"
                      placeholder="e.g., 70"
                      value={formData.grossMargin}
                      onChange={(e) => handleInputChange('grossMargin', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="ebitda">EBITDA ($)</Label>
                    <Input
                      id="ebitda"
                      type="number"
                      placeholder="e.g., -200000"
                      value={formData.ebitda}
                      onChange={(e) => handleInputChange('ebitda', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalUsers">Total Users</Label>
                    <Input
                      id="totalUsers"
                      type="number"
                      placeholder="e.g., 50000"
                      value={formData.totalUsers}
                      onChange={(e) => handleInputChange('totalUsers', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyActiveUsers">Monthly Active Users</Label>
                    <Input
                      id="monthlyActiveUsers"
                      type="number"
                      placeholder="e.g., 25000"
                      value={formData.monthlyActiveUsers}
                      onChange={(e) => handleInputChange('monthlyActiveUsers', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="totalFundingRaised">Total Funding Raised ($)</Label>
                    <Input
                      id="totalFundingRaised"
                      type="number"
                      placeholder="e.g., 2000000"
                      value={formData.totalFundingRaised}
                      onChange={(e) => handleInputChange('totalFundingRaised', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastValuation">Last Valuation ($)</Label>
                    <Input
                      id="lastValuation"
                      type="number"
                      placeholder="e.g., 10000000"
                      value={formData.lastValuation}
                      onChange={(e) => handleInputChange('lastValuation', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="uniqueAdvantages">Unique Advantages / Moat</Label>
                  <Textarea
                    id="uniqueAdvantages"
                    placeholder="Describe your competitive advantages, IP, network effects, etc."
                    value={formData.uniqueAdvantages}
                    onChange={(e) => handleInputChange('uniqueAdvantages', e.target.value)}
                    rows={3}
                  />
                </div>

                <Button 
                  className="w-full gap-2" 
                  size="lg"
                  onClick={handleCalculate}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Calculating Valuation...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Calculate Valuation
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
            {/* Estimated Valuation */}
            <Card className="glass-card overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-teal-500 to-cyan-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Estimated Valuation Range
                </CardTitle>
                <CardDescription>{formData.companyName}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { label: 'Conservative', value: result.estimatedValuation.low, color: 'text-yellow-500' },
                    { label: 'Base Case', value: result.estimatedValuation.mid, color: 'text-green-500' },
                    { label: 'Optimistic', value: result.estimatedValuation.high, color: 'text-blue-500' }
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-1">{label}</p>
                      <div className={`text-3xl font-bold ${color}`}>{value}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Key Multiples */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Key Valuation Multiples
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <p className="text-sm text-muted-foreground">Revenue Multiple</p>
                    <div className="text-2xl font-bold mt-1">{result.keyMultiples.revenueMultiple}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <p className="text-sm text-muted-foreground">EBITDA Multiple</p>
                    <div className="text-2xl font-bold mt-1">{result.keyMultiples.ebitdaMultiple}</div>
                  </div>
                  {result.keyMultiples.userMultiple && (
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-sm text-muted-foreground">Per-User Value</p>
                      <div className="text-2xl font-bold mt-1">{result.keyMultiples.userMultiple}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Methodology Breakdown */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Valuation Methodology</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { key: 'DCF', data: result.methodology.dcf },
                    { key: 'Comparables', data: result.methodology.comparables },
                    { key: 'VC Method', data: result.methodology.vcMethod }
                  ].map(({ key, data }) => (
                    <div key={key} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{key}</h4>
                        <Badge variant="outline">{data.weight}</Badge>
                      </div>
                      <div className="text-xl font-bold mb-2">{data.value}</div>
                      <p className="text-sm text-muted-foreground">{data.reasoning}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Comparable Companies */}
            {result.comparableCompanies?.length > 0 && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Comparable Companies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2">Company</th>
                          <th className="text-right py-3 px-2">Valuation</th>
                          <th className="text-right py-3 px-2">Revenue</th>
                          <th className="text-right py-3 px-2">Multiple</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.comparableCompanies.map((comp, i) => (
                          <tr key={i} className="border-b">
                            <td className="py-3 px-2 font-medium">{comp.name}</td>
                            <td className="text-right py-3 px-2">{comp.valuation}</td>
                            <td className="text-right py-3 px-2">{comp.revenue}</td>
                            <td className="text-right py-3 px-2">{comp.multiple}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Exit Scenarios */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Potential Exit Scenarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {result.exitScenarios.map((scenario, i) => (
                    <div key={i} className="p-4 rounded-lg bg-muted/50">
                      <h4 className="font-medium">{scenario.type}</h4>
                      <div className="text-xl font-bold my-2">{scenario.potentialValue}</div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{scenario.timeline}</span>
                        <Badge variant="outline">{scenario.likelihood}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Investor Perspective */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Investor Perspective</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{result.investorPerspective}</p>
              </CardContent>
            </Card>

            {/* Drivers & Risks */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-green-500">Valuation Drivers</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.valuationDrivers.map((driver, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {driver}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-red-500">Valuation Risks</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.valuationRisks.map((risk, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Recommendations */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Recommendations to Increase Valuation</CardTitle>
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
                Calculate Another Valuation
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

export default ValuationCalculator;
