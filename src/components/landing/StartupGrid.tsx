import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronUp, ExternalLink, Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Startup {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  industry: string | null;
  website: string | null;
  stage: string | null;
  verified: boolean | null;
  founder_id: string;
  created_at: string;
  founder?: {
    full_name: string;
    university: string | null;
  };
}

// Country flags based on mock data (you can enhance this later)
const countryFlags: Record<string, string> = {
  "USA": "🇺🇸",
  "UK": "🇬🇧", 
  "India": "🇮🇳",
  "Germany": "🇩🇪",
  "Canada": "🇨🇦",
  "Australia": "🇦🇺",
  "France": "🇫🇷",
  "Japan": "🇯🇵",
};

export function StartupGrid() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchStartups();
  }, []);

  const fetchStartups = async () => {
    try {
      // First get startups
      const { data: startupsData, error } = await supabase
        .from("startups")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Then get founder profiles
      const founderIds = startupsData?.map(s => s.founder_id).filter(Boolean) || [];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, university")
        .in("user_id", founderIds);

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

      const transformedData = startupsData?.map(startup => ({
        ...startup,
        founder: profilesMap.get(startup.founder_id) as { full_name: string; university: string | null } | undefined
      })) || [];

      setStartups(transformedData);
      
      // Initialize random votes for demo
      const initialVotes: Record<string, number> = {};
      transformedData.forEach(s => {
        initialVotes[s.id] = Math.floor(Math.random() * 150) + 10;
      });
      setVotes(initialVotes);
    } catch (error) {
      console.error("Error fetching startups:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = (startupId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setVotes(prev => ({
      ...prev,
      [startupId]: (prev[startupId] || 0) + 1
    }));
  };

  if (loading) {
    return (
      <section className="py-6 bg-background">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg border border-border p-4">
                <Skeleton className="w-full aspect-video rounded-lg mb-3" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (startups.length === 0) {
    return (
      <section className="py-12 bg-background">
        <div className="container px-4 md:px-6 text-center">
          <p className="text-muted-foreground">No startups found yet. Be the first to submit!</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 bg-background">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {startups.map((startup) => {
            const randomCountry = Object.keys(countryFlags)[Math.floor(Math.random() * Object.keys(countryFlags).length)];
            
            return (
              <Link
                key={startup.id}
                to={`/dashboard/startups/${startup.id}`}
                className="group bg-card rounded-lg border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {/* Screenshot/Preview */}
                <div className="aspect-video bg-secondary relative overflow-hidden">
                  {startup.logo_url ? (
                    <img 
                      src={startup.logo_url} 
                      alt={startup.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-muted">
                      <span className="text-4xl font-bold text-muted-foreground/30">
                        {startup.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  
                  {/* External link indicator */}
                  {startup.website && (
                    <div className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                    {startup.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3 min-h-[2.5rem]">
                    {startup.tagline || startup.description || "No description available"}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium truncate max-w-[100px]">
                        {startup.founder?.full_name || "Anonymous"}
                      </span>
                      <span>{countryFlags[randomCountry]}</span>
                    </div>

                    {/* Vote Button */}
                    <button
                      onClick={(e) => handleVote(startup.id, e)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors text-xs font-medium"
                    >
                      <ChevronUp className="w-3 h-3" />
                      {votes[startup.id] || 0}
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
