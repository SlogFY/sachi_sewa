import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import FloatingWhatsApp from "./components/FloatingWhatsApp";
import BackToTop from "./components/BackToTop";
import Index from "./pages/Index";
import Fundraisers from "./pages/Fundraisers";
import StartFundraiser from "./pages/StartFundraiser";
import MonthlyDonate from "./pages/MonthlyDonate";
import About from "./pages/About";
import Causes from "./pages/Causes";
import HowItWorksPage from "./pages/HowItWorksPage";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CreateCampaign from "./pages/CreateCampaign";
import MyCampaigns from "./pages/MyCampaigns";
import CompletedDonations from "./pages/CompletedDonations";
import CompletedCampaignDetail from "./pages/CompletedCampaignDetail";
import OwnerDashboard from "./pages/OwnerDashboard";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import RefundPolicy from "./pages/RefundPolicy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <FloatingWhatsApp />
        <BackToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/fundraisers" element={<Fundraisers />} />
          <Route path="/start-fundraiser" element={<StartFundraiser />} />
          <Route path="/monthly-donate" element={<MonthlyDonate />} />
          <Route path="/about" element={<About />} />
          <Route path="/causes" element={<Causes />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-campaign" element={<CreateCampaign />} />
          <Route path="/my-campaigns" element={<MyCampaigns />} />
          <Route path="/completed-donations" element={<CompletedDonations />} />
          <Route path="/completed-donations/:id" element={<CompletedCampaignDetail />} />
          <Route path="/owner-dashboard" element={<OwnerDashboard />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
