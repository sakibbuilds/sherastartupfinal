import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Widgets
import { SuggestedFounders } from '@/components/dashboard/widgets/SuggestedFounders';
import { UniversityNetwork } from '@/components/dashboard/widgets/UniversityNetwork';
import { TrendingStartups } from '@/components/dashboard/widgets/TrendingStartups';
import { UniversityStartups } from '@/components/dashboard/widgets/UniversityStartups';
import { TrendingTopics } from '@/components/dashboard/widgets/TrendingTopics';
import { AdBanner } from '@/components/dashboard/widgets/AdBanner';
import { CreatePost } from '@/components/dashboard/widgets/CreatePost';
import { PostCard, Post } from '@/components/dashboard/PostCard';
import { toast } from '@/hooks/use-toast';

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPosts();
    if (user) {
      fetchUserLikes();
    }
  }, [user]);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching posts:', error);
    } else {
      // Fetch profiles and startup info separately
      const postsWithProfiles = await Promise.all(
        (data || []).map(async (post) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, title')
            .eq('user_id', post.user_id)
            .single();
          
          // Fetch startup if user is a founder
          const { data: startup } = await supabase
            .from('startups')
            .select('id, name')
            .eq('founder_id', post.user_id)
            .maybeSingle();
            
          return { ...post, profiles: profile, startup };
        })
      );
      setPosts(postsWithProfiles as Post[]);
    }
    setLoading(false);
  };

  const fetchUserLikes = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', user.id);

    if (data) {
      setLikedPosts(new Set(data.map(like => like.post_id)));
    }
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts([newPost, ...posts]);
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return;

    // Optimistic update
    const newLikedPosts = new Set(likedPosts);
    if (isLiked) {
      newLikedPosts.delete(postId);
    } else {
      newLikedPosts.add(postId);
    }
    setLikedPosts(newLikedPosts);

    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, likes_count: post.likes_count + (isLiked ? -1 : 1) }
        : post
    ));

    if (isLiked) {
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('post_likes')
        .insert({ post_id: postId, user_id: user.id });
    }
  };

  const handleDeletePost = async (postId: string) => {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete post', variant: 'destructive' });
    } else {
      setPosts(posts.filter(p => p.id !== postId));
      toast({ title: 'Deleted', description: 'Post has been removed.' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-20 lg:pb-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar */}
        <div className="hidden lg:block space-y-6">
          <SuggestedFounders />
          <UniversityNetwork />
        </div>

        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-4">
          <CreatePost onPostCreated={handlePostCreated} />

          <AnimatePresence>
            {posts.map((post, index) => (
              <div key={post.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <PostCard 
                    post={post}
                    currentUserId={user?.id}
                    onLike={handleLike}
                    onDelete={handleDeletePost}
                    isLiked={likedPosts.has(post.id)}
                  />
                </motion.div>

                {/* Mobile Widgets Injection */}
                <div className="lg:hidden">
                  {index === 1 && <SuggestedFounders displayMode="carousel" />}
                  {index === 3 && <AdBanner />}
                  {index === 4 && <TrendingStartups displayMode="carousel" />}
                  {index === 7 && <UniversityNetwork displayMode="carousel" />}
                  {index === 10 && <UniversityStartups displayMode="carousel" />}
                  {index === 13 && <TrendingTopics displayMode="carousel" />}
                </div>
              </div>
            ))}
          </AnimatePresence>

          {posts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No posts yet. Be the first to share!</p>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block space-y-6">
          <AdBanner />
          <TrendingTopics />
          <TrendingStartups />
          <UniversityStartups />
        </div>

      </div>
    </div>
  );
};

export default Feed;
