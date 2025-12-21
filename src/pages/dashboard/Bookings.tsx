import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Video, 
  CheckCircle, 
  XCircle,
  User
} from 'lucide-react';
import { format, addDays, setHours, setMinutes, isBefore, startOfDay } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Mentor {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  title: string | null;
  expertise: string[] | null;
  hourly_rate: number | null;
  bio: string | null;
}

interface Booking {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
  mentor: {
    full_name: string;
    avatar_url: string | null;
    title: string | null;
  };
  mentee: {
    full_name: string;
    avatar_url: string | null;
  };
  mentor_id: string;
  mentee_id: string;
}

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
];

const Bookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<string | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchMentors();
    if (user) {
      fetchBookings();
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setUserType(data.user_type);
    }
  };

  const fetchMentors = async () => {
    // For now, fetch all profiles with expertise (simulating mentors)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .not('expertise', 'is', null)
      .limit(20);

    if (error) {
      console.error('Error fetching mentors:', error);
    } else {
      setMentors(data || []);
    }
    setLoading(false);
  };

  const fetchBookings = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('bookings')
      .select('*')
      .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)
      .order('scheduled_at', { ascending: true });

    if (data) {
      // Fetch profiles separately for each booking
      const bookingsWithProfiles = await Promise.all(
        data.map(async (booking) => {
          const { data: mentorProfile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, title')
            .eq('user_id', booking.mentor_id)
            .maybeSingle();

          const { data: menteeProfile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', booking.mentee_id)
            .maybeSingle();

          return {
            ...booking,
            mentor: mentorProfile || { full_name: 'Unknown', avatar_url: null, title: null },
            mentee: menteeProfile || { full_name: 'Unknown', avatar_url: null }
          };
        })
      );
      setBookings(bookingsWithProfiles as Booking[]);
    }
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
      fetchBookings();
    }

    setIsBooking(false);
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update booking', variant: 'destructive' });
    } else {
      toast({ title: 'Updated', description: `Booking ${status}.` });
      fetchBookings();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-mint text-white">Confirmed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const upcomingBookings = bookings.filter(b => 
    isBefore(new Date(), new Date(b.scheduled_at)) && b.status !== 'cancelled'
  );
  const pastBookings = bookings.filter(b => 
    !isBefore(new Date(), new Date(b.scheduled_at)) || b.status === 'cancelled'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mentor Bookings</h1>
        {userType !== 'mentor' && (
          <Button onClick={() => navigate('/dashboard/become-mentor')}>
            Become a Mentor
          </Button>
        )}
      </div>

      <Tabs defaultValue="mentors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mentors">Find Mentors</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcomingBookings.length})</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="mentors" className="space-y-4">
          {mentors.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No mentors available yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {mentors.map((mentor, index) => (
                <motion.div
                  key={mentor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={mentor.avatar_url || ''} />
                          <AvatarFallback>{mentor.full_name?.charAt(0) || 'M'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold">{mentor.full_name}</h3>
                          <p className="text-sm text-muted-foreground">{mentor.title || 'Mentor'}</p>
                          
                          {mentor.expertise && mentor.expertise.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {mentor.expertise.slice(0, 3).map((skill, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {mentor.hourly_rate && (
                            <p className="text-sm font-medium text-primary mt-2">
                              ${mentor.hourly_rate}/hour
                            </p>
                          )}
                        </div>
                      </div>

                      {mentor.bio && (
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                          {mentor.bio}
                        </p>
                      )}

                      <Dialog open={dialogOpen && selectedMentor?.id === mentor.id} onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (!open) setSelectedMentor(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button 
                            className="w-full mt-4" 
                            onClick={() => {
                              setSelectedMentor(mentor);
                              setDialogOpen(true);
                            }}
                          >
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            Book Session
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
                                className="rounded-md border"
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
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingBookings.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No upcoming sessions.</p>
            </div>
          ) : (
            upcomingBookings.map((booking) => {
              const isMentor = booking.mentor_id === user?.id;
              const otherPerson = isMentor ? booking.mentee : booking.mentor;
              
              return (
                <Card key={booking.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarImage src={otherPerson?.avatar_url || ''} />
                        <AvatarFallback>
                          {otherPerson?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{otherPerson?.full_name}</h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {isMentor ? 'Mentee' : 'Mentor'}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            {format(new Date(booking.scheduled_at), 'MMM d, yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {format(new Date(booking.scheduled_at), 'h:mm a')}
                          </span>
                        </div>

                        {booking.notes && (
                          <p className="text-sm mt-2 bg-muted p-2 rounded">
                            {booking.notes}
                          </p>
                        )}

                        <div className="flex gap-2 mt-4">
                          {booking.status === 'pending' && isMentor && (
                            <>
                              <Button 
                                size="sm"
                                onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Confirm
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Decline
                              </Button>
                            </>
                          )}
                          {booking.status === 'confirmed' && (
                            <Button size="sm" className="bg-sky hover:bg-sky/90">
                              <Video className="h-4 w-4 mr-1" />
                              Join Session
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastBookings.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No past sessions.</p>
            </div>
          ) : (
            pastBookings.map((booking) => {
              const isMentor = booking.mentor_id === user?.id;
              const otherPerson = isMentor ? booking.mentee : booking.mentor;
              
              return (
                <Card key={booking.id} className="opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarImage src={otherPerson?.avatar_url || ''} />
                        <AvatarFallback>
                          {otherPerson?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{otherPerson?.full_name}</h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            {format(new Date(booking.scheduled_at), 'MMM d, yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {format(new Date(booking.scheduled_at), 'h:mm a')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Bookings;
