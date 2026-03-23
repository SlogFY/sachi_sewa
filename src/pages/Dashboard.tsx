import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Heart, 
  TrendingUp, 
  IndianRupee, 
  Calendar, 
  Target,
  Loader2,
  Receipt,
  ArrowRight,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Donation {
  id: string;
  amount: number;
  receipt_number: string;
  created_at: string;
  campaign_id: string;
  campaigns: {
    title: string;
    goal_amount: number;
    amount_raised: number;
    image_url: string | null;
  };
}

interface MonthlyDonation {
  id: string;
  amount: number;
  plan_name: string;
  receipt_number: string;
  created_at: string;
}

interface SupportedCampaign {
  id: string;
  title: string;
  goal_amount: number;
  amount_raised: number;
  image_url: string | null;
  total_donated: number;
  donation_count: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [monthlyDonations, setMonthlyDonations] = useState<MonthlyDonation[]>([]);
  const [supportedCampaigns, setSupportedCampaigns] = useState<SupportedCampaign[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "donations" | "campaigns" | "notifications">("overview");

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
    await fetchDashboardData(session.user.id);
  };

  const fetchDashboardData = async (userId: string) => {
    setIsLoading(true);
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      setProfile(profileData);

      // Fetch donations with campaign info
      const { data: donationsData } = await supabase
        .from("donations")
        .select(`
          id,
          amount,
          receipt_number,
          created_at,
          campaign_id,
          campaigns!fk_donations_campaign (
            title,
            goal_amount,
            amount_raised,
            image_url
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setDonations((donationsData as any) || []);

      // Fetch monthly donations
      const { data: monthlyData } = await supabase
        .from("monthly_donations")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setMonthlyDonations(monthlyData || []);

      // Fetch notifications
      const { data: notificationsData } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      setNotifications(notificationsData || []);

      // Calculate supported campaigns with aggregated donations
      if (donationsData && donationsData.length > 0) {
        const campaignMap = new Map<string, SupportedCampaign>();
        donationsData.forEach((donation: any) => {
          const campaignId = donation.campaign_id;
          const existing = campaignMap.get(campaignId);
          if (existing) {
            existing.total_donated += Number(donation.amount);
            existing.donation_count += 1;
          } else {
            campaignMap.set(campaignId, {
              id: campaignId,
              title: donation.campaigns?.title || "Unknown Campaign",
              goal_amount: donation.campaigns?.goal_amount || 0,
              amount_raised: donation.campaigns?.amount_raised || 0,
              image_url: donation.campaigns?.image_url,
              total_donated: Number(donation.amount),
              donation_count: 1,
            });
          }
        });
        setSupportedCampaigns(Array.from(campaignMap.values()));
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);
    
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
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

  const totalDonated = donations.reduce((sum, d) => sum + Number(d.amount), 0) +
    monthlyDonations.reduce((sum, d) => sum + Number(d.amount), 0);
  const totalCampaignsSupported = supportedCampaigns.length;
  const averageDonation = donations.length > 0 ? totalDonated / (donations.length + monthlyDonations.length) : 0;
  const unreadNotifications = notifications.filter(n => !n.is_read).length;

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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
          >
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
              Welcome back, {profile?.full_name || user?.email?.split("@")[0] || "Donor"}! 👋
            </h1>
            <p className="text-muted-foreground text-lg">
              Track your donations and see the impact you're making
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-xl p-6 border border-border"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <IndianRupee className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Total Donated</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(totalDonated)}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-xl p-6 border border-border"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Target className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Campaigns Supported</p>
                  <p className="text-2xl font-bold text-foreground">{totalCampaignsSupported}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-xl p-6 border border-border"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-pink-500" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Avg. Donation</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(averageDonation)}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card rounded-xl p-6 border border-border relative"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Notifications</p>
                  <p className="text-2xl font-bold text-foreground">{unreadNotifications}</p>
                </div>
              </div>
              {unreadNotifications > 0 && (
                <span className="absolute top-4 right-4 w-3 h-3 bg-destructive rounded-full animate-pulse" />
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={activeTab === "overview" ? "primary" : "outline"}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </Button>
            <Button
              variant={activeTab === "donations" ? "primary" : "outline"}
              onClick={() => setActiveTab("donations")}
            >
              <Receipt className="w-4 h-4 mr-2" />
              Donation History
            </Button>
            <Button
              variant={activeTab === "campaigns" ? "primary" : "outline"}
              onClick={() => setActiveTab("campaigns")}
            >
              <Heart className="w-4 h-4 mr-2" />
              Supported Campaigns
            </Button>
            <Button
              variant={activeTab === "notifications" ? "primary" : "outline"}
              onClick={() => setActiveTab("notifications")}
              className="relative"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </Button>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Recent Donations */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl border border-border p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-foreground">Recent Donations</h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("donations")}>
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                {donations.length === 0 && monthlyDonations.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No donations yet</p>
                    <Button variant="primary" size="sm" className="mt-4" onClick={() => navigate("/fundraisers")}>
                      Start Giving
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {donations.slice(0, 3).map((donation) => (
                      <div key={donation.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium text-foreground text-sm">{donation.campaigns?.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(donation.created_at).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                        <p className="font-semibold text-primary">{formatCurrency(Number(donation.amount))}</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Campaign Impact */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-xl border border-border p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-foreground">Campaign Impact</h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("campaigns")}>
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                {supportedCampaigns.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No campaigns supported yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {supportedCampaigns.slice(0, 2).map((campaign) => (
                      <div key={campaign.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-foreground text-sm truncate">{campaign.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {Math.round((campaign.amount_raised / campaign.goal_amount) * 100)}%
                          </p>
                        </div>
                        <Progress value={(campaign.amount_raised / campaign.goal_amount) * 100} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Your contribution: {formatCurrency(campaign.total_donated)}</span>
                          <span>{formatCurrency(campaign.amount_raised)} / {formatCurrency(campaign.goal_amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {/* Donations Tab */}
          {activeTab === "donations" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              <div className="p-4 border-b border-border">
                <h3 className="font-display font-semibold text-foreground">All Donations</h3>
              </div>
              {donations.length === 0 && monthlyDonations.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No donation history</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {donations.map((donation) => (
                    <div key={donation.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Heart className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{donation.campaigns?.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(donation.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                            <span>•</span>
                            <span className="font-mono">{donation.receipt_number}</span>
                          </div>
                        </div>
                      </div>
                      <p className="font-bold text-primary">{formatCurrency(Number(donation.amount))}</p>
                    </div>
                  ))}
                  {monthlyDonations.map((donation) => (
                    <div key={donation.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-pink-500" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{donation.plan_name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(donation.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                            <span>•</span>
                            <span className="font-mono">{donation.receipt_number}</span>
                            <span>•</span>
                            <span className="text-pink-500">Monthly</span>
                          </div>
                        </div>
                      </div>
                      <p className="font-bold text-pink-500">{formatCurrency(Number(donation.amount))}/mo</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Campaigns Tab */}
          {activeTab === "campaigns" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {supportedCampaigns.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-card rounded-xl border border-border">
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">You haven't supported any campaigns yet</p>
                  <Button variant="primary" className="mt-4" onClick={() => navigate("/fundraisers")}>
                    Explore Campaigns
                  </Button>
                </div>
              ) : (
                supportedCampaigns.map((campaign) => (
                  <div key={campaign.id} className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="h-32 bg-gradient-soft relative">
                      {campaign.image_url && (
                        <img 
                          src={campaign.image_url} 
                          alt={campaign.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-white font-medium text-sm truncate">{campaign.title}</p>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Your Contribution</span>
                        <span className="font-semibold text-primary">{formatCurrency(campaign.total_donated)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Donations Made</span>
                        <span className="font-semibold text-foreground">{campaign.donation_count}x</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Campaign Progress</span>
                          <span>{Math.round((campaign.amount_raised / campaign.goal_amount) * 100)}%</span>
                        </div>
                        <Progress value={(campaign.amount_raised / campaign.goal_amount) * 100} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatCurrency(campaign.amount_raised)}</span>
                          <span>{formatCurrency(campaign.goal_amount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              <div className="p-4 border-b border-border">
                <h3 className="font-display font-semibold text-foreground">Notifications</h3>
              </div>
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 flex items-start gap-4 hover:bg-muted/30 transition-colors cursor-pointer ${
                        !notification.is_read ? "bg-primary/5" : ""
                      }`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        notification.type === "donation" ? "bg-primary/10" :
                        notification.type === "milestone" ? "bg-accent/10" :
                        notification.type === "campaign" ? "bg-pink-500/10" :
                        "bg-blue-500/10"
                      }`}>
                        {notification.type === "donation" ? (
                          <Heart className="w-5 h-5 text-primary" />
                        ) : notification.type === "milestone" ? (
                          <Target className="w-5 h-5 text-accent" />
                        ) : notification.type === "campaign" ? (
                          <TrendingUp className="w-5 h-5 text-pink-500" />
                        ) : (
                          <Bell className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{notification.title}</p>
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-primary rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notification.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Dashboard;