import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PresenceProvider } from "@/hooks/usePresence";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/layout/DashboardLayout";
import Feed from "./pages/dashboard/Feed";
import Match from "./pages/dashboard/Match";
import Messages from "./pages/dashboard/Messages";
import Bookings from "./pages/dashboard/Bookings";
import ProfilePage from "./pages/dashboard/Profile";
import UserProfilePage from "./pages/dashboard/UserProfile";
import PostDetails from "./pages/dashboard/PostDetails";
import Startups from "./pages/dashboard/Startups";
import StartupDetails from "./pages/dashboard/StartupDetails";
import Investors from "./pages/dashboard/Investors";
import Pitches from "./pages/dashboard/Pitches";
import MyPitches from "./pages/dashboard/MyPitches";
import UploadPitch from "./pages/dashboard/UploadPitch";
import Founders from "./pages/dashboard/Founders";
import BecomeMentor from "./pages/dashboard/BecomeMentor";
import AdminMentorships from "./pages/dashboard/AdminMentorships";
import AdminAdvertisements from "./pages/dashboard/AdminAdvertisements";
import Search from "./pages/dashboard/Search";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <PresenceProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Feed />} />
                <Route path="pitches" element={<Pitches />} />
                <Route path="pitches/my" element={<MyPitches />} />
                <Route path="pitches/upload" element={<UploadPitch />} />
                <Route path="match" element={<Match />} />
                <Route path="messages" element={<Messages />} />
                <Route path="bookings" element={<Bookings />} />
                <Route path="startups" element={<Startups />} />
                <Route path="startups/:startupId" element={<StartupDetails />} />
                <Route path="founders" element={<Founders />} />
                <Route path="investors" element={<Investors />} />
                <Route path="become-mentor" element={<BecomeMentor />} />
                <Route path="admin/mentorships" element={<AdminMentorships />} />
                <Route path="admin/advertisements" element={<AdminAdvertisements />} />
                <Route path="search" element={<Search />} />
                <Route path="post/:postId" element={<PostDetails />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="profile/:userId" element={<UserProfilePage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </PresenceProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
