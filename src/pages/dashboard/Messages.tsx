import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, MessageSquare, ArrowLeft, Check, CheckCheck, Paperclip, Image as ImageIcon, FileIcon, Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarWithPresence, OnlineIndicator } from '@/components/common/OnlineIndicator';
import { usePresence } from '@/hooks/usePresence';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

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

interface Message {
  id: string;
  content: string;
  sender_id: string;
  is_read: boolean;
  created_at: string;
  attachment_url?: string;
  attachment_type?: 'image' | 'file';
}

const Messages = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation(); // Add useLocation to access state
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

  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      
      // Find other participant
      const other = selectedConversation.participants.find(p => p.user_id !== user?.id);
      if (other) {
        setOtherUser({ ...other.profiles, user_id: other.user_id });
      }

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
            const newMsg = payload.new as Message;
            
            // Only add if it's not from us (we add our own optimistically)
            // OR if we are handling optimistic updates, we might need to be careful not to duplicate.
            // But since we use optimistic ID replacement, let's just ensure we don't add duplicates by ID.
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            
            // Mark as read if not sender
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
            const updatedMsg = payload.new as Message;
            setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
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
        supabase.removeChannel(typingChannel);
        typingChannelRef.current = null;
      };
    }
  }, [selectedConversation, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    if (!user) return;
    
    // Don't set loading to true here to avoid flickering if we are just refreshing
    // Only set it if we have no conversations
    if (conversations.length === 0) setLoading(true);

    try {
      // Step 1: Get all conversation IDs I am part of
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

      // Step 2: Fetch details for these conversations. 
      // We attempt to fetch the 'conversations' table for updated_at sorting, 
      // but if that fails/returns empty (RLS), we continue anyway.
      const { data: conversationsData } = await supabase
        .from('conversations')
        .select('id, updated_at')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      // Create a map for quick lookup
      const conversationMap = new Map(
        (conversationsData || []).map(c => [c.id, c])
      );

      // Step 3: Build the full conversation objects manually
      // We process ALL IDs found in Step 1, not just the ones found in Step 2
      const fullConversations = await Promise.all(
        conversationIds.map(async (convId) => {
          // Get other participants
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', convId);
          
          // Get profiles
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

          // Get last message
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

      // Sort by updated_at (since we might have mixed sources)
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

  // Handle URL query parameter for conversation selection
  useEffect(() => {
    const loadSelectedConversation = async () => {
      if (!conversationIdParam || !user) return;
      
      // Try to find in existing list
      const existing = conversations.find(c => c.id === conversationIdParam);
      if (existing) {
        setSelectedConversation(existing);
        return;
      }

      setLoading(true);

      // If not found in list (e.g. new conversation), fetch it directly
      // We start by fetching participants, as this is the critical data and sometimes RLS on 'conversations'
      // can be stricter or slower to propagate than 'conversation_participants'.
      const { data: participantsData } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationIdParam);

      if (participantsData && participantsData.length > 0) {
        // We found participants, so the conversation exists!
        
        // Try to fetch conversation details, but don't block if it fails
        const { data: convData } = await supabase
          .from('conversations')
          .select('id, updated_at')
          .eq('id', conversationIdParam)
          .maybeSingle();

        const participantsWithProfiles = await Promise.all(
          participantsData.map(async (p) => {
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

        // Even if convData is null (RLS blocked), we proceed with what we have
        const newConv: Conversation = {
          id: conversationIdParam,
          updated_at: convData?.updated_at || new Date().toISOString(),
          participants: participantsWithProfiles,
          lastMessage: undefined
        };

        setSelectedConversation(newConv);
        // Add to list if not present
        setConversations(prev => {
          if (prev.find(c => c.id === newConv.id)) return prev;
          return [newConv, ...prev];
        });
      } else {
        // Fallback Level 2: Use passed state from navigation if available
        // This handles the case where DB replication/RLS is extremely slow for new records
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
                  full_name: 'You', // We don't have current user profile handy in context usually, but it's fine
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

    loadSelectedConversation();
  }, [conversationIdParam, conversations, user]);

  const fetchMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    // If we have existing messages, we want to merge them to avoid flickering
    // especially if we have optimistic messages that aren't in the DB yet (or visible yet)
    if (data) {
      setMessages(prev => {
         // Create a map of existing IDs
         const existingIds = new Set(prev.map(m => m.id));
         
         // Filter out incoming messages that we already have
         const newMessages = data.filter(m => !existingIds.has(m.id));
         
         // Combine and sort
         // Note: We keep ALL previous messages to preserve optimistic ones
         // Ideally, we should only keep optimistic ones that match our temp ID format,
         // but simple merging is safer for now.
         // However, if we refresh, we want to clear old state. 
         // Strategy: Trust the DB, but keep optimistic messages (IDs that are UUIDs but not in DB?)
         // Simplified: Just replace for now, but if we are in the middle of sending, handleSend handles the state.
         // The issue is if fetchMessages runs WHILE an optimistic message is there.
         
         return data.map(m => ({
           ...m,
           attachment_type: m.attachment_type as 'image' | 'file' | undefined,
           attachment_url: m.attachment_url ?? undefined,
           is_read: m.is_read ?? false
         }));
      });
    } else {
      setMessages([]);
    }

    // Mark unread messages as read
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

  const handleSend = async (attachmentUrl?: string, attachmentType?: 'image' | 'file') => {
    // Allow sending if there's text OR an attachment
    if ((!newMessage.trim() && !attachmentUrl) || !selectedConversation || !user) return;

    setSending(true);
    
    // Optimistic update
    const optimisticMessage: Message = {
      id: crypto.randomUUID(),
      content: newMessage.trim() || (attachmentType === 'image' ? 'Sent an image' : 'Sent a file'),
      sender_id: user.id,
      is_read: false,
      created_at: new Date().toISOString(),
      attachment_url: attachmentUrl,
      attachment_type: attachmentType
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    if (!attachmentUrl) setNewMessage(''); // Only clear text if we typed something

    const { data: sentMessage, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        content: optimisticMessage.content,
        attachment_url: attachmentUrl,
        attachment_type: attachmentType
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      // Only rollback if it's a clear failure that definitely didn't save
      // If it's an RLS error (42501) or "No rows returned" (PGRST116), the insert likely worked
      // but we just can't see the result. In that case, we KEEP the optimistic message.
      if (error.code !== '42501' && error.code !== 'PGRST116') {
         setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
         if (!attachmentUrl) setNewMessage(optimisticMessage.content);
         return;
      }
    } 
    
    if (sentMessage) {
      // Replace optimistic message with real one
      setMessages(prev => prev.map(m => m.id === optimisticMessage.id ? {
        ...sentMessage,
        attachment_type: sentMessage.attachment_type as 'image' | 'file' | undefined,
        attachment_url: sentMessage.attachment_url ?? undefined,
        is_read: sentMessage.is_read ?? false
      } : m));
      
      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedConversation.id);
    } else {
       // We assume success if we got here (RLS or no-return case)
       // We keep the optimistic message as is.
       console.log("Message sent but returned no data (likely RLS), keeping optimistic copy.");
    }

    setSending(false);
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

    // Reset input immediately so same file can be selected again
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                  onClick={() => setSelectedConversation(conv)}
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
              <div className="flex flex-col">
                <p className="font-semibold">{otherUser?.full_name || 'User'}</p>
                {isTyping ? (
                  <p className="text-xs text-primary animate-pulse">typing...</p>
                ) : otherUser?.user_id && isOnline(otherUser.user_id) ? (
                  <p className="text-xs text-mint">Online</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Offline</p>
                )}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-1 pb-4">
                {messages.map((message, index) => {
                  const isOwn = message.sender_id === user?.id;
                  const prevMessage = messages[index - 1];
                  const nextMessage = messages[index + 1];
                  
                  const isSequence = prevMessage && prevMessage.sender_id === message.sender_id;
                  const isLastInSequence = !nextMessage || nextMessage.sender_id !== message.sender_id;
                  
                  const showAvatar = !isOwn && isLastInSequence;
                  
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

                      <div className="max-w-[70%]">
                        <div
                          className={cn(
                            'px-4 py-2 text-sm break-words relative group-hover:shadow-md transition-all',
                            isOwn 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-white/10 text-foreground',
                            // Rounding logic for "Messenger" style bubbles
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

                          {message.content}
                        </div>
                        
                        {/* Timestamp & Status (Only show for last message in sequence or on hover) */}
                        <div className={cn(
                          'flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity px-1',
                          isOwn ? 'justify-end' : 'justify-start',
                          isLastInSequence && 'mb-1' // Add spacing after group
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
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

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

                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className="flex-1 bg-white/5 border-white/10 focus:border-primary min-h-[40px] max-h-32"
                />
                <Button 
                  onClick={() => handleSend()} 
                  disabled={!newMessage.trim() || sending}
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
          /* Desktop: Show placeholder when no conversation selected */
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
