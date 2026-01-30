import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

// Widgets
import { SuggestedFounders } from '@/components/dashboard/widgets/SuggestedFounders';
import { UniversityNetwork } from '@/components/dashboard/widgets/UniversityNetwork';
import { LeftSideAdBanner } from '@/components/dashboard/widgets/LeftSideAdBanner';
import { TrendingStartups } from '@/components/dashboard/widgets/TrendingStartups';
import { StudyAbroadAdBanner } from '@/components/dashboard/widgets/StudyAbroadAdBanner';
import { UniversityStartups } from '@/components/dashboard/widgets/UniversityStartups';
import { TrendingTopics } from '@/components/dashboard/widgets/TrendingTopics';
import { AdBanner } from '@/components/dashboard/widgets/AdBanner';
import { CreatePost } from '@/components/dashboard/widgets/CreatePost';
import { PostCard, Post } from '@/components/dashboard/PostCard';
import { toast } from '@/hooks/use-toast';
import { FeedSkeleton, WidgetSkeleton } from '@/components/skeletons';

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
      .select('*, post_likes(count), comments(count)')
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
            .select('full_name, avatar_url, title, verified, is_mentor')
            .eq('user_id', post.user_id)
            .single();
          
          // Fetch startup if user is a founder
          const { data: startup } = await supabase
            .from('startups')
            .select('id, name')
            .eq('founder_id', post.user_id)
            .maybeSingle();
            
          const commentsCount = post.comments && post.comments[0] ? post.comments[0].count : 0;
          const likesCount = post.post_likes && post.post_likes[0] ? post.post_likes[0].count : 0;

          return { ...post, comments_count: commentsCount, likes_count: likesCount, profiles: profile, startup };
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

    const post = posts.find(p => p.id === postId);

    setPosts(posts.map(p => 
      p.id === postId 
        ? { ...p, likes_count: p.likes_count + (isLiked ? -1 : 1) }
        : p
    ));

    if (isLiked) {
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
    } else {
      const { error } = await supabase
        .from('post_likes')
        .insert({ post_id: postId, user_id: user.id });
      
      // Send notification to post owner (if not liking own post)
      if (!error && post && post.user_id !== user.id) {
        try {
          await supabase.functions.invoke('create-notification', {
            body: {
              user_id: post.user_id,
              type: 'like',
              title: 'New like on your post',
              message: `Someone liked your post`,
              reference_id: postId,
              reference_type: 'post'
            }
          });
        } catch (err) {
          console.error('Error sending notification:', err);
        }
      }
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
      <div className="max-w-7xl mx-auto px-4 py-6 pb-20 lg:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="hidden lg:block space-y-6">
            <WidgetSkeleton />
            <WidgetSkeleton />
          </div>
          <div className="lg:col-span-2">
            <FeedSkeleton />
          </div>
          <div className="hidden lg:block space-y-6">
            <WidgetSkeleton />
            <WidgetSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-20 lg:pb-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar */}
        <div className="hidden lg:block space-y-6 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto pr-4 scrollbar-hide">
          <LeftSideAdBanner />
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
        <div className="hidden lg:block space-y-6 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto pl-4 scrollbar-hide">
          <AdBanner />
          <TrendingTopics />
          <TrendingStartups />
          <UniversityStartups />
          <StudyAbroadAdBanner />
        </div>

      </div>
    </div>
  );
};

export default Feed;
