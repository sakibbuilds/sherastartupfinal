import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon, Loader2, User, MessageSquare } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  title: string | null;
  university: string | null;
}

const Search = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuery(q);
    if (q) {
      performSearch(q);
    } else {
      setResults([]);
    }
  }, [q]);

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', `%${searchTerm}%`)
        .limit(20);

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
      toast({ title: 'Error', description: 'Failed to search profiles', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: query });
  };

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground">Find people and connections.</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search people..."
            className="pl-9 bg-white/5 border-white/10 focus:border-primary"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4">
          {results.length > 0 ? (
            results.map((profile) => (
              <Card 
                key={profile.id} 
                className="glass-card cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => navigate(`/dashboard/profile/${profile.user_id}`)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={profile.avatar_url || ''} />
                      <AvatarFallback>{profile.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{profile.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{profile.title || 'Member'}</p>
                      {profile.university && (
                        <p className="text-xs text-muted-foreground mt-1">{profile.university}</p>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/dashboard/messages?user=${profile.user_id}`);
                  }}>
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : q ? (
            <div className="text-center py-8 text-muted-foreground">
              No results found for "{q}"
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Enter a name to search
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
