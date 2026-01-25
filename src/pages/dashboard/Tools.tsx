import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  PresentationIcon, 
  Building2, 
  TrendingUp,
  Sparkles,
  Lock,
  ArrowRight,
  Lightbulb,
  Target,
  BarChart3,
  Calculator
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  path: string;
  isPremium: boolean;
  comingSoon?: boolean;
  gradient: string;
}

const tools: Tool[] = [
  {
    id: 'elevator-pitch',
    name: 'Elevator Pitch Builder',
    description: 'Craft a compelling 60-second pitch that captures attention and communicates your value proposition effectively.',
    icon: Mic,
    path: '/dashboard/tools/elevator-pitch',
    isPremium: false,
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'pitch-deck',
    name: 'Pitch Deck Creator',
    description: 'Build professional investor-ready pitch decks with AI-powered suggestions and proven templates.',
    icon: PresentationIcon,
    path: '/dashboard/tools/pitch-deck',
    isPremium: true,
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    id: 'biz-simulation',
    name: 'Business Simulation',
    description: 'Test your business strategies in a risk-free environment. Simulate market conditions and customer behavior.',
    icon: Building2,
    path: '/dashboard/tools/biz-simulation',
    isPremium: true,
    gradient: 'from-orange-500 to-amber-500'
  },
  {
    id: 'investment-simulation',
    name: 'Investment Simulation',
    description: 'Practice investment pitches and negotiations with AI investors. Get feedback on your valuation and terms.',
    icon: TrendingUp,
    path: '/dashboard/tools/investment-simulation',
    isPremium: true,
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    id: 'idea-validator',
    name: 'Idea Validator',
    description: 'Validate your startup idea with market research, competitor analysis, and viability scoring.',
    icon: Lightbulb,
    path: '/dashboard/tools/idea-validator',
    isPremium: false,
    comingSoon: true,
    gradient: 'from-yellow-500 to-orange-500'
  },
  {
    id: 'market-sizing',
    name: 'Market Sizing Calculator',
    description: 'Calculate TAM, SAM, and SOM for your target market with data-driven insights.',
    icon: Target,
    path: '/dashboard/tools/market-sizing',
    isPremium: true,
    comingSoon: true,
    gradient: 'from-red-500 to-rose-500'
  },
  {
    id: 'financial-projections',
    name: 'Financial Projections',
    description: 'Create 3-5 year financial projections with revenue models, burn rate analysis, and runway calculations.',
    icon: BarChart3,
    path: '/dashboard/tools/financial-projections',
    isPremium: true,
    comingSoon: true,
    gradient: 'from-indigo-500 to-violet-500'
  },
  {
    id: 'valuation-calculator',
    name: 'Valuation Calculator',
    description: 'Estimate your startup valuation using multiple methodologies including DCF, comparables, and VC method.',
    icon: Calculator,
    path: '/dashboard/tools/valuation-calculator',
    isPremium: true,
    comingSoon: true,
    gradient: 'from-teal-500 to-cyan-500'
  }
];

const Tools = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-20 lg:pb-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Startup Tools</h1>
        <p className="text-muted-foreground">
          Essential tools to help you build, validate, and grow your startup
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool, index) => (
          <motion.div
            key={tool.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={cn(
              "glass-card h-full transition-all duration-300",
              !tool.comingSoon && "hover:-translate-y-1 cursor-pointer hover:border-primary/30"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={cn(
                    "p-3 rounded-xl bg-gradient-to-br",
                    tool.gradient
                  )}>
                    <tool.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex gap-2">
                    {tool.isPremium && (
                      <Badge variant="secondary" className="gap-1">
                        <Sparkles className="h-3 w-3" />
                        Premium
                      </Badge>
                    )}
                    {tool.comingSoon && (
                      <Badge variant="outline">Coming Soon</Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg mt-4">{tool.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {tool.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full gap-2"
                  variant={tool.comingSoon ? "outline" : "default"}
                  disabled={tool.comingSoon}
                  onClick={() => !tool.comingSoon && navigate(tool.path)}
                >
                  {tool.comingSoon ? (
                    <>
                      <Lock className="h-4 w-4" />
                      Coming Soon
                    </>
                  ) : (
                    <>
                      Launch Tool
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Tools;