import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  TrendingUp,
  Sparkles,
  Lock,
  Check
} from 'lucide-react';

const features = [
  'AI investor simulations',
  'Pitch practice sessions',
  'Valuation negotiation',
  'Term sheet analysis',
  'Due diligence prep',
  'Investor Q&A training',
  'Feedback & scoring',
  'Performance tracking'
];

const InvestmentSimulation = () => {
  const navigate = useNavigate();

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

      <Card className="glass-card">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto p-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 w-fit mb-4">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
          <Badge variant="secondary" className="mx-auto w-fit gap-1 mb-4">
            <Sparkles className="h-3 w-3" />
            Premium Feature
          </Badge>
          <CardTitle className="text-2xl">Investment Simulation</CardTitle>
          <CardDescription className="text-base max-w-md mx-auto">
            Practice investment pitches and negotiations with AI investors. Get feedback on your valuation and terms.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="bg-muted/50 rounded-xl p-6 text-center">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Unlock Premium Access</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upgrade to access Investment Simulation and all premium tools.
            </p>
            <Button className="gap-2">
              <Sparkles className="h-4 w-4" />
              Upgrade to Premium
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvestmentSimulation;