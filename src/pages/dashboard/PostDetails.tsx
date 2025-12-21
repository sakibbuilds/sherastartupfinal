import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PostCard, Post } from '@/components/dashboard/PostCard';
import { toast } from '@/hooks/use-toast';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
}

const PostDetails = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchComments();
      if (user) {
        checkIfLiked();
      }
    }
  }, [postId, user]);

  const fetchPost = async () => {
    if (!postId) return;

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error) {
      console.error('Error fetching post:', error);
      toast({ title: 'Error', description: 'Post not found', variant: 'destructive' });
      navigate('/dashboard');
    } else {
      // Fetch profile and startup info
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, title')
        .eq('user_id', data.user_id)
        .single();
      
      const { data: startup } = await supabase
        .from('startups')
        .select('id, name')
        .eq('founder_id', data.user_id)
        .maybeSingle();
        
      setPost({ ...data, profiles: profile, startup } as Post);
    }
    setLoading(false);
  };

  const fetchComments = async () => {
    if (!postId) return;
    setLoadingComments(true);
    
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
    } else {
      const commentsWithProfiles = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', comment.user_id)
            .single();
          return { ...comment, profiles: profile };
        })
      );
      setComments(commentsWithProfiles as Comment[]);
    }
    setLoadingComments(false);
  };

  const checkIfLiked = async () => {
    if (!user || !postId) return;
    
    const { data } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    setIsLiked(!!data);
  };

  const handleLike = async (id: string, currentLikedState: boolean) => {
    if (!user || !post) return;

    // Optimistic update
    setIsLiked(!currentLikedState);
    setPost({
      ...post,
      likes_count: post.likes_count + (currentLikedState ? -1 : 1)
    });

    if (currentLikedState) {
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', id)
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('post_likes')
        .insert({ post_id: id, user_id: user.id });
    }
  };

  const handleDeletePost = async (id: string) => {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete post', variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Post has been removed.' });
      navigate('/dashboard');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user || !post) return;

    const { data, error } = await supabase
      .from('comments')
      .insert({ 
        content: newComment.trim(), 
        user_id: user.id, 
        post_id: post.id 
      })
      .select('*')
      .single();

    if (error) {
      toast({ title: 'Error', description: 'Failed to add comment', variant: 'destructive' });
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', user.id)
        .single();
        
      setComments([...comments, { ...data, profiles: profile } as Comment]);
      setNewComment('');
      setPost({ ...post, comments_count: post.comments_count + 1 });
      
      // Send notification to post owner if it's not the commenter
      if (post.user_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: post.user_id,
          actor_id: user.id,
          type: 'comment',
          resource_id: post.id,
          resource_type: 'post',
          content: 'commented on your post'
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-20 lg:pb-6">
      <Button 
        variant="ghost" 
        className="mb-4 pl-0 hover:bg-transparent hover:text-primary" 
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <PostCard 
        post={post}
        currentUserId={user?.id}
        onLike={handleLike}
        onDelete={handleDeletePost}
        isLiked={isLiked}
        isDetailView={true}
      />

      <div className="mt-6 bg-card rounded-lg border p-4">
        <h3 className="text-lg font-semibold mb-4">Comments ({comments.length})</h3>
        
        <div className="flex gap-3 mb-6">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" /> 
            {/* Ideally we should have current user avatar here, but we can rely on fallback or fetch it */}
            <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 gap-2 flex">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="resize-none min-h-[40px] h-[40px]"
            />
            <Button size="icon" onClick={handleAddComment} disabled={!newComment.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {loadingComments ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No comments yet. Start the conversation!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar 
                  className="h-8 w-8 cursor-pointer"
                  onClick={() => navigate(`/dashboard/profile/${comment.user_id}`)}
                >
                  <AvatarImage src={comment.profiles?.avatar_url || ''} />
                  <AvatarFallback>
                    {comment.profiles?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <p 
                      className="font-medium text-sm cursor-pointer hover:underline"
                      onClick={() => navigate(`/dashboard/profile/${comment.user_id}`)}
                    >
                      {comment.profiles?.full_name}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-1">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetails;
