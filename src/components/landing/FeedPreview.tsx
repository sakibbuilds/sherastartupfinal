import { PostCard } from "@/components/common/PostCard";
import { UserCard } from "@/components/common/UserCard";

const mockPosts = [
  {
    author: {
      name: "Alex Rivera",
      university: "Stanford University",
      isOnline: true,
    },
    content: {
      title: "EcoTrack - Sustainable Supply Chain Analytics",
      description: "Using AI to help companies reduce their carbon footprint by 40%. Looking for investors who share our vision for a sustainable future.",
      mediaUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
      mediaType: "image" as const,
      tags: ["CleanTech", "AI", "SeedStage"],
    },
    stats: { likes: 234, comments: 45, shares: 12 },
    timeAgo: "2h ago",
  },
  {
    author: {
      name: "Maya Patel",
      university: "MIT",
      isOnline: false,
    },
    content: {
      title: "NeuroLearn - Personalized Education Platform",
      description: "Adaptive learning that understands how each student thinks. Already helping 10,000+ students improve their grades.",
      mediaUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
      mediaType: "video" as const,
      tags: ["EdTech", "AI", "SeriesA"],
    },
    stats: { likes: 567, comments: 89, shares: 34 },
    timeAgo: "5h ago",
  },
];

const mockUsers = [
  {
    name: "Jennifer Wu",
    university: "Harvard Business School",
    role: "investor" as const,
    isOnline: true,
    compatibilityScore: 92,
  },
  {
    name: "David Kim",
    university: "Y Combinator",
    role: "mentor" as const,
    isOnline: true,
    compatibilityScore: 88,
  },
  {
    name: "Sarah Johnson",
    university: "UC Berkeley",
    role: "founder" as const,
    isOnline: false,
    compatibilityScore: 85,
  },
];

export function FeedPreview() {
  return (
    <section className="py-24 md:py-32 bg-secondary/30">
      <div className="container px-4 md:px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            See what's <span className="text-gradient">happening</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            A live preview of the CampusLaunch ecosystem
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Feed Column */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Spark Feed
            </h3>
            {mockPosts.map((post, i) => (
              <div
                key={i}
                className="animate-fade-in-up"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <PostCard {...post} />
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Suggested Connections
            </h3>
            {mockUsers.map((user, i) => (
              <div
                key={i}
                className="animate-slide-in-right"
                style={{ animationDelay: `${i * 0.1 + 0.3}s` }}
              >
                <UserCard {...user} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
