import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Play,
  Heart,
  MessageCircle,
  Eye,
  Trash2,
  Plus,
  Video,
  X,
  Volume2,
  VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';

interface VideoPitch {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  motive: string | null;
  views_count: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

const motiveLabels: Record<string, { label: string; color: string }> = {
  investment: { label: 'Raising Investment', color: 'bg-green-500/20 text-green-500' },
  mentorship: { label: 'Seeking Mentorship', color: 'bg-blue-500/20 text-blue-500' },
  cofounder: { label: 'Looking for Co-Founder', color: 'bg-purple-500/20 text-purple-500' },
  investor: { label: 'Investor', color: 'bg-amber-500/20 text-amber-500' },
  networking: { label: 'Networking', color: 'bg-pink-500/20 text-pink-500' },
  general: { label: 'General', color: 'bg-muted text-muted-foreground' },
};

const formatCount = (count: number): string => {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(count >= 10000000 ? 0 : 1).replace(/\.0$/, '') + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(count >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'K';
  }
  return count.toString();
};

const MyPitches = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pitches, setPitches] = useState<VideoPitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPitch, setSelectedPitch] = useState<VideoPitch | null>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMyPitches();
    }
  }, [user]);

  const fetchMyPitches = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('video_pitches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pitches:', error);
    } else {
      setPitches(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (pitchId: string) => {
    const { error } = await supabase
      .from('video_pitches')
      .delete()
      .eq('id', pitchId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete pitch', variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Pitch deleted successfully' });
      setPitches(prev => prev.filter(p => p.id !== pitchId));
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
    <div className="max-w-6xl mx-auto px-4 py-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Pitches</h1>
          <p className="text-muted-foreground">Manage your uploaded pitch videos</p>
        </div>
        <Button onClick={() => navigate('/dashboard/pitches/upload')}>
          <Plus className="h-4 w-4 mr-2" />
          Upload Pitch
        </Button>
      </div>

      {pitches.length === 0 ? (
        <div className="text-center py-12">
          <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">You haven't uploaded any pitches yet</p>
          <Button onClick={() => navigate('/dashboard/pitches/upload')}>
            <Plus className="h-4 w-4 mr-2" />
            Upload Your First Pitch
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pitches.map((pitch, index) => (
            <motion.div
              key={pitch.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden hover:shadow-md transition-shadow">
                <div 
                  className="relative aspect-video bg-muted cursor-pointer group"
                  onClick={() => setSelectedPitch(pitch)}
                >
                  {pitch.thumbnail_url ? (
                    <img
                      src={pitch.thumbnail_url}
                      alt={pitch.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={pitch.video_url}
                      className="w-full h-full object-cover"
                      muted
                    />
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="h-6 w-6 text-black ml-1" />
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold truncate mb-1">{pitch.title}</h3>
                  {pitch.motive && motiveLabels[pitch.motive] && (
                    <Badge className={cn("mb-2", motiveLabels[pitch.motive].color)}>
                      {motiveLabels[pitch.motive].label}
                    </Badge>
                  )}
                  {pitch.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {pitch.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {formatCount(pitch.views_count)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {formatCount(pitch.likes_count)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {formatCount(pitch.comments_count)}
                      </span>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Pitch?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your pitch video.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(pitch.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(pitch.created_at), { addSuffix: true })}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Video Player Modal */}
      <Dialog open={!!selectedPitch} onOpenChange={(open) => !open && setSelectedPitch(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black border-none overflow-hidden">
          <AnimatePresence>
            {selectedPitch && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative"
              >
                <video
                  src={selectedPitch.video_url}
                  className="w-full max-h-[80vh] object-contain"
                  controls
                  autoPlay
                  muted={muted}
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => setMuted(!muted)}
                    className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  >
                    {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={() => setSelectedPitch(null)}
                    className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <h3 className="font-bold text-white text-lg">{selectedPitch.title}</h3>
                  {selectedPitch.motive && motiveLabels[selectedPitch.motive] && (
                    <Badge className={cn("mt-1", motiveLabels[selectedPitch.motive].color)}>
                      {motiveLabels[selectedPitch.motive].label}
                    </Badge>
                  )}
                  {selectedPitch.description && (
                    <p className="text-white/80 text-sm mt-2">{selectedPitch.description}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyPitches;