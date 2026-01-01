import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { StartupGrid } from "@/components/landing/StartupGrid";
import { Footer } from "@/components/landing/Footer";
import { Helmet } from "react-helmet";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>SheraStartup - Discover University Startups</title>
        <meta 
          name="description" 
          content="Explore innovative startups built by university entrepreneurs. Connect with founders, investors, and mentors." 
        />
        <meta name="keywords" content="startup, university, entrepreneurs, directory, founders, investors" />
        <link rel="canonical" href="https://sherastartup.com" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <Hero />
          <StartupGrid />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
