import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Hash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TrendingTopicsProps {
  displayMode?: 'list' | 'carousel';
}

export const TrendingTopics = ({ displayMode = 'list' }: TrendingTopicsProps) => {
  const [topics, setTopics] = useState<{name: string, count: number}[]>([]);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    // Ideally we would aggregate hashtags or categories.
    // For now, let's just get distinct categories from posts
    // Note: Supabase doesn't support complex aggregation easily via JS client without RPC or views for this specific case efficiently.
    // So we'll just fetch recent posts and count client side for a small dataset, or use hardcoded defaults if empty.
    
    const { data } = await supabase
      .from('posts')
      .select('category')
      .not('category', 'is', null)
      .limit(100);

    if (data && data.length > 0) {
      const counts: Record<string, number> = {};
      data.forEach((p: any) => {
        if (p.category) {
          counts[p.category] = (counts[p.category] || 0) + 1;
        }
      });
      
      const sorted = Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
        
      setTopics(sorted);
    } else {
      // Fallback defaults
      setTopics([
        { name: 'SaaS', count: 120 },
        { name: 'AI', count: 95 },
        { name: 'Fundraising', count: 80 },
        { name: 'Marketing', count: 65 },
        { name: 'Product', count: 40 },
      ]);
    }
  };

  if (displayMode === 'carousel') {
    return (
      <div className="mb-4">
        <h3 className="font-semibold text-sm mb-2 px-1 flex items-center gap-2">
          <Hash className="h-4 w-4" /> Trending Topics
        </h3>
        <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4 scrollbar-hide">
          {topics.map((topic) => (
            <Badge key={topic.name} variant="secondary" className="whitespace-nowrap cursor-pointer hover:bg-secondary/80 py-2 px-3">
              #{topic.name}
            </Badge>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Hash className="h-4 w-4" />
          Trending Topics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {topics.map((topic) => (
            <Badge key={topic.name} variant="secondary" className="cursor-pointer hover:bg-secondary/80">
              #{topic.name}
              {/* <span className="ml-1 text-[10px] opacity-60">{topic.count}</span> */}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
