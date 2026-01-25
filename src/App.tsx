import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PresenceProvider } from "@/hooks/usePresence";
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
import Settings from "./pages/dashboard/Settings";
import Mentors from "./pages/dashboard/Mentors";
import Tools from "./pages/dashboard/Tools";
import ElevatorPitch from "./pages/dashboard/ElevatorPitch";
import PitchDeck from "./pages/dashboard/PitchDeck";
import BizSimulation from "./pages/dashboard/BizSimulation";
import InvestmentSimulation from "./pages/dashboard/InvestmentSimulation";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminStartups from "./pages/admin/AdminStartups";
import AdminVerification from "./pages/admin/AdminVerification";
import AdminMentors from "./pages/admin/AdminMentors";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <PresenceProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Redirect root to auth page */}
              <Route path="/" element={<Navigate to="/auth" replace />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminOverview />} />
                <Route path="dashboard" element={<AdminOverview />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="startups" element={<AdminStartups />} />
                <Route path="mentors" element={<AdminMentors />} />
                <Route path="verification" element={<AdminVerification />} />
              </Route>

              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Feed />} />
                <Route path="feed" element={<Feed />} />
                <Route path="pitches" element={<Pitches />} />
                <Route path="pitches/my" element={<MyPitches />} />
                <Route path="pitches/upload" element={<UploadPitch />} />
                <Route path="network" element={<Match />} />
                <Route path="network/connections" element={<Match />} />
                <Route path="network/requests" element={<Match />} />
                <Route path="messages" element={<Messages />} />
                <Route path="mentors" element={<Mentors />} />
                <Route path="mentorship" element={<Bookings />} />
                <Route path="mentorship/find" element={<Mentors />} />
                <Route path="mentorship/become" element={<BecomeMentor />} />
                <Route path="bookings" element={<Bookings />} />
                <Route path="tools" element={<Tools />} />
                <Route path="tools/elevator-pitch" element={<ElevatorPitch />} />
                <Route path="tools/pitch-deck" element={<PitchDeck />} />
                <Route path="tools/biz-simulation" element={<BizSimulation />} />
                <Route path="tools/investment-simulation" element={<InvestmentSimulation />} />
                <Route path="startups" element={<Startups />} />
                <Route path="startups/:startupId" element={<StartupDetails />} />
                <Route path="founders" element={<Founders />} />
                <Route path="investors" element={<Investors />} />
                <Route path="admin/mentorships/requests" element={<AdminMentorships />} />
                <Route path="admin/mentorships/all" element={<AdminMentors />} />
                <Route path="admin/advertisements" element={<AdminAdvertisements />} />
                <Route path="search" element={<Search />} />
                <Route path="post/:postId" element={<PostDetails />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="profile/:userId" element={<UserProfilePage />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </PresenceProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
