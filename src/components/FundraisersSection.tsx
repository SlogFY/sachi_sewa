import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Users, ArrowRight, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCampaigns, Campaign } from "@/hooks/useCampaigns";
import DonationModal from "./DonationModal";
import { supabase } from "@/integrations/supabase/client";

const formatCurrency = (amount: number) => {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
};

const FundraisersSection = () => {
  const { campaigns, isLoading, refetch } = useCampaigns();
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [donorCounts, setDonorCounts] = useState<Record<string, number>>({});
  const [isPaused, setIsPaused] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch donor counts for each campaign
  useEffect(() => {
    const fetchDonorCounts = async () => {
      const { data, error } = await supabase
        .from("donations")
        .select("campaign_id");
      
      if (!error && data) {
        const counts: Record<string, number> = {};
        data.forEach((donation) => {
          counts[donation.campaign_id] = (counts[donation.campaign_id] || 0) + 1;
        });
        setDonorCounts(counts);
      }
    };
    fetchDonorCounts();
  }, [campaigns]);

  // Filter out 100% completed campaigns
  const activeCampaigns = campaigns.filter(
    (campaign) => (Number(campaign.amount_raised) / Number(campaign.goal_amount)) * 100 < 100
  );

  // Get top 6 campaigns for carousel
  const topCampaigns = activeCampaigns.slice(0, 6);

  // Get visible 3 cards based on startIndex (circular)
  const getVisibleCampaigns = () => {
    if (topCampaigns.length === 0) return [];
    const visible = [];
    for (let i = 0; i < 3; i++) {
      const idx = (startIndex + i) % topCampaigns.length;
      visible.push({ campaign: topCampaigns[idx], originalIndex: idx });
    }
    return visible;
  };

  // Auto-slide effect - move one card at a time
  useEffect(() => {
    if (isPaused || topCampaigns.length <= 3) return;

    intervalRef.current = setInterval(() => {
      setStartIndex((prev) => (prev + 1) % topCampaigns.length);
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, topCampaigns.length]);

  const handleDonateClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsDonationModalOpen(true);
  };

  const handleDonationComplete = () => {
    refetch();
  };

  const goToPrev = () => {
    setStartIndex((prev) => (prev - 1 + topCampaigns.length) % topCampaigns.length);
  };

  const goToNext = () => {
    setStartIndex((prev) => (prev + 1) % topCampaigns.length);
  };

  return (
    <section id="fundraisers" className="py-24 bg-gradient-soft overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-12"
        >
          <div>
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              Active Campaigns
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mt-3">
              Our Top Fundraisers
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl">
              These campaigns need your support right now. Every contribution brings hope.
            </p>
          </div>
          <Button variant="outline" className="mt-6 md:mt-0 group" asChild>
            <Link to="/fundraisers">
              View All Fundraisers
              <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : activeCampaigns.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No active campaigns at the moment.
          </div>
        ) : (
          <>
            {/* Mobile Grid Layout - unchanged */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:hidden">
              {activeCampaigns.slice(0, 6).map((campaign, index) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group"
                >
                  <div className="bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-border/50 hover:border-primary/30">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={campaign.image_url || "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800"}
                        alt={campaign.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                          {campaign.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-display font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {campaign.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {campaign.description}
                      </p>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-semibold text-primary">
                            {formatCurrency(Number(campaign.amount_raised))} raised
                          </span>
                          <span className="text-muted-foreground">
                            of {formatCurrency(Number(campaign.goal_amount))}
                          </span>
                        </div>
                        <Progress
                          value={(Number(campaign.amount_raised) / Number(campaign.goal_amount)) * 100}
                          className="h-2"
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Ongoing</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{donorCounts[campaign.id] || 0} donors</span>
                        </div>
                      </div>
                      <Button 
                        variant="primary" 
                        className="w-full"
                        onClick={() => handleDonateClick(campaign)}
                      >
                        Donate Now
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Desktop Carousel Layout - 3 cards with smooth sliding */}
            <div 
              className="hidden lg:block relative"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Navigation Arrows */}
              <button
                onClick={goToPrev}
                className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 bg-card hover:bg-primary/10 border border-border shadow-md rounded-full p-2.5 transition-all duration-300 hover:scale-105 hover:border-primary/50"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <button
                onClick={goToNext}
                className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 bg-card hover:bg-primary/10 border border-border shadow-md rounded-full p-2.5 transition-all duration-300 hover:scale-105 hover:border-primary/50"
              >
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>

              {/* Cards Container with smooth CSS transitions */}
              <div className="overflow-hidden mx-8">
                <motion.div 
                  className="flex gap-6 justify-center"
                  initial={false}
                >
                  <AnimatePresence initial={false} mode="popLayout">
                    {getVisibleCampaigns().map(({ campaign, originalIndex }, position) => (
                      <motion.div
                        key={`${campaign.id}-${originalIndex}`}
                        layout
                        initial={{ opacity: 0, scale: 0.95, x: 120 }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1, 
                          x: 0,
                          transition: {
                            type: "spring",
                            stiffness: 80,
                            damping: 18,
                            mass: 1.2
                          }
                        }}
                        exit={{ 
                          opacity: 0, 
                          scale: 0.95, 
                          x: -120,
                          transition: { 
                            duration: 0.7,
                            ease: [0.25, 0.1, 0.25, 1]
                          }
                        }}
                        className="group flex-shrink-0 w-[340px]"
                        style={{ perspective: 1000 }}
                        whileHover={{ 
                          y: -8,
                          rotateX: 2,
                          rotateY: -2,
                          transition: { duration: 0.4, ease: "easeOut" }
                        }}
                      >
                        <div className="bg-card rounded-xl overflow-hidden shadow-sm group-hover:shadow-xl transition-all duration-500 border border-border/40 hover:border-primary/20 h-full transform-gpu">
                          <div className="relative h-44 overflow-hidden">
                            <img
                              src={campaign.image_url || "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800"}
                              alt={campaign.title}
                              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="absolute top-3 left-3">
                              <span className="bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs font-medium px-2.5 py-1 rounded-md">
                                {campaign.category}
                              </span>
                            </div>
                          </div>
                          <div className="p-5">
                            <h3 className="text-base font-semibold text-foreground mb-1.5 line-clamp-1 group-hover:text-primary transition-colors duration-300">
                              {campaign.title}
                            </h3>
                            <p className="text-muted-foreground text-sm mb-3 line-clamp-2 leading-relaxed">
                              {campaign.description}
                            </p>
                            <div className="mb-3">
                              <div className="flex justify-between text-sm mb-1.5">
                                <span className="font-medium text-primary">
                                  {formatCurrency(Number(campaign.amount_raised))}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  of {formatCurrency(Number(campaign.goal_amount))}
                                </span>
                              </div>
                              <Progress
                                value={(Number(campaign.amount_raised) / Number(campaign.goal_amount)) * 100}
                                className="h-1.5"
                              />
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Ongoing</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                <span>{donorCounts[campaign.id] || 0} donors</span>
                              </div>
                            </div>
                            <Button 
                              variant="primary" 
                              size="sm"
                              className="w-full"
                              onClick={() => handleDonateClick(campaign)}
                            >
                              Donate Now
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Minimal Carousel Indicators */}
              <div className="flex justify-center gap-1.5 mt-6">
                {topCampaigns.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setStartIndex(index)}
                    className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                      index === startIndex 
                        ? 'w-6 bg-primary' 
                        : 'w-1.5 bg-muted-foreground/20 hover:bg-muted-foreground/40'
                    }`}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <DonationModal
        isOpen={isDonationModalOpen}
        onClose={() => setIsDonationModalOpen(false)}
        campaign={selectedCampaign}
        onDonationComplete={handleDonationComplete}
      />
    </section>
  );
};

export default FundraisersSection;
