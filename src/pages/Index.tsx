import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Roles } from "@/components/landing/Roles";
import { FeedPreview } from "@/components/landing/FeedPreview";
import { Testimonials } from "@/components/landing/Testimonials";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";
import { Helmet } from "react-helmet";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>CampusLaunch - Where University Startups Take Flight</title>
        <meta 
          name="description" 
          content="Connect with investors, find co-founders, and get mentored by industry leaders. The #1 platform for university entrepreneurs." 
        />
        <meta name="keywords" content="startup, university, investors, entrepreneurs, funding, mentorship" />
        <link rel="canonical" href="https://campuslaunch.com" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <Hero />
          <Features />
          <FeedPreview />
          <Roles />
          <Testimonials />
          <CTA />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
