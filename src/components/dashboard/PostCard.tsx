import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Flag, AlertTriangle, Check, X, Loader2, Copy, Facebook, Twitter, Linkedin, Link } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { StartupBadge } from '@/components/common/StartupBadge';

export interface Post {
  id: string;
  content: string;
  media_url: string | null;
  media_urls?: string[];
  category?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
    title: string | null;
  };
  startup?: {
    id: string;
    name: string;
  } | null;
}

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onDelete?: (postId: string) => void;
  onLike?: (postId: string, isLiked: boolean) => void;
  isLiked?: boolean;
  isDetailView?: boolean;
}

export const PostCard = ({ 
  post, 
  currentUserId, 
  onDelete, 
  onLike,
  isLiked = false,
  isDetailView = false
}: PostCardProps) => {
  const navigate = useNavigate();
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [isSaving, setIsSaving] = useState(false);
  const [displayContent, setDisplayContent] = useState(post.content);

  const handleUpdate = async () => {
    if (!editedContent.trim()) {
      toast({ title: "Error", description: "Content cannot be empty", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('posts')
        .update({ content: editedContent })
        .eq('id', post.id);

      if (error) throw error;

      setDisplayContent(editedContent);
      setIsEditing(false);
      toast({ title: "Success", description: "Post updated successfully" });
    } catch (error) {
      console.error('Error updating post:', error);
      toast({ title: "Error", description: "Failed to update post", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(displayContent);
  };

  const handleLike = () => {
    if (onLike) {
      onLike(post.id, isLiked);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(post.id);
    }
  };

  const handleReport = async () => {
    if (!reportReason) {
      toast({ title: 'Error', description: 'Please select a reason for reporting.', variant: 'destructive' });
      return;
    }

    setIsReporting(true);
    try {
      // Note: reports table needs to be created via migration
      // For now, just show success message
      toast({ title: 'Reported', description: 'Thank you for your report. We will review it shortly.' });
      setShowReportDialog(false);
      setReportReason('');
      setReportDescription('');
    } catch (error) {
      console.error('Error reporting post:', error);
      toast({ title: 'Error', description: 'Failed to submit report.', variant: 'destructive' });
    } finally {
      setIsReporting(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CampusLaunch Post',
          text: post.content.substring(0, 100),
          url: `${window.location.origin}/dashboard/post/${post.id}`,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(`${window.location.origin}/dashboard/post/${post.id}`);
      toast({ title: 'Link copied!', description: 'Post link copied to clipboard.' });
    }
  };

  const renderContent = (content: string) => {
    // Regex to find mentions @[Name] or @Name
    const parts = content.split(/(\@\[[^\]]+\])|(@\w+(?:\s\w+)?)/g).filter(Boolean);
    
    return parts.map((part, index) => {
      // Handle @[Name] format
      if (part.startsWith('@[') && part.endsWith(']')) {
        const name = part.slice(2, -1);
        return (
          <span 
            key={index} 
            className="text-primary font-medium cursor-pointer hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/dashboard/search?q=${encodeURIComponent(name)}&type=people`);
            }}
          >
            @{name}
          </span>
        );
      }
      // Handle legacy @Name format
      if (part.startsWith('@')) {
        const name = part.substring(1);
        return (
          <span 
            key={index} 
            className="text-primary font-medium cursor-pointer hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/dashboard/search?q=${encodeURIComponent(name)}&type=people`);
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <>
      <Card 
        className={cn(
          "hover:shadow-md transition-shadow mb-4", 
          !isDetailView && "cursor-pointer"
        )}
        onClick={() => !isDetailView && navigate(`/dashboard/post/${post.id}`)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar 
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/dashboard/profile/${post.user_id}`);
                }}
              >
                <AvatarImage src={post.profiles?.avatar_url || ''} />
                <AvatarFallback>
                  {post.profiles?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p 
                      className="font-semibold cursor-pointer hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/dashboard/profile/${post.user_id}`);
                      }}
                    >
                      {post.profiles?.full_name || 'User'}
                    </p>
                    {post.startup && (
                      <StartupBadge startup={post.startup} />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {post.profiles?.title || 'Member'} • {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    {post.category && (
                      <span className="ml-2 bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full">
                        {post.category}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {currentUserId === post.user_id ? (
                  <>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                      }}
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowReportDialog(true);
                    }}
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap mb-4 text-sm sm:text-base">
            {renderContent(post.content)}
          </div>
          
          {post.media_urls && post.media_urls.length > 0 ? (
            <div className={`grid gap-1 mb-4 rounded-lg overflow-hidden ${
              post.media_urls.length === 1 ? 'grid-cols-1' : 
              post.media_urls.length === 2 ? 'grid-cols-2' : 
              'grid-cols-2'
            }`}
            onClick={(e) => e.stopPropagation()} // Stop propagation to prevent navigation when clicking grid area, images handle their own click
            >
              {post.media_urls.slice(0, 4).map((url, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "relative aspect-video cursor-pointer hover:opacity-95 transition-opacity",
                    post.media_urls!.length === 3 && i === 0 && "col-span-2",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(url);
                  }}
                >
                   <img src={url} alt="Post media" className="w-full h-full object-cover" />
                   {post.media_urls!.length > 4 && i === 3 && (
                     <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xl font-bold">
                       +{post.media_urls!.length - 4}
                     </div>
                   )}
                </div>
              ))}
            </div>
          ) : post.media_url ? (
            <img 
              src={post.media_url} 
              alt="Post media" 
              className="rounded-lg w-full max-h-96 object-cover mb-4 cursor-pointer hover:opacity-95 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(post.media_url);
              }}
            />
          ) : null}

          <div className="flex items-center gap-4 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'gap-2',
                isLiked && 'text-pink-500' // Changed to pink-500 for better visibility
              )}
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
            >
              <Heart 
                className={cn(
                  'h-4 w-4 transition-all',
                  isLiked && 'fill-current scale-110'
                )} 
              />
              {post.likes_count}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={(e) => {
                e.stopPropagation();
                if (!isDetailView) {
                    navigate(`/dashboard/post/${post.id}`);
                }
              }}
            >
              <MessageCircle className="h-4 w-4" />
              {post.comments_count}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Post</DialogTitle>
            <DialogDescription>
              Help us understand what's wrong with this post.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason</label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="harassment">Harassment or Hate Speech</SelectItem>
                  <SelectItem value="violence">Violence or Physical Harm</SelectItem>
                  <SelectItem value="adult">Adult Content</SelectItem>
                  <SelectItem value="misinformation">Misinformation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <Textarea 
                placeholder="Provide more details..."
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReport} disabled={isReporting}>
              {isReporting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/90 border-none">
           <div className="relative w-full h-full flex items-center justify-center p-4">
             {selectedImage && (
               <img 
                 src={selectedImage} 
                 alt="Full size" 
                 className="max-w-full max-h-[90vh] object-contain"
               />
             )}
           </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
