import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Users, Target, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Campaign {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  goal_amount: number;
  amount_raised: number;
  category: string;
}

const formatCurrency = (amount: number) => {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
};

const CompletedDonations = () => {
  const [completedCampaigns, setCompletedCampaigns] = useState<Campaign[]>([]);
  const [donorCounts, setDonorCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCompletedCampaigns = async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("status", "live")
        .eq("is_active", true);

      if (!error && data) {
        // Filter campaigns that are 100% or more funded
        const completed = data.filter(
          (campaign) =>
            (Number(campaign.amount_raised) / Number(campaign.goal_amount)) * 100 >= 100
        );
        setCompletedCampaigns(completed);
      }
      setIsLoading(false);
    };

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

    fetchCompletedCampaigns();
    fetchDonorCounts();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-soft">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              Success Stories
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mt-3 mb-6">
              Completed Donations
            </h1>
            <p className="text-muted-foreground text-lg">
              These campaigns have successfully reached their goals thanks to the 
              generosity of donors like you. Every contribution made a difference.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Completed Campaigns Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : completedCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No Completed Campaigns Yet
              </h3>
              <p className="text-muted-foreground">
                Check back later as more campaigns reach their goals.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {completedCampaigns.map((campaign, index) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Link to={`/completed-donations/${campaign.id}`}>
                    <div className="bg-card rounded-2xl overflow-hidden shadow-md border border-border/50 relative hover:shadow-lg transition-shadow cursor-pointer">
                      {/* Success Badge */}
                      <div className="absolute top-4 right-4 z-10">
                        <div className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Completed
                        </div>
                      </div>

                      {/* Image */}
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={campaign.image_url || "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800"}
                          alt={campaign.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                            {campaign.category}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <h3 className="text-lg font-display font-bold text-foreground mb-2 line-clamp-2">
                          {campaign.title}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          {campaign.description}
                        </p>

                        {/* Progress */}
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-semibold text-green-600">
                              {formatCurrency(Number(campaign.amount_raised))} raised
                            </span>
                            <span className="text-muted-foreground">
                              of {formatCurrency(Number(campaign.goal_amount))}
                            </span>
                          </div>
                          <Progress
                            value={100}
                            className="h-2 [&>div]:bg-green-500"
                          />
                        </div>

                        {/* Meta */}
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Target className="w-4 h-4 text-green-500" />
                            <span className="text-green-600 font-medium">Goal Reached!</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{donorCounts[campaign.id] || 0} donors</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CompletedDonations;
