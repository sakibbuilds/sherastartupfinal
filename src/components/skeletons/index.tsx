import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Post Card Skeleton
export const PostCardSkeleton = () => (
  <Card className="glass-card overflow-hidden">
    <CardContent className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <Skeleton className="h-48 w-full rounded-lg" />
      <div className="flex gap-4">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </CardContent>
  </Card>
);

// User Card Skeleton (for founders, mentors, etc.)
export const UserCardSkeleton = () => (
  <Card className="glass-card overflow-hidden">
    <CardContent className="p-4">
      <div className="flex items-start gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-24" />
          <div className="flex gap-2 mt-3">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 flex-1 rounded-lg" />
      </div>
    </CardContent>
  </Card>
);

// Startup Card Skeleton
export const StartupCardSkeleton = () => (
  <Card className="glass-card overflow-hidden">
    <CardContent className="p-4">
      <div className="flex items-start gap-4">
        <Skeleton className="h-14 w-14 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Pitch Card Skeleton (vertical video style)
export const PitchCardSkeleton = () => (
  <div className="w-full aspect-[9/16] bg-muted rounded-xl overflow-hidden relative">
    <Skeleton className="absolute inset-0" />
    <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  </div>
);

// Message Skeleton
export const MessageSkeleton = () => (
  <div className="flex gap-3 p-3">
    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-16 w-3/4 rounded-lg" />
    </div>
  </div>
);

// Conversation List Skeleton
export const ConversationSkeleton = () => (
  <div className="flex items-center gap-3 p-3 rounded-lg">
    <Skeleton className="h-12 w-12 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-3 w-40" />
    </div>
    <Skeleton className="h-3 w-12" />
  </div>
);

// Sidebar Widget Skeleton
export const WidgetSkeleton = () => (
  <Card className="glass-card">
    <CardHeader className="pb-3">
      <Skeleton className="h-5 w-32" />
    </CardHeader>
    <CardContent className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

// Profile Page Skeleton
export const ProfileSkeleton = () => (
  <div className="space-y-6">
    {/* Cover & Avatar */}
    <Card className="glass-card overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <CardContent className="px-8 pb-8 pt-0 relative">
        <div className="-mt-16 mb-4 flex justify-between items-end">
          <Skeleton className="h-32 w-32 rounded-full border-4 border-background" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-28 rounded-full" />
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
    
    {/* Stats */}
    <div className="grid grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="glass-card p-4">
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-4 w-20" />
        </Card>
      ))}
    </div>
  </div>
);

// Table Row Skeleton
export const TableRowSkeleton = () => (
  <div className="flex items-center gap-4 p-4 border-b border-border">
    <Skeleton className="h-10 w-10 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-24" />
    </div>
    <Skeleton className="h-6 w-20 rounded-full" />
    <Skeleton className="h-8 w-24 rounded-lg" />
  </div>
);

// Feed Skeleton (combines multiple post skeletons)
export const FeedSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <PostCardSkeleton key={i} />
    ))}
  </div>
);

// Grid Skeleton (for startup/founder grids)
export const GridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <UserCardSkeleton key={i} />
    ))}
  </div>
);
