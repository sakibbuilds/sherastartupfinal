import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, MessageSquare, ArrowLeft, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

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
}

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [otherUser, setOtherUser] = useState<{ full_name: string; avatar_url: string | null } | null>(null);

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
        setOtherUser(other.profiles);
      }

      // Subscribe to new messages
      const channel = supabase
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
            setMessages(prev => [...prev, newMsg]);
            
            // Mark as read if not sender
            if (newMsg.sender_id !== user?.id) {
              markAsRead(newMsg.id);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConversation, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    if (!user) return;

    const { data: participantData } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (!participantData || participantData.length === 0) {
      setLoading(false);
      return;
    }

    const conversationIds = participantData.map(p => p.conversation_id);

    const { data: conversationsData } = await supabase
      .from('conversations')
      .select('id, updated_at')
      .in('id', conversationIds)
      .order('updated_at', { ascending: false });

    if (conversationsData) {
      // Fetch participants for each conversation
      const conversationsWithParticipants = await Promise.all(
        conversationsData.map(async (conv) => {
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select(`
              user_id,
              profiles!conversation_participants_user_id_fkey (
                full_name,
                avatar_url
              )
            `)
            .eq('conversation_id', conv.id);

          // Fetch last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content, created_at, is_read, sender_id')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...conv,
            participants: participants || [],
            lastMessage: lastMsg || undefined
          };
        })
      );

      setConversations(conversationsWithParticipants as Conversation[]);
    }

    setLoading(false);
  };

  const fetchMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    setMessages(data || []);

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

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    setSending(true);
    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        content: newMessage.trim()
      });

    if (!error) {
      setNewMessage('');
      
      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedConversation.id);
    }

    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
      <AnimatePresence mode="wait">
        {!selectedConversation && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full lg:w-80 border-r border-border flex flex-col"
          >
            <div className="p-4 border-b border-border">
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

                  return (
                    <button
                      key={conv.id}
                      className={cn(
                        'w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left',
                        hasUnread && 'bg-primary/5'
                      )}
                      onClick={() => setSelectedConversation(conv)}
                    >
                      <Avatar>
                        <AvatarImage src={other?.profiles?.avatar_url || ''} />
                        <AvatarFallback>
                          {other?.profiles?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat View */}
      <AnimatePresence mode="wait">
        {selectedConversation && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col"
          >
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden"
                onClick={() => setSelectedConversation(null)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar>
                <AvatarImage src={otherUser?.avatar_url || ''} />
                <AvatarFallback>{otherUser?.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{otherUser?.full_name || 'User'}</p>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => {
                  const isOwn = message.sender_id === user?.id;
                  
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
                    >
                      <div
                        className={cn(
                          'max-w-[70%] px-4 py-2 rounded-2xl',
                          isOwn 
                            ? 'bg-primary text-primary-foreground rounded-br-md' 
                            : 'bg-muted rounded-bl-md'
                        )}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className={cn(
                          'flex items-center gap-1 mt-1',
                          isOwn ? 'justify-end' : 'justify-start'
                        )}>
                          <span className={cn(
                            'text-xs',
                            isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          )}>
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: false })}
                          </span>
                          {isOwn && (
                            message.is_read 
                              ? <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                              : <Check className="h-3 w-3 text-primary-foreground/70" />
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
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={!newMessage.trim() || sending}>
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop: Show placeholder when no conversation selected */}
      {!selectedConversation && (
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <div className="text-center">
            <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Select a conversation to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
