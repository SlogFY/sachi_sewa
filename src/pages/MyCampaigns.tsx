import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Plus, 
  Edit, 
  Eye, 
  Clock, 
  Check, 
  XCircle, 
  AlertCircle,
  Loader2,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Campaign {
  id: string;
  title: string;
  description: string;
  category: string;
  goal_amount: number;
  amount_raised: number;
  image_url: string | null;
  status: string;
  is_active: boolean;
  deadline: string | null;
  rejection_reason: string | null;
  created_at: string;
  submitted_at: string | null;
  approved_at: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground", icon: Edit },
  pending: { label: "Pending Review", color: "bg-yellow-500/10 text-yellow-600", icon: Clock },
  approved: { label: "Approved", color: "bg-green-500/10 text-green-600", icon: Check },
  rejected: { label: "Rejected", color: "bg-destructive/10 text-destructive", icon: XCircle },
  live: { label: "Live", color: "bg-primary/10 text-primary", icon: TrendingUp },
};

const MyCampaigns = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    fetchCampaigns(session.user.id);
  };

  const fetchCampaigns = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("creator_id", userId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setCampaigns((data as Campaign[]) || []);
    } catch (error: any) {
      console.error("Error fetching campaigns:", error);
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-8 bg-gradient-soft">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                My Campaigns
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage and track your fundraising campaigns
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Button variant="primary" onClick={() => navigate("/create-campaign")}>
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Campaigns List */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {campaigns.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-card rounded-xl border border-border"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-display font-semibold text-foreground mb-2">
                No campaigns yet
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first fundraising campaign and start making a difference
              </p>
              <Button variant="primary" onClick={() => navigate("/create-campaign")}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Campaign
              </Button>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign, index) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-40 bg-gradient-soft">
                    {campaign.image_url ? (
                      <img
                        src={campaign.image_url}
                        alt={campaign.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <TrendingUp className="w-12 h-12 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      {getStatusBadge(campaign.status)}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-foreground line-clamp-1">
                        {campaign.title}
                      </h3>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {campaign.category}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {campaign.description}
                    </p>

                    {campaign.status === "live" && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Raised</span>
                          <span className="font-semibold text-primary">
                            {formatCurrency(campaign.amount_raised)} / {formatCurrency(campaign.goal_amount)}
                          </span>
                        </div>
                        <Progress 
                          value={(campaign.amount_raised / campaign.goal_amount) * 100} 
                          className="h-2" 
                        />
                      </div>
                    )}

                    {campaign.status === "rejected" && campaign.rejection_reason && (
                      <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 mb-4">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-destructive">Rejection Reason</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {campaign.rejection_reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {(campaign.status === "draft" || campaign.status === "rejected") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => navigate(`/create-campaign?edit=${campaign.id}`)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      )}
                      {campaign.status === "live" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => navigate(`/fundraisers`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Live
                        </Button>
                      )}
                      {campaign.status === "pending" && (
                        <div className="flex-1 text-center py-2">
                          <p className="text-xs text-muted-foreground">
                            Under review...
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default MyCampaigns;