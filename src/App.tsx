import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
import Startups from "./pages/dashboard/Startups";
import Investors from "./pages/dashboard/Investors";
import Pitches from "./pages/dashboard/Pitches";
import MyPitches from "./pages/dashboard/MyPitches";
import UploadPitch from "./pages/dashboard/UploadPitch";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
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
              <Route path="investors" element={<Investors />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="profile/:userId" element={<UserProfilePage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
