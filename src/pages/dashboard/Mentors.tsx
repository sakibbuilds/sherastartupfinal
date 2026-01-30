import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Loader2, 
  Search,
  Filter,
  CheckCircle,
  DollarSign,
  Star,
  MessageSquare
} from 'lucide-react';
import { format, setHours, setMinutes, isBefore, startOfDay } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { UserBadges } from '@/components/common/UserBadges';
import { Skeleton } from '@/components/ui/skeleton';
import { UserCardSkeleton } from '@/components/skeletons';

interface Mentor {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  title: string | null;
  expertise: string[] | null;
  hourly_rate: number | null;
  bio: string | null;
  verified?: boolean;
  is_mentor?: boolean;
  is_available?: boolean;
}

const expertiseCategories = [
  'All Categories',
  'Growth Strategy',
  'Fundraising',
  'Product Management',
  'Marketing',
  'Engineering',
  'Legal',
  'Finance',
  'Sales',
  'HR',
  'AI/ML'
];

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
];

const Mentors = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchMentors();
  }, []);

  useEffect(() => {
    filterMentors();
  }, [mentors, searchQuery, selectedCategory]);

  const fetchMentors = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, title, expertise, hourly_rate, bio, verified, is_mentor, is_available')
      .eq('is_mentor', true)
      .eq('is_available', true);

    if (error) {
      console.error('Error fetching mentors:', error);
    } else if (data) {
      setMentors(data);
      setFilteredMentors(data);
    }
    setLoading(false);
  };

  const filterMentors = () => {
    let filtered = [...mentors];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.full_name?.toLowerCase().includes(query) ||
        m.title?.toLowerCase().includes(query) ||
        m.expertise?.some(e => e.toLowerCase().includes(query))
      );
    }

    if (selectedCategory !== 'All Categories') {
      filtered = filtered.filter(m => 
        m.expertise?.some(e => e.toLowerCase().includes(selectedCategory.toLowerCase()))
      );
    }

    setFilteredMentors(filtered);
  };

  const handleBookSession = async () => {
    if (!selectedMentor || !selectedDate || !selectedTime || !user) return;

    setIsBooking(true);

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const scheduledAt = setMinutes(setHours(selectedDate, hours), minutes);

    const { error } = await supabase
      .from('bookings')
      .insert({
        mentor_id: selectedMentor.user_id,
        mentee_id: user.id,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: 30,
        notes: bookingNotes || null,
        status: 'pending'
      });

    if (error) {
      toast({ title: 'Error', description: 'Failed to book session', variant: 'destructive' });
    } else {
      toast({ title: 'Session Booked!', description: 'Your mentor session has been scheduled.' });
      setDialogOpen(false);
      setSelectedMentor(null);
      setSelectedTime('');
      setBookingNotes('');
    }

    setIsBooking(false);
  };

  const handleMessage = async (mentorId: string) => {
    if (!user) {
      toast({ title: 'Error', description: 'Please login to message', variant: 'destructive' });
      return;
    }

    // STEP 1: Check if conversation already exists
    const { data: myConversations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (myConversations && myConversations.length > 0) {
      const conversationIds = myConversations.map(c => c.conversation_id);
      
      // Find shared conversation with the mentor
      const { data: sharedConversations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', mentorId)
        .in('conversation_id', conversationIds)
        .limit(1);

      if (sharedConversations && sharedConversations.length > 0) {
        navigate(`/dashboard/messages?conversationId=${sharedConversations[0].conversation_id}`);
        return;
      }
    }

    // STEP 2: Create new conversation
    const newConversationId = crypto.randomUUID();
    
    const { error: convError } = await supabase
      .from('conversations')
      .insert({ id: newConversationId });

    if (convError) {
      toast({ title: 'Error', description: 'Failed to start conversation', variant: 'destructive' });
      return;
    }

    // Add participants
    const { error: participantError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: newConversationId, user_id: user.id },
        { conversation_id: newConversationId, user_id: mentorId }
      ]);

    if (participantError) {
      console.error('Error adding participants:', participantError);
      toast({ title: 'Error', description: 'Failed to add participants', variant: 'destructive' });
      return;
    }

    navigate(`/dashboard/messages?conversationId=${newConversationId}`);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 pb-20 lg:pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-[200px] rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <UserCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-20 lg:pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mentor Directory</h1>
          <p className="text-muted-foreground">Find experienced mentors to guide your startup journey</p>
        </div>
        <Button onClick={() => navigate('/dashboard/mentorship/become')}>
          Become a Mentor
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search mentors by name, expertise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {expertiseCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground mb-4">
        Showing {filteredMentors.length} mentor{filteredMentors.length !== 1 ? 's' : ''}
      </p>

      {/* Mentors Grid */}
      {filteredMentors.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No mentors found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMentors.map((mentor, index) => (
            <motion.div
              key={mentor.user_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="glass-card hover:-translate-y-1 transition-all duration-300 h-full">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar 
                      className="h-16 w-16 cursor-pointer"
                      onClick={() => navigate(`/dashboard/profile/${mentor.user_id}`)}
                    >
                      <AvatarImage src={mentor.avatar_url || ''} />
                      <AvatarFallback>{mentor.full_name?.charAt(0) || 'M'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <h3 
                          className="font-semibold truncate cursor-pointer hover:text-primary"
                          onClick={() => navigate(`/dashboard/profile/${mentor.user_id}`)}
                        >
                          {mentor.full_name}
                        </h3>
                        <UserBadges verified={mentor.verified} isMentor={mentor.is_mentor} size="sm" />
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{mentor.title || 'Mentor'}</p>
                      {mentor.hourly_rate && (
                        <div className="flex items-center gap-1 mt-1 text-primary font-medium">
                          <DollarSign className="h-4 w-4" />
                          <span>${mentor.hourly_rate}/hour</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {mentor.expertise && mentor.expertise.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {mentor.expertise.slice(0, 4).map((skill, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {mentor.expertise.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{mentor.expertise.length - 4}
                        </Badge>
                      )}
                    </div>
                  )}

                  {mentor.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {mentor.bio}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Dialog open={dialogOpen && selectedMentor?.user_id === mentor.user_id} onOpenChange={(open) => {
                      setDialogOpen(open);
                      if (!open) setSelectedMentor(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          className="flex-1"
                          onClick={() => {
                            setSelectedMentor(mentor);
                            setDialogOpen(true);
                          }}
                        >
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          Book
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Book a Session with {mentor.full_name}</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Select Date</label>
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={setSelectedDate}
                              disabled={(date) => isBefore(date, startOfDay(new Date()))}
                              className={cn("rounded-md border pointer-events-auto")}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2 block">Select Time</label>
                            <Select value={selectedTime} onValueChange={setSelectedTime}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a time slot" />
                              </SelectTrigger>
                              <SelectContent>
                                {timeSlots.map((slot) => (
                                  <SelectItem key={slot} value={slot}>
                                    {slot}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2 block">Notes (optional)</label>
                            <Textarea
                              placeholder="What would you like to discuss?"
                              value={bookingNotes}
                              onChange={(e) => setBookingNotes(e.target.value)}
                              className="resize-none"
                            />
                          </div>

                          <Button 
                            className="w-full" 
                            onClick={handleBookSession}
                            disabled={!selectedDate || !selectedTime || isBooking}
                          >
                            {isBooking ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            Confirm Booking
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button 
                      variant="outline"
                      onClick={() => handleMessage(mentor.user_id)}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Mentors;