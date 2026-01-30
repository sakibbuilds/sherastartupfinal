import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X, User, Building2, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchResult {
  type: 'user' | 'startup' | 'post';
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
}

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
  variant?: 'default' | 'compact';
}

export const GlobalSearch = ({ className, placeholder = "Search users, startups, posts...", variant = 'default' }: GlobalSearchProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const debounce = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      const searchTerm = `%${query.toLowerCase()}%`;

      try {
        // Search users
        const { data: users } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url, title')
          .or(`full_name.ilike.${searchTerm},title.ilike.${searchTerm}`)
          .limit(5);

        // Search startups
        const { data: startups } = await supabase
          .from('startups')
          .select('id, name, tagline, logo_url, industry')
          .or(`name.ilike.${searchTerm},tagline.ilike.${searchTerm},industry.ilike.${searchTerm}`)
          .limit(5);

        // Search posts
        const { data: posts } = await supabase
          .from('posts')
          .select('id, content, category')
          .ilike('content', searchTerm)
          .limit(5);

        const allResults: SearchResult[] = [
          ...(users || []).map(u => ({
            type: 'user' as const,
            id: u.user_id,
            title: u.full_name || 'Unknown User',
            subtitle: u.title || 'Member',
            image: u.avatar_url
          })),
          ...(startups || []).map(s => ({
            type: 'startup' as const,
            id: s.id,
            title: s.name,
            subtitle: s.industry || s.tagline || 'Startup',
            image: s.logo_url
          })),
          ...(posts || []).map(p => ({
            type: 'post' as const,
            id: p.id,
            title: p.content.slice(0, 60) + (p.content.length > 60 ? '...' : ''),
            subtitle: p.category || 'Post'
          }))
        ];

        setResults(allResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  const handleResultClick = (result: SearchResult) => {
    setQuery('');
    setIsOpen(false);
    switch (result.type) {
      case 'user':
        navigate(`/dashboard/profile/${result.id}`);
        break;
      case 'startup':
        navigate(`/dashboard/startups/${result.id}`);
        break;
      case 'post':
        navigate(`/dashboard/post/${result.id}`);
        break;
    }
  };

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'user': return <User className="h-4 w-4" />;
      case 'startup': return <Building2 className="h-4 w-4" />;
      case 'post': return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'user': return 'bg-primary/10 text-primary';
      case 'startup': return 'bg-teal/10 text-teal';
      case 'post': return 'bg-pink/10 text-pink';
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className={cn(
            "pl-10 pr-10 bg-white/5 border-white/10 focus:border-primary",
            variant === 'compact' ? "h-9 text-sm" : "h-10"
          )}
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (query.length >= 2 || results.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-popover/95 backdrop-blur-xl border border-border rounded-xl shadow-xl z-50 overflow-hidden"
          >
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : results.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                {query.length >= 2 ? 'No results found' : 'Type to search...'}
              </div>
            ) : (
              <ScrollArea className="max-h-[400px]">
                <div className="p-2">
                  {results.map((result, index) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left"
                    >
                      {result.image ? (
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={result.image} />
                          <AvatarFallback>{result.title.charAt(0)}</AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", getTypeColor(result.type))}>
                          {getIcon(result.type)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{result.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                      </div>
                      <Badge variant="secondary" className={cn("text-xs capitalize", getTypeColor(result.type))}>
                        {result.type}
                      </Badge>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
