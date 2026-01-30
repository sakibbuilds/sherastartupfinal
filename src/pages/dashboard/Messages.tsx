import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, MessageSquare, ArrowLeft, Check, CheckCheck, Paperclip, Image as ImageIcon, FileIcon, Download, X, Smile, Reply, CornerUpLeft, Mic, MicOff, Square, Play, Pause, Search, Pencil, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format, differenceInMinutes } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarWithPresence } from '@/components/common/OnlineIndicator';
import { usePresence } from '@/hooks/usePresence';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { useVoiceRecorder, formatRecordingTime } from '@/hooks/useVoiceRecorder';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// Edit time window in minutes
const EDIT_TIME_WINDOW = 15;

interface Conversation {
  id: string;
  updated_at: string;
  participants: {
    user_id: string;
    profiles: {
      full_name: string;
      avatar_url: string | null;
    };
  }[];
  lastMessage?: {
    content: string;
    created_at: string;
    is_read: boolean;
    sender_id: string;
  };
}

interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  is_read: boolean;
  created_at: string;
  attachment_url?: string;
  attachment_type?: 'image' | 'file' | 'voice';
  reply_to_id?: string;
  reply_to?: Message;
  reactions?: MessageReaction[];
  edited_at?: string;
}

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="flex items-center gap-2 px-4 py-2"
  >
    <div className="flex gap-1">
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
        className="w-2 h-2 bg-muted-foreground rounded-full"
      />
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
        className="w-2 h-2 bg-muted-foreground rounded-full"
      />
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
        className="w-2 h-2 bg-muted-foreground rounded-full"
      />
    </div>
    <span className="text-xs text-muted-foreground">typing...</span>
  </motion.div>
);

const VoiceMessagePlayer = ({ url }: { url: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleTimeUpdate = () => setProgress((audio.currentTime / audio.duration) * 100);
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center gap-2 min-w-[180px]">
      <audio ref={audioRef} src={url} preload="metadata" />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20"
        onClick={togglePlay}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-10 text-right">
        {formatRecordingTime(Math.floor(duration))}
      </span>
    </div>
  );
};

const Messages = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const conversationIdParam = searchParams.get('conversationId');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [otherUser, setOtherUser] = useState<{ full_name: string; avatar_url: string | null; user_id: string } | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const { isOnline } = usePresence();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Edit state
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editContent, setEditContent] = useState('');

  // Voice recording
  const { isRecording, recordingTime, audioBlob, audioUrl, startRecording, stopRecording, cancelRecording, clearRecording } = useVoiceRecorder();

  // Filter messages by search query
  const filteredMessages = searchQuery.trim()
    ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const canEditMessage = (message: Message) => {
    if (message.sender_id !== user?.id) return false;
    const minutesAgo = differenceInMinutes(new Date(), new Date(message.created_at));
    return minutesAgo <= EDIT_TIME_WINDOW;
  };

  const canDeleteMessage = (message: Message) => {
    return message.sender_id === user?.id;
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (!selectedConversation || !user) return;

    // Always fetch fresh profile data for the other user
    const initOtherUser = async () => {
      const other = selectedConversation.participants.find(p => p.user_id !== user.id);
      
      if (!other) return;

      // Always fetch fresh profile data to ensure we have the latest
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', other.user_id)
        .maybeSingle();
      
      if (profile) {
        setOtherUser({ 
          full_name: profile.full_name || 'Unknown', 
          avatar_url: profile.avatar_url, 
          user_id: other.user_id 
        });
      } else {
        // Fallback to conversation data if DB fetch fails
        setOtherUser({ 
          full_name: other.profiles?.full_name || 'Unknown', 
          avatar_url: other.profiles?.avatar_url || null, 
          user_id: other.user_id 
        });
      }
    };

    initOtherUser();
    fetchMessages(selectedConversation.id);

    // Subscribe to new messages
    const messageChannel = supabase
      .channel(`messages:${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`
        },
        (payload) => {
          const newMsg = payload.new as any;
          
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, {
              ...newMsg,
              attachment_type: newMsg.attachment_type as 'image' | 'file' | 'voice' | undefined,
              attachment_url: newMsg.attachment_url ?? undefined,
              is_read: newMsg.is_read ?? false,
              reactions: []
            }];
          });
          
          if (newMsg.sender_id !== user?.id) {
            markAsRead(newMsg.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`
        },
        (payload) => {
          const updatedMsg = payload.new as any;
          setMessages(prev => prev.map(m => m.id === updatedMsg.id ? {
            ...m,
            ...updatedMsg,
            reactions: m.reactions
          } : m));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`
        },
        (payload) => {
          const deletedMsg = payload.old as any;
          setMessages(prev => prev.filter(m => m.id !== deletedMsg.id));
        }
      )
      .subscribe();

    // Subscribe to reactions
    const reactionsChannel = supabase
      .channel(`reactions:${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions'
        },
        async () => {
          await fetchReactionsForMessages();
        }
      )
      .subscribe();

    // Subscribe to typing presence
    const typingChannel = supabase
      .channel(`typing:${selectedConversation.id}`)
      .on('presence', { event: 'sync' }, () => {
        const state = typingChannel.presenceState();
        const otherTyping = Object.values(state).flat().some(
          (presence: any) => presence.user_id !== user?.id && presence.is_typing
        );
        setIsTyping(otherTyping);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await typingChannel.track({ user_id: user?.id, is_typing: false });
        }
      });

    typingChannelRef.current = typingChannel;

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(reactionsChannel);
      supabase.removeChannel(typingChannel);
      typingChannelRef.current = null;
    };
  }, [selectedConversation, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const fetchReactionsForMessages = async () => {
    if (!selectedConversation) return;
    
    const messageIds = messages.map(m => m.id);
    if (messageIds.length === 0) return;

    const { data: reactions } = await (supabase
      .from('message_reactions') as any)
      .select('*')
      .in('message_id', messageIds);

    if (reactions) {
      setMessages(prev => prev.map(msg => ({
        ...msg,
        reactions: reactions.filter((r: MessageReaction) => r.message_id === msg.id)
      })));
    }
  };

  const fetchConversations = async () => {
    if (!user) return;
    
    if (conversations.length === 0) setLoading(true);

    try {
      const { data: myParticipations, error: partError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (partError) {
        console.error("Error fetching my participations:", partError);
        setLoading(false);
        return;
      }

      if (!myParticipations || myParticipations.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const conversationIds = myParticipations.map(p => p.conversation_id);

      const { data: conversationsData } = await supabase
        .from('conversations')
        .select('id, updated_at')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      const conversationMap = new Map(
        (conversationsData || []).map(c => [c.id, c])
      );

      const fullConversations = await Promise.all(
        conversationIds.map(async (convId) => {
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', convId);
          
          const participantsWithProfiles = await Promise.all(
            (participants || []).map(async (p) => {
               const { data: profile } = await supabase
                 .from('profiles')
                 .select('full_name, avatar_url')
                 .eq('user_id', p.user_id)
                 .maybeSingle();
               return {
                 user_id: p.user_id,
                 profiles: profile || { full_name: 'Unknown', avatar_url: null }
               };
            })
          );

          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content, created_at, is_read, sender_id')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const existingConv = conversationMap.get(convId);

          return {
            id: convId,
            updated_at: existingConv?.updated_at || lastMsg?.created_at || new Date().toISOString(),
            participants: participantsWithProfiles,
            lastMessage: lastMsg || undefined
          };
        })
      );

      const sortedConversations = fullConversations.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      setConversations(sortedConversations);

    } catch (err) {
      console.error("Critical error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadSelectedConversation = async () => {
      if (!conversationIdParam || !user) return;
      
      // Always fetch fresh participant data with profiles using a join query
      const { data: participantsData, error: participantsError } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationIdParam);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        setLoading(false);
        return;
      }

      if (participantsData && participantsData.length > 0) {
        // Get conversation metadata
        const { data: convData } = await supabase
          .from('conversations')
          .select('id, updated_at')
          .eq('id', conversationIdParam)
          .maybeSingle();

        // Fetch all participant profiles in one query
        const userIds = participantsData.map(p => p.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        }

        // Map profiles to participants
        const profilesMap = new Map(
          (profilesData || []).map(p => [p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url }])
        );

        const participantsWithProfiles = participantsData.map(p => ({
          user_id: p.user_id,
          profiles: profilesMap.get(p.user_id) || { full_name: 'Unknown', avatar_url: null }
        }));

        const newConv: Conversation = {
          id: conversationIdParam,
          updated_at: convData?.updated_at || new Date().toISOString(),
          participants: participantsWithProfiles,
          lastMessage: undefined
        };

        // Find the other user (not current user)
        const other = participantsWithProfiles.find(p => p.user_id !== user.id);
        
        // Set otherUser BEFORE setting selectedConversation to prevent showing "User"
        if (other && other.profiles) {
          setOtherUser({ 
            full_name: other.profiles.full_name || 'Unknown', 
            avatar_url: other.profiles.avatar_url, 
            user_id: other.user_id 
          });
        }

        setSelectedConversation(newConv);
        
        setConversations(prev => {
          const existingIndex = prev.findIndex(c => c.id === newConv.id);
          if (existingIndex >= 0) {
            // Update existing conversation with fresh data
            const updated = [...prev];
            updated[existingIndex] = newConv;
            return updated;
          }
          return [newConv, ...prev];
        });
      } else {
        const fallbackProfile = (location.state as any)?.fallbackProfile;
        
        if (fallbackProfile) {
           console.log("Using navigation state fallback for conversation.");
           
           const newConv: Conversation = {
            id: conversationIdParam,
            updated_at: new Date().toISOString(),
            participants: [
              {
                user_id: user.id,
                profiles: {
                  full_name: 'You',
                  avatar_url: null 
                }
              },
              {
                user_id: fallbackProfile.user_id,
                profiles: {
                  full_name: fallbackProfile.full_name,
                  avatar_url: fallbackProfile.avatar_url
                }
              }
            ],
            lastMessage: undefined
          };

          setSelectedConversation(newConv);
          setOtherUser({ 
            full_name: fallbackProfile.full_name, 
            avatar_url: fallbackProfile.avatar_url, 
            user_id: fallbackProfile.user_id 
          });
          setConversations(prev => {
            if (prev.find(c => c.id === newConv.id)) return prev;
            return [newConv, ...prev];
          });
        } else {
           console.warn("No participants found and no fallback state provided for conversation:", conversationIdParam);
        }
      }
      setLoading(false);
    };

    if (conversationIdParam) {
      setLoading(true);
      loadSelectedConversation();
    }
  }, [conversationIdParam, user]);

  const fetchMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (data) {
      const replyIds = data.filter(m => m.reply_to_id).map(m => m.reply_to_id);
      let replyMessages: any[] = [];
      
      if (replyIds.length > 0) {
        const { data: replies } = await supabase
          .from('messages')
          .select('*')
          .in('id', replyIds as string[]);
        replyMessages = replies || [];
      }

      const messageIds = data.map(m => m.id);
      const { data: reactions } = await (supabase
        .from('message_reactions') as any)
        .select('*')
        .in('message_id', messageIds);

      const messagesWithData = data.map(m => ({
        ...m,
        attachment_type: m.attachment_type as 'image' | 'file' | 'voice' | undefined,
        attachment_url: m.attachment_url ?? undefined,
        is_read: m.is_read ?? false,
        reply_to: replyMessages.find(r => r.id === m.reply_to_id),
        reactions: (reactions || []).filter((r: MessageReaction) => r.message_id === m.id),
        edited_at: (m as any).edited_at ?? undefined
      }));

      setMessages(messagesWithData);
    } else {
      setMessages([]);
    }

    if (data && user) {
      const unreadIds = data
        .filter(m => !m.is_read && m.sender_id !== user.id)
        .map(m => m.id);

      if (unreadIds.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', unreadIds);
      }
    }
  };

  const markAsRead = async (messageId: string) => {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId);
  };

  const handleSend = async (attachmentUrl?: string, attachmentType?: 'image' | 'file' | 'voice') => {
    if ((!newMessage.trim() && !attachmentUrl) || !selectedConversation || !user) return;

    setSending(true);
    
    const messageContent = attachmentType === 'voice' 
      ? '🎤 Voice message' 
      : (newMessage.trim() || (attachmentType === 'image' ? 'Sent an image' : 'Sent a file'));
    
    const optimisticMessage: Message = {
      id: crypto.randomUUID(),
      content: messageContent,
      sender_id: user.id,
      is_read: false,
      created_at: new Date().toISOString(),
      attachment_url: attachmentUrl,
      attachment_type: attachmentType,
      reply_to_id: replyingTo?.id,
      reply_to: replyingTo || undefined,
      reactions: []
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    if (!attachmentUrl) setNewMessage('');
    setReplyingTo(null);

    const { data: sentMessage, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        content: optimisticMessage.content,
        attachment_url: attachmentUrl,
        attachment_type: attachmentType,
        reply_to_id: replyingTo?.id
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      if (error.code !== '42501' && error.code !== 'PGRST116') {
         setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
         if (!attachmentUrl) setNewMessage(optimisticMessage.content);
         return;
      }
    } 
    
    if (sentMessage) {
      setMessages(prev => prev.map(m => m.id === optimisticMessage.id ? {
        ...sentMessage,
        attachment_type: sentMessage.attachment_type as 'image' | 'file' | 'voice' | undefined,
        attachment_url: sentMessage.attachment_url ?? undefined,
        is_read: sentMessage.is_read ?? false,
        reply_to: optimisticMessage.reply_to,
        reactions: []
      } : m));
      
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedConversation.id);

      // Send notification to the other user
      if (otherUser && otherUser.user_id !== user.id) {
        try {
          await supabase.functions.invoke('create-notification', {
            body: {
              user_id: otherUser.user_id,
              type: 'message',
              title: 'New message',
              message: `You have a new message: "${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}"`,
              reference_id: selectedConversation.id,
              reference_type: 'message'
            }
          });
        } catch (err) {
          console.error('Error sending message notification:', err);
        }
      }
    } else {
       console.log("Message sent but returned no data (likely RLS), keeping optimistic copy.");
    }

    setSending(false);
  };

  const handleEditMessage = async () => {
    if (!editingMessage || !editContent.trim() || !user) return;

    const { error } = await supabase
      .from('messages')
      .update({ 
        content: editContent.trim(),
        edited_at: new Date().toISOString()
      } as any)
      .eq('id', editingMessage.id)
      .eq('sender_id', user.id);

    if (error) {
      console.error('Error editing message:', error);
      toast({
        title: "Edit failed",
        description: "Could not edit the message.",
        variant: "destructive"
      });
    } else {
      setMessages(prev => prev.map(m => 
        m.id === editingMessage.id 
          ? { ...m, content: editContent.trim(), edited_at: new Date().toISOString() }
          : m
      ));
      toast({ title: "Message edited" });
    }

    setEditingMessage(null);
    setEditContent('');
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', user.id);

    if (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Delete failed",
        description: "Could not delete the message.",
        variant: "destructive"
      });
    } else {
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast({ title: "Message deleted" });
    }
  };

  const handleTyping = useCallback(() => {
    if (typingChannelRef.current && user) {
      typingChannelRef.current.track({ user_id: user.id, is_typing: true });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        if (typingChannelRef.current) {
          typingChannelRef.current.track({ user_id: user.id, is_typing: false });
        }
      }, 2000);
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    handleTyping();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = event.target.files?.[0];
    if (!file || !user || !selectedConversation) return;

    event.target.value = '';

    setSending(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${selectedConversation.id}/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      await handleSend(publicUrl, type);

    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Could not upload the file. Please try again.",
        variant: "destructive",
      });
      setSending(false);
    }
  };

  const handleVoiceRecordingToggle = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      try {
        await startRecording();
      } catch (error) {
        toast({
          title: "Microphone access denied",
          description: "Please allow microphone access to send voice messages.",
          variant: "destructive"
        });
      }
    }
  };

  const handleSendVoiceMessage = async () => {
    if (!audioBlob || !user || !selectedConversation) return;

    setSending(true);

    try {
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.webm`;
      const filePath = `${selectedConversation.id}/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      clearRecording();
      await handleSend(publicUrl, 'voice');

    } catch (error) {
      console.error('Error uploading voice message:', error);
      toast({
        title: "Upload failed",
        description: "Could not send voice message. Please try again.",
        variant: "destructive"
      });
      setSending(false);
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    
    try {
      const { error } = await (supabase
        .from('message_reactions') as any)
        .upsert({
          message_id: messageId,
          user_id: user.id,
          emoji: emoji
        }, {
          onConflict: 'message_id,user_id,emoji'
        });

      if (error) {
        console.error('Error adding reaction:', error);
      } else {
        setMessages(prev => prev.map(m => {
          if (m.id !== messageId) return m;
          const existingReaction = m.reactions?.find(r => r.user_id === user.id && r.emoji === emoji);
          if (existingReaction) return m;
          return {
            ...m,
            reactions: [...(m.reactions || []), { id: crypto.randomUUID(), message_id: messageId, user_id: user.id, emoji }]
          };
        }));
      }
    } catch (err) {
      console.error('Error adding reaction:', err);
    }
    
    setShowEmojiPicker(null);
  };

  const handleRemoveReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    
    try {
      const { error } = await (supabase
        .from('message_reactions') as any)
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji);

      if (error) {
        console.error('Error removing reaction:', error);
      } else {
        setMessages(prev => prev.map(m => {
          if (m.id !== messageId) return m;
          return {
            ...m,
            reactions: (m.reactions || []).filter(r => !(r.user_id === user.id && r.emoji === emoji))
          };
        }));
      }
    } catch (err) {
      console.error('Error removing reaction:', err);
    }
  };

  const getGroupedReactions = (reactions: MessageReaction[] = []) => {
    const grouped: { [emoji: string]: { count: number; users: string[] } } = {};
    reactions.forEach(r => {
      if (!grouped[r.emoji]) {
        grouped[r.emoji] = { count: 0, users: [] };
      }
      grouped[r.emoji].count++;
      grouped[r.emoji].users.push(r.user_id);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] lg:h-screen flex">
        {/* Conversations List Skeleton */}
        <div className="w-full lg:w-80 border-r border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10 h-[73px] flex items-center">
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="flex-1 p-2 space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>
        {/* Chat Area Skeleton */}
        <div className="hidden lg:flex flex-1 flex-col">
          <div className="h-[73px] border-b border-white/10 flex items-center px-4 gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex-1 p-4 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'justify-end' : ''}`}>
                {i % 2 !== 0 && <Skeleton className="h-10 w-10 rounded-full shrink-0" />}
                <Skeleton className={`h-16 ${i % 2 === 0 ? 'w-48' : 'w-64'} rounded-2xl`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] lg:h-screen flex">
      {/* Conversations List */}
      <div 
        className={cn(
          "w-full lg:w-80 border-r border-white/10 flex flex-col transition-all duration-300 ease-in-out absolute lg:relative z-20 h-full bg-background/95 backdrop-blur-md lg:bg-transparent lg:translate-x-0",
          selectedConversation ? "-translate-x-full lg:translate-x-0" : "translate-x-0"
        )}
      >
        <div className="p-4 border-b border-white/10 sticky top-0 bg-background/95 backdrop-blur-md z-10 h-[73px] flex items-center">
          <h1 className="text-xl font-bold">Messages</h1>
        </div>

        <ScrollArea className="flex-1">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 px-4">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No conversations yet. Match with someone to start chatting!
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const other = conv.participants.find(p => p.user_id !== user?.id);
              const hasUnread = conv.lastMessage && 
                !conv.lastMessage.is_read && 
                conv.lastMessage.sender_id !== user?.id;
              const isSelected = selectedConversation?.id === conv.id;

                return (
                  <button
                    key={conv.id}
                    className={cn(
                      'w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors text-left',
                      hasUnread && 'bg-primary/5',
                      isSelected && 'bg-white/10'
                    )}
                    onClick={() => {
                      // Set otherUser immediately from conversation data to prevent "User" flash
                      if (other && other.profiles) {
                        setOtherUser({
                          full_name: other.profiles.full_name || 'Unknown',
                          avatar_url: other.profiles.avatar_url,
                          user_id: other.user_id
                        });
                      }
                      setSelectedConversation(conv);
                    }}
                >
                  <AvatarWithPresence userId={other?.user_id || ''} indicatorSize="sm">
                    <Avatar>
                      <AvatarImage src={other?.profiles?.avatar_url || ''} />
                      <AvatarFallback>
                        {other?.profiles?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </AvatarWithPresence>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={cn('font-medium truncate', hasUnread && 'font-bold')}>
                        {other?.profiles?.full_name || 'User'}
                      </p>
                      {conv.lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conv.lastMessage.created_at), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <p className={cn(
                        'text-sm truncate',
                        hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'
                      )}>
                        {conv.lastMessage.sender_id === user?.id && 'You: '}
                        {conv.lastMessage.content}
                      </p>
                    )}
                  </div>
                  {hasUnread && (
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </button>
              );
            })
          )}
        </ScrollArea>
      </div>

      {/* Chat View */}
      <div className="flex-1 flex flex-col relative w-full h-full">
        {selectedConversation ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col h-full"
          >
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-background/50 backdrop-blur-sm sticky top-0 z-10 h-[73px]">
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden"
                onClick={() => setSelectedConversation(null)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <AvatarWithPresence userId={otherUser?.user_id || ''} indicatorSize="md">
                <Avatar>
                  <AvatarImage src={otherUser?.avatar_url || ''} />
                  <AvatarFallback>{otherUser?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
              </AvatarWithPresence>
              <div className="flex-1 flex flex-col">
                <p className="font-semibold">{otherUser?.full_name || 'User'}</p>
                {isTyping ? (
                  <p className="text-xs text-primary animate-pulse">typing...</p>
                ) : otherUser?.user_id && isOnline(otherUser.user_id) ? (
                  <p className="text-xs text-mint">Online</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Offline</p>
                )}
              </div>
              
              {/* Search toggle */}
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-9 w-9", showSearch && "bg-white/10")}
                onClick={() => setShowSearch(!showSearch)}
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>

            {/* Search bar */}
            <AnimatePresence>
              {showSearch && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-white/10 overflow-hidden"
                >
                  <div className="p-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search messages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white/5 border-white/10"
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setSearchQuery('')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {searchQuery && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Found {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-1 pb-4">
                {filteredMessages.map((message, index) => {
                  const isOwn = message.sender_id === user?.id;
                  const prevMessage = filteredMessages[index - 1];
                  const nextMessage = filteredMessages[index + 1];
                  
                  const isSequence = prevMessage && prevMessage.sender_id === message.sender_id;
                  const isLastInSequence = !nextMessage || nextMessage.sender_id !== message.sender_id;
                  
                  const showAvatar = !isOwn && isLastInSequence;
                  const groupedReactions = getGroupedReactions(message.reactions);
                  const isEditable = canEditMessage(message);
                  const isDeletable = canDeleteMessage(message);
                  
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'flex gap-2 group', 
                        isOwn ? 'justify-end' : 'justify-start',
                        isSequence ? 'mt-0.5' : 'mt-4'
                      )}
                    >
                      {!isOwn && (
                        <div className="w-8 flex-shrink-0 flex items-end">
                          {showAvatar && (
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={otherUser?.avatar_url || ''} />
                              <AvatarFallback>{otherUser?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )}

                      <div className="max-w-[70%] relative">
                        {/* Reply preview */}
                        {message.reply_to && (
                          <div className={cn(
                            "mb-1 px-3 py-1.5 rounded-lg text-xs bg-white/5 border-l-2 border-primary/50",
                            isOwn ? "ml-auto" : ""
                          )}>
                            <p className="text-muted-foreground truncate">
                              <CornerUpLeft className="h-3 w-3 inline mr-1" />
                              {message.reply_to.content}
                            </p>
                          </div>
                        )}

                        <div className="relative">
                          {/* Action buttons - visible on hover */}
                          <div className={cn(
                            "absolute top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10",
                            isOwn ? "-left-24" : "-right-24"
                          )}>
                            <Popover open={showEmojiPicker === message.id} onOpenChange={(open) => setShowEmojiPicker(open ? message.id : null)}>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-background/80 hover:bg-background">
                                  <Smile className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-2" side="top">
                                <div className="flex gap-1">
                                  {EMOJI_OPTIONS.map(emoji => (
                                    <button
                                      key={emoji}
                                      onClick={() => handleAddReaction(message.id, emoji)}
                                      className="text-xl hover:scale-125 transition-transform p-1"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 rounded-full bg-background/80 hover:bg-background"
                              onClick={() => setReplyingTo(message)}
                            >
                              <Reply className="h-4 w-4" />
                            </Button>
                            {isOwn && isEditable && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 rounded-full bg-background/80 hover:bg-background"
                                onClick={() => {
                                  setEditingMessage(message);
                                  setEditContent(message.content);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {isOwn && isDeletable && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 rounded-full bg-background/80 hover:bg-background hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete message?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. The message will be permanently deleted.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteMessage(message.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>

                          <div
                            className={cn(
                              'px-4 py-2 text-sm break-words relative group-hover:shadow-md transition-all',
                              isOwn 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-white/10 text-foreground',
                              isOwn && 'rounded-2xl rounded-tr-md rounded-br-md',
                              isOwn && isSequence && 'rounded-tr-md rounded-br-md',
                              isOwn && !isSequence && 'rounded-tr-2xl',
                              isOwn && isLastInSequence && 'rounded-br-2xl',
                              
                              !isOwn && 'rounded-2xl rounded-tl-md rounded-bl-md',
                              !isOwn && isSequence && 'rounded-tl-md rounded-bl-md',
                              !isOwn && !isSequence && 'rounded-tl-2xl',
                              !isOwn && isLastInSequence && 'rounded-bl-2xl'
                            )}
                            title={format(new Date(message.created_at), 'MMM d, h:mm a')}
                          >
                            {message.attachment_url && message.attachment_type === 'image' && (
                              <div className="mb-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <img 
                                      src={message.attachment_url} 
                                      alt="Attachment" 
                                      className="max-w-full rounded-lg max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                    />
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none">
                                    <VisuallyHidden.Root>
                                      <DialogTitle>Image Attachment</DialogTitle>
                                    </VisuallyHidden.Root>
                                    <div className="relative flex items-center justify-center w-full h-full">
                                      <img 
                                        src={message.attachment_url} 
                                        alt="Full size attachment" 
                                        className="max-w-full max-h-[85vh] object-contain rounded-md shadow-2xl"
                                      />
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            )}
                            
                            {message.attachment_url && message.attachment_type === 'file' && (
                              <div className="mb-2">
                                <a 
                                  href={message.attachment_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-3 rounded-lg bg-black/20 hover:bg-black/30 transition-colors"
                                >
                                  <div className="p-2 rounded-full bg-white/10">
                                    <FileIcon className="h-5 w-5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">Attachment</p>
                                    <p className="text-xs opacity-70">Click to open</p>
                                  </div>
                                  <Download className="h-4 w-4 opacity-70" />
                                </a>
                              </div>
                            )}

                            {message.attachment_url && message.attachment_type === 'voice' && (
                              <div className="mb-2">
                                <VoiceMessagePlayer url={message.attachment_url} />
                              </div>
                            )}

                            {message.attachment_type !== 'voice' && message.content}
                            
                            {message.edited_at && (
                              <span className="text-[10px] opacity-60 ml-2">(edited)</span>
                            )}
                          </div>

                          {/* Reactions display */}
                          {Object.keys(groupedReactions).length > 0 && (
                            <div className={cn(
                              "flex flex-wrap gap-1 mt-1",
                              isOwn ? "justify-end" : "justify-start"
                            )}>
                              {Object.entries(groupedReactions).map(([emoji, data]) => {
                                const isOwnReaction = data.users.includes(user?.id || '');
                                return (
                                  <button
                                    key={emoji}
                                    onClick={() => isOwnReaction 
                                      ? handleRemoveReaction(message.id, emoji)
                                      : handleAddReaction(message.id, emoji)
                                    }
                                    className={cn(
                                      "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all",
                                      isOwnReaction 
                                        ? "bg-primary/20 border border-primary/50" 
                                        : "bg-white/10 hover:bg-white/20"
                                    )}
                                  >
                                    <span>{emoji}</span>
                                    {data.count > 1 && <span className="text-muted-foreground">{data.count}</span>}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        
                        {/* Timestamp & Status */}
                        <div className={cn(
                          'flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity px-1',
                          isOwn ? 'justify-end' : 'justify-start',
                          isLastInSequence && 'mb-1'
                        )}>
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(message.created_at), 'h:mm a')}
                          </span>
                          {isOwn && (
                            message.is_read 
                              ? <CheckCheck className="h-3 w-3 text-primary" />
                              : <div className="h-3 w-3 rounded-full border border-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                
                {/* Typing indicator */}
                <AnimatePresence>
                  {isTyping && (
                    <div className="flex gap-2 justify-start mt-2">
                      <div className="w-8 flex-shrink-0 flex items-end">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={otherUser?.avatar_url || ''} />
                          <AvatarFallback>{otherUser?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="bg-white/10 rounded-2xl">
                        <TypingIndicator />
                      </div>
                    </div>
                  )}
                </AnimatePresence>
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Edit message modal */}
            <AnimatePresence>
              {editingMessage && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-white/10 bg-background/50 overflow-hidden"
                >
                  <div className="p-3 flex items-center gap-3">
                    <div className="w-1 h-10 bg-amber-500 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Editing message</p>
                      <Input
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="mt-1 bg-white/5 border-white/10"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleEditMessage();
                          }
                          if (e.key === 'Escape') {
                            setEditingMessage(null);
                            setEditContent('');
                          }
                        }}
                        autoFocus
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Press Enter to save, Escape to cancel
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                      setEditingMessage(null);
                      setEditContent('');
                    }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reply preview */}
            <AnimatePresence>
              {replyingTo && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-white/10 bg-background/50 overflow-hidden"
                >
                  <div className="p-3 flex items-center gap-3">
                    <div className="w-1 h-10 bg-primary rounded-full" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Replying to</p>
                      <p className="text-sm truncate">{replyingTo.content}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setReplyingTo(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Voice recording preview */}
            <AnimatePresence>
              {(isRecording || audioUrl) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-white/10 bg-background/50 overflow-hidden"
                >
                  <div className="p-3 flex items-center gap-3">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      isRecording ? "bg-red-500 animate-pulse" : "bg-primary"
                    )} />
                    
                    {isRecording ? (
                      <>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Recording...</p>
                          <p className="text-xs text-muted-foreground">{formatRecordingTime(recordingTime)}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cancelRecording}>
                          <X className="h-4 w-4" />
                        </Button>
                        <Button size="icon" className="h-8 w-8 rounded-full bg-red-500 hover:bg-red-600" onClick={stopRecording}>
                          <Square className="h-4 w-4" />
                        </Button>
                      </>
                    ) : audioUrl ? (
                      <>
                        <div className="flex-1">
                          <audio src={audioUrl} controls className="w-full h-8" />
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearRecording}>
                          <X className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          className="h-8 w-8 rounded-full" 
                          onClick={handleSendVoiceMessage}
                          disabled={sending}
                        >
                          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                      </>
                    ) : null}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message Input */}
            <div className="p-4 border-t border-white/10 bg-background/50 backdrop-blur-sm">
              <div className="flex gap-2 items-end">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full shrink-0">
                      <Paperclip className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2" align="start">
                    <div className="grid gap-1">
                      <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => imageInputRef.current?.click()}>
                        <ImageIcon className="h-4 w-4" />
                        Image
                      </Button>
                      <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => fileInputRef.current?.click()}>
                        <Paperclip className="h-4 w-4" />
                        File
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                <input 
                  type="file" 
                  ref={imageInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => handleFileUpload(e, 'image')} 
                />
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={(e) => handleFileUpload(e, 'file')} 
                />

                {/* Voice record button */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "h-10 w-10 rounded-full shrink-0",
                    isRecording && "text-red-500"
                  )}
                  onClick={handleVoiceRecordingToggle}
                >
                  {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5 text-muted-foreground" />}
                </Button>

                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className="flex-1 bg-white/5 border-white/10 focus:border-primary min-h-[40px] max-h-32"
                  disabled={isRecording || !!audioUrl}
                />
                <Button 
                  onClick={() => handleSend()} 
                  disabled={!newMessage.trim() || sending || isRecording || !!audioUrl}
                  size="icon"
                  className="h-10 w-10 rounded-full shrink-0"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="hidden lg:flex flex-1 items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
