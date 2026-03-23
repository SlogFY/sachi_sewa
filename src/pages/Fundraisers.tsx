import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Users, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useCampaigns, Campaign } from "@/hooks/useCampaigns";
import DonationModal from "@/components/DonationModal";
import SocialShareButtons from "@/components/SocialShareButtons";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { usePageWallpaper } from "@/hooks/usePageWallpapers";

const formatCurrency = (amount: number) => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
};

const stats = [
  { value: "50+ Lakh", label: "Donor Community" },
  { value: "50,000+", label: "Patients Funded" },
  { value: "₹1 Cr", label: "Raised In 24 Hrs!" },
];

const Fundraisers = () => {
  const { campaigns, isLoading, refetch } = useCampaigns();
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { wallpaper, overlayOpacity } = usePageWallpaper("fundraisers_wallpaper");

  const handleDonateClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsDonationModalOpen(true);
  };

  const handleDonationComplete = () => {
    refetch();
  };

  const filteredCampaigns = campaigns.filter(
    (campaign) =>
      campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const defaultWallpaper = "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1920";
  const backgroundImage = wallpaper || defaultWallpaper;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative pt-24 pb-16 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("${backgroundImage}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity / 100 }} />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-8 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              Top Fundraisers
            </h1>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 lg:gap-24 mt-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-display font-bold text-white">
                    {stat.value}
                  </div>
                  <div className="text-slate-300 mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-8 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search fundraisers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </section>

      {/* Campaigns Grid */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              {searchQuery ? "No fundraisers found matching your search." : "No active campaigns at the moment."}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCampaigns.map((campaign, index) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="group"
                >
                  <div className="bg-card rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-border/50 hover:border-primary/30 h-full flex flex-col">
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={campaign.image_url || "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800"}
                        alt={campaign.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {/* Tags */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="bg-emerald-500 text-white text-xs font-semibold px-2 py-1 rounded">
                          TAX BENEFITS
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <span className="bg-destructive text-destructive-foreground text-xs font-semibold px-2 py-1 rounded">
                          URGENT
                        </span>
                        <SocialShareButtons 
                          campaignTitle={campaign.title} 
                          campaignId={campaign.id} 
                          compact 
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1">
                      <span className="text-xs text-primary font-medium uppercase tracking-wide mb-1">
                        {campaign.category}
                      </span>
                      <h3 className="text-base font-display font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {campaign.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">
                        {campaign.description}
                      </p>

                      {/* Progress */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-semibold text-primary">
                            {formatCurrency(Number(campaign.amount_raised))}
                          </span>
                          <span className="text-muted-foreground">
                            of {formatCurrency(Number(campaign.goal_amount))}
                          </span>
                        </div>
                        <Progress
                          value={Math.min((Number(campaign.amount_raised) / Number(campaign.goal_amount)) * 100, 100)}
                          className="h-2"
                        />
                      </div>

                      {/* Meta */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Ongoing</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>
                            {Math.min((Number(campaign.amount_raised) / Number(campaign.goal_amount)) * 100, 100).toFixed(0)}% funded
                          </span>
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
          )}
        </div>
      </section>

      <Footer />

      <DonationModal
        isOpen={isDonationModalOpen}
        onClose={() => setIsDonationModalOpen(false)}
        campaign={selectedCampaign}
        onDonationComplete={handleDonationComplete}
      />
    </div>
  );
};

export default Fundraisers;
