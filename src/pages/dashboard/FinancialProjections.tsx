import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Sparkles, Loader2, ArrowLeft, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface YearlyProjection {
  year: number;
  revenue: number;
  expenses: number;
  grossProfit: number;
  netProfit: number;
  customers: number;
  employees: number;
}

interface FinancialResult {
  summary: string;
  projections: YearlyProjection[];
  keyMetrics: {
    cagr: string;
    breakEvenMonth: string;
    burnRate: string;
    runway: string;
    ltv: string;
    cac: string;
    ltvCacRatio: string;
  };
  revenueDrivers: string[];
  costDrivers: string[];
  assumptions: string[];
  risks: string[];
  recommendations: string[];
  scenarioAnalysis: {
    optimistic: { year3Revenue: string; description: string };
    base: { year3Revenue: string; description: string };
    pessimistic: { year3Revenue: string; description: string };
  };
}

const FinancialProjections = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    businessModel: '',
    currentMRR: '',
    monthlyGrowthRate: '',
    averageRevenue: '',
    customerAcquisitionCost: '',
    monthlyChurnRate: '',
    grossMargin: '',
    monthlyFixedCosts: '',
    currentHeadcount: '',
    fundingRaised: ''
  });
  const [projectionYears, setProjectionYears] = useState('3');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FinancialResult | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculate = async () => {
    if (!formData.businessModel || !formData.currentMRR || !formData.monthlyGrowthRate) {
      toast.error('Please fill in the required fields');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('startup-tools-ai', {
        body: { 
          toolType: 'financial-projections', 
          data: { ...formData, projectionYears: parseInt(projectionYears) } 
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResult(data.result);
      toast.success('Financial projections generated!');
    } catch (error) {
      console.error('Error generating projections:', error);
      toast.error('Failed to generate projections. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  const businessModels = [
    'SaaS (Subscription)',
    'Marketplace',
    'E-commerce',
    'Freemium',
    'Transaction-based',
    'Advertising',
    'Licensing',
    'Services'
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-20 lg:pb-6">
      <Button
        variant="ghost"
        className="mb-4 gap-2"
        onClick={() => navigate('/dashboard/tools')}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tools
      </Button>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500">
          <BarChart3 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            AI Financial Projections
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              AI Powered
            </Badge>
          </h1>
          <p className="text-muted-foreground">Create 3-5 year financial projections with AI analysis</p>
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
                <CardTitle>Enter Your Financial Data</CardTitle>
                <CardDescription>
                  Provide your current metrics to generate realistic projections
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="businessModel">Business Model *</Label>
                    <Select
                      value={formData.businessModel}
                      onValueChange={(value) => handleInputChange('businessModel', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessModels.map(model => (
                          <SelectItem key={model} value={model}>{model}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentMRR">Current MRR ($) *</Label>
                    <Input
                      id="currentMRR"
                      type="number"
                      placeholder="e.g., 10000"
                      value={formData.currentMRR}
                      onChange={(e) => handleInputChange('currentMRR', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyGrowthRate">Monthly Growth Rate (%) *</Label>
                    <Input
                      id="monthlyGrowthRate"
                      type="number"
                      placeholder="e.g., 15"
                      value={formData.monthlyGrowthRate}
                      onChange={(e) => handleInputChange('monthlyGrowthRate', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="averageRevenue">Avg Revenue per Customer ($)</Label>
                    <Input
                      id="averageRevenue"
                      type="number"
                      placeholder="e.g., 100"
                      value={formData.averageRevenue}
                      onChange={(e) => handleInputChange('averageRevenue', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerAcquisitionCost">Customer Acquisition Cost ($)</Label>
                    <Input
                      id="customerAcquisitionCost"
                      type="number"
                      placeholder="e.g., 250"
                      value={formData.customerAcquisitionCost}
                      onChange={(e) => handleInputChange('customerAcquisitionCost', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyChurnRate">Monthly Churn Rate (%)</Label>
                    <Input
                      id="monthlyChurnRate"
                      type="number"
                      placeholder="e.g., 5"
                      value={formData.monthlyChurnRate}
                      onChange={(e) => handleInputChange('monthlyChurnRate', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="monthlyFixedCosts">Monthly Fixed Costs ($)</Label>
                    <Input
                      id="monthlyFixedCosts"
                      type="number"
                      placeholder="e.g., 20000"
                      value={formData.monthlyFixedCosts}
                      onChange={(e) => handleInputChange('monthlyFixedCosts', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentHeadcount">Current Headcount</Label>
                    <Input
                      id="currentHeadcount"
                      type="number"
                      placeholder="e.g., 5"
                      value={formData.currentHeadcount}
                      onChange={(e) => handleInputChange('currentHeadcount', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fundingRaised">Funding Raised ($)</Label>
                    <Input
                      id="fundingRaised"
                      type="number"
                      placeholder="e.g., 500000"
                      value={formData.fundingRaised}
                      onChange={(e) => handleInputChange('fundingRaised', e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Label>Projection Period:</Label>
                  <Select value={projectionYears} onValueChange={setProjectionYears}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Years</SelectItem>
                      <SelectItem value="5">5 Years</SelectItem>
                    </SelectContent>
                  </Select>
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
                      Generating Projections...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Financial Projections
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
            {/* Summary */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Executive Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{result.summary}</p>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
                  {[
                    { label: 'CAGR', value: result.keyMetrics.cagr, icon: TrendingUp },
                    { label: 'Break-even', value: result.keyMetrics.breakEvenMonth, icon: Calendar },
                    { label: 'Burn Rate', value: result.keyMetrics.burnRate, icon: TrendingDown },
                    { label: 'Runway', value: result.keyMetrics.runway, icon: Calendar },
                    { label: 'LTV', value: result.keyMetrics.ltv, icon: DollarSign },
                    { label: 'CAC', value: result.keyMetrics.cac, icon: DollarSign },
                    { label: 'LTV:CAC', value: result.keyMetrics.ltvCacRatio, icon: BarChart3 }
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="text-center p-3 rounded-lg bg-muted/50">
                      <Icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <div className="font-bold text-sm">{value}</div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Yearly Projections Table */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Yearly Projections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2">Year</th>
                        <th className="text-right py-3 px-2">Revenue</th>
                        <th className="text-right py-3 px-2">Expenses</th>
                        <th className="text-right py-3 px-2">Gross Profit</th>
                        <th className="text-right py-3 px-2">Net Profit</th>
                        <th className="text-right py-3 px-2">Customers</th>
                        <th className="text-right py-3 px-2">Team</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.projections.map((proj) => (
                        <tr key={proj.year} className="border-b">
                          <td className="py-3 px-2 font-medium">Year {proj.year}</td>
                          <td className="text-right py-3 px-2">{formatCurrency(proj.revenue)}</td>
                          <td className="text-right py-3 px-2">{formatCurrency(proj.expenses)}</td>
                          <td className="text-right py-3 px-2">{formatCurrency(proj.grossProfit)}</td>
                          <td className={`text-right py-3 px-2 ${proj.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {formatCurrency(proj.netProfit)}
                          </td>
                          <td className="text-right py-3 px-2">{proj.customers.toLocaleString()}</td>
                          <td className="text-right py-3 px-2">{proj.employees}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Scenario Analysis */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Scenario Analysis (Year 3)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { scenario: 'Optimistic', data: result.scenarioAnalysis.optimistic, color: 'text-green-500', bg: 'bg-green-500/10' },
                    { scenario: 'Base', data: result.scenarioAnalysis.base, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { scenario: 'Pessimistic', data: result.scenarioAnalysis.pessimistic, color: 'text-red-500', bg: 'bg-red-500/10' }
                  ].map(({ scenario, data, color, bg }) => (
                    <div key={scenario} className={`p-4 rounded-lg ${bg}`}>
                      <h4 className={`font-medium ${color}`}>{scenario}</h4>
                      <div className={`text-2xl font-bold ${color} my-2`}>{data.year3Revenue}</div>
                      <p className="text-sm text-muted-foreground">{data.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Drivers & Risks */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Revenue Drivers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.revenueDrivers.map((driver, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {driver}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                    Cost Drivers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.costDrivers.map((driver, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <TrendingDown className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        {driver}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

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
                Create New Projection
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

export default FinancialProjections;
