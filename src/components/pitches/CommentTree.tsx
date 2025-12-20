import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MessageCircle, 
  Send, 
  ChevronDown, 
  ChevronUp,
  CornerDownRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  user?: {
    full_name: string;
    avatar_url: string | null;
  };
  replies?: Comment[];
}

interface CommentTreeProps {
  comments: Comment[];
  videoId: string;
  onCommentAdded: () => void;
  depth?: number;
}

const CommentNode = ({ 
  comment, 
  videoId, 
  onCommentAdded, 
  depth = 0 
}: { 
  comment: Comment; 
  videoId: string;
  onCommentAdded: () => void;
  depth: number;
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState(depth < 2);
  const [submitting, setSubmitting] = useState(false);

  const hasReplies = comment.replies && comment.replies.length > 0;

  const handleReply = async () => {
    if (!user || !replyContent.trim()) return;
    
    setSubmitting(true);
    const { error } = await supabase
      .from('video_pitch_comments')
      .insert({
        video_id: videoId,
        user_id: user.id,
        content: replyContent.trim(),
        parent_id: comment.id
      });

    if (!error) {
      setReplyContent('');
      setShowReplyInput(false);
      onCommentAdded();
    }
    setSubmitting(false);
  };

  return (
    <div className={cn("relative", depth > 0 && "ml-6 pl-4 border-l border-border/50")}>
      <div className="flex gap-3 py-2">
        <Avatar 
          className="h-8 w-8 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate(`/dashboard/profile/${comment.user_id}`)}
        >
          <AvatarImage src={comment.user?.avatar_url || ''} />
          <AvatarFallback className="text-xs">
            {comment.user?.full_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span 
              className="font-medium text-sm cursor-pointer hover:underline"
              onClick={() => navigate(`/dashboard/profile/${comment.user_id}`)}
            >
              {comment.user?.full_name || 'Anonymous'}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm mt-1 break-words">{comment.content}</p>
          
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <CornerDownRight className="h-3 w-3" />
              Reply
            </button>
            
            {hasReplies && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                {showReplies ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    Hide {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    Show {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
                  </>
                )}
              </button>
            )}
          </div>

          <AnimatePresence>
            {showReplyInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-2 mt-2"
              >
                <Input
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="h-8 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                />
                <Button 
                  size="sm" 
                  className="h-8 px-2"
                  onClick={handleReply}
                  disabled={!replyContent.trim() || submitting}
                >
                  <Send className="h-3 w-3" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nested Replies */}
      <AnimatePresence>
        {showReplies && hasReplies && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {comment.replies!.map((reply) => (
              <CommentNode
                key={reply.id}
                comment={reply}
                videoId={videoId}
                onCommentAdded={onCommentAdded}
                depth={depth + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CommentTree = ({ comments, videoId, onCommentAdded, depth = 0 }: CommentTreeProps) => {
  // Build comment tree from flat list
  const buildTree = (comments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment>();
    const roots: Comment[] = [];

    // First pass: create map of all comments
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build tree structure
    comments.forEach(comment => {
      const node = commentMap.get(comment.id)!;
      if (comment.parent_id && commentMap.has(comment.parent_id)) {
        const parent = commentMap.get(comment.parent_id)!;
        parent.replies = parent.replies || [];
        parent.replies.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const tree = buildTree(comments);

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No comments yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {tree.map((comment) => (
        <CommentNode
          key={comment.id}
          comment={comment}
          videoId={videoId}
          onCommentAdded={onCommentAdded}
          depth={0}
        />
      ))}
    </div>
  );
};

export default CommentTree;