import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Play,
  MoreHorizontal,
} from "lucide-react";

interface PostCardProps {
  author: {
    name: string;
    university: string;
    avatar?: string;
    isOnline?: boolean;
  };
  content: {
    title: string;
    description: string;
    mediaUrl?: string;
    mediaType?: "image" | "video";
    tags?: string[];
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  timeAgo: string;
  className?: string;
}

export function PostCard({
  author,
  content,
  stats,
  timeAgo,
  className,
}: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(stats.likes);
  const [showHeart, setShowHeart] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  const handleDoubleTap = () => {
    if (!liked) {
      setLiked(true);
      setLikeCount((prev) => prev + 1);
    }
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
  };

  const initials = author.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "bg-card rounded-xl border border-border/50 overflow-hidden",
        "transition-all duration-300 hover:shadow-elevated",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            {author.avatar ? (
              <img
                src={author.avatar}
                alt={author.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold">
                {initials}
              </div>
            )}
            {author.isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-mint border-2 border-card" />
            )}
          </div>
          <div>
            <p className="font-semibold text-sm">{author.name}</p>
            <p className="text-xs text-muted-foreground">{author.university}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Media */}
      {content.mediaUrl && (
        <div
          className="relative aspect-video bg-secondary cursor-pointer"
          onDoubleClick={handleDoubleTap}
        >
          {content.mediaType === "video" ? (
            <>
              <img
                src={content.mediaUrl}
                alt={content.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-foreground/10">
                <div className="w-16 h-16 rounded-full bg-card/90 flex items-center justify-center backdrop-blur-sm">
                  <Play className="w-7 h-7 text-foreground ml-1" fill="currentColor" />
                </div>
              </div>
            </>
          ) : (
            <img
              src={content.mediaUrl}
              alt={content.title}
              className="w-full h-full object-cover"
            />
          )}

          {/* Double tap heart animation */}
          {showHeart && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Heart
                className="w-24 h-24 text-pink fill-pink animate-heart-beat"
                style={{ opacity: 0.9 }}
              />
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1">{content.title}</h3>
        <p className="text-muted-foreground text-sm line-clamp-2">
          {content.description}
        </p>
        {content.tags && content.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {content.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full bg-white/5 text-xs font-medium text-foreground hover:bg-mint/10 hover:text-mint cursor-pointer transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 pb-4">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={cn(
              "gap-1.5 text-muted-foreground hover:text-pink",
              liked && "text-pink"
            )}
          >
            <Heart
              className={cn("w-5 h-5", liked && "fill-pink")}
            />
            <span className="text-sm font-medium">{likeCount}</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-sky">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{stats.comments}</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-mint">
            <Share2 className="w-5 h-5" />
            <span className="text-sm font-medium">{stats.shares}</span>
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSaved(!saved)}
          className={cn(
            "text-muted-foreground hover:text-sky",
            saved && "text-sky"
          )}
        >
          <Bookmark className={cn("w-5 h-5", saved && "fill-sky")} />
        </Button>
      </div>
    </div>
  );
}
