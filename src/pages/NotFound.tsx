import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, ArrowLeft, Search } from "lucide-react";
import { motion } from "framer-motion";
import sheraLogo from "@/assets/shera-logo.png";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="glass-card p-8 text-center space-y-6 border-border/50">
          {/* Logo */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex justify-center"
          >
            <img 
              src={sheraLogo} 
              alt="SheraStartup" 
              className="h-12 w-auto"
            />
          </motion.div>

          {/* 404 Number */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
            className="relative"
          >
            <h1 className="text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-primary via-primary/80 to-primary/50">
              404
            </h1>
            <div className="absolute inset-0 text-8xl font-bold text-primary/10 blur-xl">
              404
            </div>
          </motion.div>

          {/* Message */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="space-y-2"
          >
            <h2 className="text-2xl font-semibold text-foreground">
              Page not found
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Oops! The page you're looking for doesn't exist or has been moved. 
              Let's get you back on track.
            </p>
            <p className="text-xs text-muted-foreground/60 font-mono">
              {location.pathname}
            </p>
          </motion.div>
          
          {/* Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="space-y-3 pt-2"
          >
            <Button 
              onClick={() => navigate('/dashboard')}
              className="w-full gap-2"
              size="lg"
            >
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Button>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
                className="flex-1 gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/dashboard/search')}
                className="flex-1 gap-2"
              >
                <Search className="h-4 w-4" />
                Search
              </Button>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="text-xs text-muted-foreground/50 pt-4"
          >
            © {new Date().getFullYear()} SheraStartup. All rights reserved.
          </motion.p>
        </Card>
      </motion.div>
    </div>
  );
};

export default NotFound;
