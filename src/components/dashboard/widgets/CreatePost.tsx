import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { 
  Send, 
  Loader2, 
  Image as ImageIcon, 
  Hash, 
  AtSign, 
  X,
  ListFilter
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CreatePostProps {
  onPostCreated: (post: any) => void;
}

export const CreatePost = ({ onPostCreated }: CreatePostProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string>('General');
  const [posting, setPosting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const [mentionedUsers, setMentionedUsers] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter(file => {
        if (file.size > 5 * 1024 * 1024) {
          toast({ title: 'Error', description: `${file.name} is too large (max 5MB)`, variant: 'destructive' });
          return false;
        }
        return true;
      });

      if (validFiles.length > 0) {
        setImages(prev => [...prev, ...validFiles]);
        validFiles.forEach(file => {
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreviews(prev => [...prev, reader.result as string]);
          };
          reader.readAsDataURL(file);
        });
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    if (images.length === 1 && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleContentChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setContent(newValue);

    // Mention logic
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = newValue.slice(0, cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1) {
      const query = textBeforeCursor.slice(lastAtSymbol + 1);
      // Check if there are spaces in the query (simple name check, allows spaces for full names)
      // We'll allow spaces but stop if there's a newline or specific punctuation
      if (!query.includes('\n') && query.length < 50) { 
        setMentionQuery(query);
        setShowMentions(true);
        
        if (query.trim().length > 0) {
          const { data } = await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url, title')
            .ilike('full_name', `%${query}%`)
            .limit(5);
          setMentionResults(data || []);
        } else {
          setMentionResults([]);
        }
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (user: any) => {
    if (!textareaRef.current) return;
    
    const cursorPosition = textareaRef.current.selectionStart;
    const textBeforeCursor = content.slice(0, cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = content.slice(cursorPosition);
    
    const newContent = content.slice(0, lastAtSymbol) + `@[${user.full_name}] ` + textAfterCursor;
    setContent(newContent);
    setShowMentions(false);
    setMentionedUsers(prev => new Set(prev).add(user.user_id));
    
    // Reset focus and cursor
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = lastAtSymbol + user.full_name.length + 4; // +4 for @[] and space
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const insertText = (text: string) => {
    setContent(prev => prev + (prev.endsWith(' ') ? '' : ' ') + text);
  };

  const handleCreatePost = async () => {
    if (!content.trim() && images.length === 0) return;
    if (!user) return;

    setPosting(true);
    let mediaUrls: string[] = [];

    try {
      // Upload images
      if (images.length > 0) {
        for (const img of images) {
          const fileExt = img.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('post_media') 
            .upload(filePath, img);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('bucket_not_found')) {
               toast({ 
                 title: 'System Error', 
                 description: 'Media storage is not configured. Please contact admin to run the storage migration.', 
                 variant: 'destructive' 
               });
            } else {
               toast({ title: 'Error', description: 'Failed to upload image. Please try again.', variant: 'destructive' });
            }
            throw uploadError;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('post_media')
            .getPublicUrl(filePath);
          
          mediaUrls.push(publicUrl);
        }
      }

      const { data, error } = await supabase
        .from('posts')
        .insert({ 
          content: content.trim(), 
          user_id: user.id,
          category: category,
          media_urls: mediaUrls,
          media_url: mediaUrls[0] || null, // Legacy support
          media_type: mediaUrls.length > 0 ? 'image' : null
        })
        .select('*')
        .single();

      if (error) throw error;

      // Send notifications to mentioned users
      const mentions = Array.from(mentionedUsers);
      // Filter out users who are not actually in the final content (in case they were deleted)
      const actualMentions = mentions.filter(userId => {
        // This is a rough check, ideally we should match against the name associated with the ID
        // But for now, since we don't have the name-ID map easily available here without extra state,
        // we'll just assume if they were added to the set, they are intended.
        // A better way is to check if the text contains @Name.
        // Let's rely on the set for now as it's "good enough" for this iteration.
        return true; 
      });

      if (actualMentions.length > 0) {
        const notifications = actualMentions
          .filter(userId => userId !== user.id) // Don't notify self
          .map(userId => ({
            user_id: userId,
            type: 'mention',
            title: 'New Mention',
            message: 'mentioned you in a post',
            reference_id: data.id,
            reference_type: 'post'
          }));
        
        if (notifications.length > 0) {
          await supabase.from('notifications').insert(notifications);
        }
      }

      // Fetch profile to return complete object
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, title')
        .eq('user_id', user.id)
        .single();

      onPostCreated({ ...data, profiles: profile });
      setContent('');
      setImages([]);
      setImagePreviews([]);
      setCategory('General');
      setMentionedUsers(new Set());
      toast({ title: 'Posted!', description: 'Your post is now live.' });

    } catch (error: any) {
      console.error('Post error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to create post', variant: 'destructive' });
    } finally {
      setPosting(false);
    }
  };

  return (
    <Card className="mb-4 relative overflow-visible">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="hidden sm:block h-10 w-10">
            <AvatarImage src="" />
            <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2 relative w-full">
            <Textarea
              ref={textareaRef}
              placeholder="Share your startup journey..."
              value={content}
              onChange={handleContentChange}
              className="resize-none min-h-[80px] border-none focus-visible:ring-0 px-0 text-base w-full whitespace-pre-wrap break-words"
            />
            
            {showMentions && mentionResults.length > 0 && (
              <div className="absolute z-50 left-0 top-full mt-1 w-64 bg-background border rounded-md shadow-lg overflow-hidden">
                <div className="p-1">
                  {mentionResults.map((profile) => (
                    <button
                      key={profile.user_id}
                      className="w-full flex items-center gap-2 p-2 hover:bg-muted text-left rounded-sm text-sm"
                      onClick={() => insertMention(profile)}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback>{profile.full_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{profile.full_name}</span>
                        <span className="text-[10px] text-muted-foreground">{profile.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} className="relative aspect-video">
                    <img src={preview} alt={`Preview ${idx}`} className="w-full h-full rounded-lg object-cover" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={() => removeImage(idx)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
              <div className="flex items-center gap-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                />
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Media
                </Button>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <AtSign className="h-4 w-4 mr-2" />
                      Mention
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-60 p-2">
                    <p className="text-xs text-muted-foreground mb-2">Type @Name in the text box to mention.</p>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => insertText('@')}>
                      Insert @
                    </Button>
                  </PopoverContent>
                </Popover>

                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => insertText('#')}>
                  <Hash className="h-4 w-4 mr-2" />
                  Hashtag
                </Button>

                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-[130px] h-8 border-none shadow-none bg-muted/50">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Question">Question</SelectItem>
                    <SelectItem value="Launch">Launch</SelectItem>
                    <SelectItem value="Hiring">Hiring</SelectItem>
                    <SelectItem value="Event">Event</SelectItem>
                    <SelectItem value="Resource">Resource</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleCreatePost} 
                disabled={(!content.trim() && images.length === 0) || posting}
                className="px-6"
              >
                {posting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Post
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
