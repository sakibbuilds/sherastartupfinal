import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Sparkles, Loader2, ArrowLeft, Globe, Users, TrendingUp, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface MarketSizingResult {
  tam: {
    value: string;
    description: string;
    methodology: string;
  };
  sam: {
    value: string;
    description: string;
    methodology: string;
  };
  som: {
    value: string;
    description: string;
    methodology: string;
    timeframe: string;
  };
  marketGrowthRate: string;
  keyDrivers: string[];
  assumptions: string[];
  dataSources: string[];
  competitiveLandscape: string;
  entryStrategy: string;
  riskFactors: string[];
}

const MarketSizing = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    industry: '',
    productDescription: '',
    targetGeography: '',
    targetSegment: '',
    pricingModel: '',
    averagePrice: '',
    competitors: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MarketSizingResult | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculate = async () => {
    if (!formData.industry || !formData.productDescription || !formData.targetGeography) {
      toast.error('Please fill in the required fields');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('startup-tools-ai', {
        body: { toolType: 'market-sizing', data: formData }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResult(data.result);
      toast.success('Market sizing analysis complete!');
    } catch (error) {
      console.error('Error calculating market size:', error);
      toast.error('Failed to calculate market size. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const geographies = [
    'Global',
    'North America',
    'United States',
    'Europe',
    'Asia Pacific',
    'South Asia',
    'Bangladesh',
    'India',
    'Middle East',
    'Latin America',
    'Africa'
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
        <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-rose-500">
          <Target className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            AI Market Sizing Calculator
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              AI Powered
            </Badge>
          </h1>
          <p className="text-muted-foreground">Calculate TAM, SAM, and SOM for your target market</p>
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
                <CardTitle>Define Your Market</CardTitle>
                <CardDescription>
                  Provide details about your product and target market for accurate sizing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry *</Label>
                    <Input
                      id="industry"
                      placeholder="e.g., EdTech, FinTech, HealthTech"
                      value={formData.industry}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetGeography">Target Geography *</Label>
                    <Select
                      value={formData.targetGeography}
                      onValueChange={(value) => handleInputChange('targetGeography', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select geography" />
                      </SelectTrigger>
                      <SelectContent>
                        {geographies.map(geo => (
                          <SelectItem key={geo} value={geo}>{geo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productDescription">Product/Service Description *</Label>
                  <Textarea
                    id="productDescription"
                    placeholder="Describe your product or service in detail..."
                    value={formData.productDescription}
                    onChange={(e) => handleInputChange('productDescription', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="targetSegment">Target Customer Segment</Label>
                    <Input
                      id="targetSegment"
                      placeholder="e.g., SMBs, Enterprise, Consumers"
                      value={formData.targetSegment}
                      onChange={(e) => handleInputChange('targetSegment', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pricingModel">Pricing Model</Label>
                    <Input
                      id="pricingModel"
                      placeholder="e.g., Subscription, Per-transaction"
                      value={formData.pricingModel}
                      onChange={(e) => handleInputChange('pricingModel', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="averagePrice">Average Price Point</Label>
                    <Input
                      id="averagePrice"
                      placeholder="e.g., $50/month, $500/year"
                      value={formData.averagePrice}
                      onChange={(e) => handleInputChange('averagePrice', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="competitors">Key Competitors</Label>
                    <Input
                      id="competitors"
                      placeholder="e.g., Competitor A, Competitor B"
                      value={formData.competitors}
                      onChange={(e) => handleInputChange('competitors', e.target.value)}
                    />
                  </div>
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
                      Calculating Market Size...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Calculate Market Size
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
            {/* TAM, SAM, SOM Cards */}
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { key: 'tam', label: 'Total Addressable Market', icon: Globe, color: 'from-blue-500 to-cyan-500', data: result.tam },
                { key: 'sam', label: 'Serviceable Addressable Market', icon: Users, color: 'from-purple-500 to-pink-500', data: result.sam },
                { key: 'som', label: 'Serviceable Obtainable Market', icon: Target, color: 'from-green-500 to-emerald-500', data: result.som }
              ].map(({ key, label, icon: Icon, color, data }) => (
                <Card key={key} className="glass-card overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${color}`} />
                  <CardHeader className="pb-2">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-2`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{key.toUpperCase()}</CardTitle>
                    <CardDescription>{label}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{data.value}</div>
                    <p className="text-sm text-muted-foreground mb-3">{data.description}</p>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground font-medium mb-1">Methodology</p>
                      <p className="text-sm">{data.methodology}</p>
                    </div>
                    {key === 'som' && result.som.timeframe && (
                      <Badge variant="outline" className="mt-3">{result.som.timeframe}</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Market Growth */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Market Growth Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-4">{result.marketGrowthRate}</div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Key Drivers</h4>
                    <ul className="space-y-2">
                      {result.keyDrivers.map((driver, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{driver}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Risk Factors</h4>
                    <ul className="space-y-2">
                      {result.riskFactors.map((risk, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Competitive Landscape & Entry Strategy */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Competitive Landscape</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{result.competitiveLandscape}</p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Recommended Entry Strategy</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{result.entryStrategy}</p>
                </CardContent>
              </Card>
            </div>

            {/* Assumptions & Data Sources */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Analysis Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Key Assumptions</h4>
                    <ul className="space-y-1">
                      {result.assumptions.map((assumption, i) => (
                        <li key={i} className="text-sm text-muted-foreground">• {assumption}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Data Sources</h4>
                    <ul className="space-y-1">
                      {result.dataSources.map((source, i) => (
                        <li key={i} className="text-sm text-muted-foreground">• {source}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button variant="outline" className="flex-1" onClick={() => setResult(null)}>
                Calculate Another Market
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

export default MarketSizing;
