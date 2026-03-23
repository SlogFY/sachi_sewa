import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ImpactStats from "@/components/ImpactStats";
import CausesSection from "@/components/CausesSection";
import FundraisersSection from "@/components/FundraisersSection";
import HowItWorks from "@/components/HowItWorks";
import SuccessStories from "@/components/SuccessStories";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import useSectionNavigation from "@/hooks/useSectionNavigation";

const Index = () => {
  // Enable keyboard arrow navigation between sections
  useSectionNavigation();

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <ImpactStats />
      <CausesSection />
      <FundraisersSection />
      <HowItWorks />
      <SuccessStories />
      <CTASection />
      <Footer />
    </main>
  );
};

export default Index;
