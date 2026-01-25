import { forwardRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, GraduationCap, Globe, Award } from 'lucide-react';

export const StudyAbroadAdBanner = forwardRef<HTMLDivElement>((_, ref) => {
  // Demo ad data for IELTS/Study Abroad
  const demoAd = {
    title: 'Study Abroad with Confidence',
    subtitle: 'IELTS Preparation',
    description: 'Get Band 7+ with our expert coaching. 95% success rate. Join 10,000+ successful students.',
    imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop',
    ctaText: 'Start Free Trial',
    ctaUrl: '#',
    features: ['Expert Tutors', 'Mock Tests', 'Visa Support'],
  };

  return (
    <Card ref={ref} className="overflow-hidden glass-card border-border/50 bg-gradient-to-br from-blue-500/5 to-emerald-500/5">
      <div className="relative">
        <img
          src={demoAd.imageUrl}
          alt={demoAd.title}
          className="w-full h-28 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
        <Badge 
          variant="secondary" 
          className="absolute top-2 right-2 text-[10px] bg-background/80 backdrop-blur-sm"
        >
          Sponsored
        </Badge>
        <div className="absolute bottom-2 left-3 right-3">
          <div className="flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary">{demoAd.subtitle}</span>
          </div>
        </div>
      </div>
      <CardContent className="p-3 space-y-2.5">
        <h4 className="font-semibold text-sm text-foreground leading-tight">{demoAd.title}</h4>
        <p className="text-xs text-muted-foreground line-clamp-2">{demoAd.description}</p>
        
        <div className="flex flex-wrap gap-1.5">
          {demoAd.features.map((feature, index) => (
            <span 
              key={index}
              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary"
            >
              {index === 0 && <Award className="h-2.5 w-2.5" />}
              {index === 2 && <Globe className="h-2.5 w-2.5" />}
              {feature}
            </span>
          ))}
        </div>

        <a
          href={demoAd.ctaUrl}
          className="inline-flex items-center justify-center gap-1.5 w-full text-xs font-medium py-2 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {demoAd.ctaText}
          <ExternalLink className="h-3 w-3" />
        </a>
      </CardContent>
    </Card>
  );
});

StudyAbroadAdBanner.displayName = 'StudyAbroadAdBanner';
