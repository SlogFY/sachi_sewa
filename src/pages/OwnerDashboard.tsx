import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Crown,
  Users,
  IndianRupee,
  TrendingUp,
  Activity,
  Shield,
  Database,
  Settings,
  BarChart3,
  PieChart,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";

interface DonationTrend {
  date: string;
  amount: number;
  count: number;
}

interface CampaignStats {
  total: number;
  live: number;
  pending: number;
  completed: number;
  draft: number;
}

interface UserStats {
  totalUsers: number;
  admins: number;
  newUsersThisMonth: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  
  // Analytics data
  const [totalDonations, setTotalDonations] = useState(0);
  const [totalMonthlyDonations, setTotalMonthlyDonations] = useState(0);
  const [donationTrends, setDonationTrends] = useState<DonationTrend[]>([]);
  const [campaignStats, setCampaignStats] = useState<CampaignStats>({
    total: 0,
    live: 0,
    pending: 0,
    completed: 0,
    draft: 0,
  });
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    admins: 0,
    newUsersThisMonth: 0,
  });
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [topCampaigns, setTopCampaigns] = useState<any[]>([]);

  useEffect(() => {
    checkOwnerAccess();
  }, []);

  const checkOwnerAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "owner")
      .maybeSingle();

    if (!roleData) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the Owner Dashboard",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    setIsOwner(true);
    await fetchAllData();
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchDonationStats(),
        fetchCampaignStats(),
        fetchUserStats(),
        fetchDonationTrends(),
        fetchCategoryBreakdown(),
        fetchRecentActivity(),
        fetchTopCampaigns(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast({
      title: "Data Refreshed",
      description: "Dashboard data has been updated",
    });
  };

  const fetchDonationStats = async () => {
    const { data: donations } = await supabase
      .from("donations")
      .select("amount");
    
    const { data: monthlyDonations } = await supabase
      .from("monthly_donations")
      .select("amount");

    const totalDonation = donations?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
    const totalMonthly = monthlyDonations?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
    
    setTotalDonations(totalDonation);
    setTotalMonthlyDonations(totalMonthly);
  };

  const fetchCampaignStats = async () => {
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("status, is_active, goal_amount, amount_raised");

    if (campaigns) {
      const stats: CampaignStats = {
        total: campaigns.length,
        live: campaigns.filter(c => c.status === "live" && c.is_active).length,
        pending: campaigns.filter(c => c.status === "pending").length,
        completed: campaigns.filter(c => c.amount_raised >= c.goal_amount || !c.is_active).length,
        draft: campaigns.filter(c => c.status === "draft").length,
      };
      setCampaignStats(stats);
    }
  };

  const fetchUserStats = async () => {
    const { data: profiles, count: profileCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact" });

    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("role")
      .in("role", ["admin", "owner"]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsers = profiles?.filter(p => 
      new Date(p.created_at) >= thirtyDaysAgo
    ).length || 0;

    setUserStats({
      totalUsers: profileCount || 0,
      admins: adminRoles?.length || 0,
      newUsersThisMonth: newUsers,
    });
  };

  const fetchDonationTrends = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: donations } = await supabase
      .from("donations")
      .select("amount, created_at")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true });

    if (donations) {
      const trendMap = new Map<string, { amount: number; count: number }>();
      
      donations.forEach(d => {
        const date = new Date(d.created_at).toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
        });
        const existing = trendMap.get(date) || { amount: 0, count: 0 };
        trendMap.set(date, {
          amount: existing.amount + Number(d.amount),
          count: existing.count + 1,
        });
      });

      const trends: DonationTrend[] = Array.from(trendMap.entries()).map(([date, data]) => ({
        date,
        amount: data.amount,
        count: data.count,
      }));

      setDonationTrends(trends);
    }
  };

  const fetchCategoryBreakdown = async () => {
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("category, amount_raised");

    if (campaigns) {
      const categoryMap = new Map<string, number>();
      campaigns.forEach(c => {
        const existing = categoryMap.get(c.category) || 0;
        categoryMap.set(c.category, existing + Number(c.amount_raised));
      });

      const data: CategoryData[] = Array.from(categoryMap.entries())
        .map(([name, value], index) => ({
          name,
          value,
          color: COLORS[index % COLORS.length],
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      setCategoryData(data);
    }
  };

  const fetchRecentActivity = async () => {
    const { data: donations } = await supabase
      .from("donations")
      .select("id, donor_name, amount, created_at, campaign_id")
      .order("created_at", { ascending: false })
      .limit(10);

    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("id, title, status, created_at, submitted_at")
      .order("created_at", { ascending: false })
      .limit(5);

    const activities: any[] = [];

    donations?.forEach(d => {
      activities.push({
        type: "donation",
        message: `${d.donor_name} donated ₹${Number(d.amount).toLocaleString("en-IN")}`,
        time: d.created_at,
        icon: IndianRupee,
      });
    });

    campaigns?.forEach(c => {
      if (c.status === "pending") {
        activities.push({
          type: "campaign",
          message: `New campaign "${c.title}" pending approval`,
          time: c.submitted_at || c.created_at,
          icon: Clock,
        });
      } else if (c.status === "live") {
        activities.push({
          type: "campaign",
          message: `Campaign "${c.title}" is now live`,
          time: c.created_at,
          icon: CheckCircle,
        });
      }
    });

    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setRecentActivity(activities.slice(0, 10));
  };

  const fetchTopCampaigns = async () => {
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("id, title, goal_amount, amount_raised, category, status")
      .eq("status", "live")
      .order("amount_raised", { ascending: false })
      .limit(5);

    setTopCampaigns(campaigns || []);
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // CSV Export Functions
  const convertToCSV = (data: any[], headers: string[]) => {
    const headerRow = headers.join(",");
    const rows = data.map(item => 
      headers.map(header => {
        const value = item[header];
        // Escape quotes and wrap in quotes if contains comma or quote
        if (value === null || value === undefined) return "";
        const stringValue = String(value);
        if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(",")
    );
    return [headerRow, ...rows].join("\n");
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportDonations = async () => {
    setExporting("donations");
    try {
      const { data: donations, error } = await supabase
        .from("donations")
        .select("id, donor_name, donor_email, donor_phone, amount, receipt_number, message, created_at, campaign_id")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const headers = ["id", "donor_name", "donor_email", "donor_phone", "amount", "receipt_number", "message", "created_at", "campaign_id"];
      const csvContent = convertToCSV(donations || [], headers);
      const date = new Date().toISOString().split("T")[0];
      downloadCSV(csvContent, `donations_export_${date}.csv`);
      
      toast({
        title: "Export Successful",
        description: `Exported ${donations?.length || 0} donations to CSV`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export donations data",
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  const exportMonthlyDonations = async () => {
    setExporting("monthly");
    try {
      const { data: donations, error } = await supabase
        .from("monthly_donations")
        .select("id, donor_name, donor_email, donor_phone, amount, plan_id, plan_name, receipt_number, is_indian_citizen, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const headers = ["id", "donor_name", "donor_email", "donor_phone", "amount", "plan_id", "plan_name", "receipt_number", "is_indian_citizen", "created_at"];
      const csvContent = convertToCSV(donations || [], headers);
      const date = new Date().toISOString().split("T")[0];
      downloadCSV(csvContent, `monthly_donations_export_${date}.csv`);
      
      toast({
        title: "Export Successful",
        description: `Exported ${donations?.length || 0} monthly donations to CSV`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export monthly donations data",
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  const exportCampaigns = async () => {
    setExporting("campaigns");
    try {
      const { data: campaigns, error } = await supabase
        .from("campaigns")
        .select("id, title, description, category, goal_amount, amount_raised, status, is_active, created_at, deadline, approved_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const headers = ["id", "title", "description", "category", "goal_amount", "amount_raised", "status", "is_active", "created_at", "deadline", "approved_at"];
      const csvContent = convertToCSV(campaigns || [], headers);
      const date = new Date().toISOString().split("T")[0];
      downloadCSV(csvContent, `campaigns_export_${date}.csv`);
      
      toast({
        title: "Export Successful",
        description: `Exported ${campaigns?.length || 0} campaigns to CSV`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export campaigns data",
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  const exportUsers = async () => {
    setExporting("users");
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, email, phone, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const headers = ["id", "user_id", "full_name", "email", "phone", "created_at", "updated_at"];
      const csvContent = convertToCSV(profiles || [], headers);
      const date = new Date().toISOString().split("T")[0];
      downloadCSV(csvContent, `users_export_${date}.csv`);
      
      toast({
        title: "Export Successful",
        description: `Exported ${profiles?.length || 0} users to CSV`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export users data",
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  const exportFundraiserRequests = async () => {
    setExporting("requests");
    try {
      const { data: requests, error } = await supabase
        .from("fundraiser_requests")
        .select("id, requester_name, requester_email, requester_phone, title, description, category, goal_amount, status, admin_notes, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const headers = ["id", "requester_name", "requester_email", "requester_phone", "title", "description", "category", "goal_amount", "status", "admin_notes", "created_at"];
      const csvContent = convertToCSV(requests || [], headers);
      const date = new Date().toISOString().split("T")[0];
      downloadCSV(csvContent, `fundraiser_requests_export_${date}.csv`);
      
      toast({
        title: "Export Successful",
        description: `Exported ${requests?.length || 0} fundraiser requests to CSV`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export fundraiser requests data",
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
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

  if (!isOwner) {
    return null;
  }

  const totalRevenue = totalDonations + totalMonthlyDonations;
  const campaignSuccessRate = campaignStats.total > 0 
    ? Math.round((campaignStats.completed / campaignStats.total) * 100) 
    : 0;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-8 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                <Crown className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                  Owner Dashboard
                </h1>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Master Admin Controls & Analytics
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-fit"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Main Stats */}
      <section className="py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-3xl font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
                      <div className="flex items-center gap-1 mt-1 text-green-600">
                        <ArrowUpRight className="w-4 h-4" />
                        <span className="text-xs">All time</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <IndianRupee className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <p className="text-3xl font-bold text-foreground">{userStats.totalUsers}</p>
                      <div className="flex items-center gap-1 mt-1 text-green-600">
                        <ArrowUpRight className="w-4 h-4" />
                        <span className="text-xs">+{userStats.newUsersThisMonth} this month</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-accent" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Campaigns</p>
                      <p className="text-3xl font-bold text-foreground">{campaignStats.live}</p>
                      <div className="flex items-center gap-1 mt-1 text-amber-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs">{campaignStats.pending} pending</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Target className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                      <p className="text-3xl font-bold text-foreground">{campaignSuccessRate}%</p>
                      <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                        <Activity className="w-4 h-4" />
                        <span className="text-xs">{campaignStats.completed} completed</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Charts Section */}
      <section className="py-6">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="trends" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
              <TabsTrigger value="trends" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Trends
              </TabsTrigger>
              <TabsTrigger value="breakdown" className="flex items-center gap-2">
                <PieChart className="w-4 h-4" />
                Breakdown
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Activity
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trends" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Donation Trends (Last 30 Days)
                    </CardTitle>
                    <CardDescription>Daily donation amounts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {donationTrends.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={donationTrends}>
                            <defs>
                              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="date" className="text-xs" />
                            <YAxis tickFormatter={(v) => formatCurrency(v)} className="text-xs" />
                            <Tooltip
                              formatter={(value: number) => [formatCurrency(value), "Amount"]}
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="amount"
                              stroke="hsl(var(--primary))"
                              fillOpacity={1}
                              fill="url(#colorAmount)"
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          No donation data available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-accent" />
                      Donation Count
                    </CardTitle>
                    <CardDescription>Number of donations per day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {donationTrends.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={donationTrends}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="date" className="text-xs" />
                            <YAxis className="text-xs" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                              }}
                            />
                            <Bar dataKey="count" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          No donation data available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="breakdown" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-primary" />
                      Donations by Category
                    </CardTitle>
                    <CardDescription>Amount raised per category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPie>
                            <Pie
                              data={categoryData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => [formatCurrency(value), "Raised"]}
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                              }}
                            />
                          </RechartsPie>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          No category data available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-accent" />
                      Campaign Status Overview
                    </CardTitle>
                    <CardDescription>Distribution of campaigns by status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            Live
                          </span>
                          <span className="font-medium">{campaignStats.live}</span>
                        </div>
                        <Progress value={(campaignStats.live / Math.max(campaignStats.total, 1)) * 100} className="h-2 bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500" />
                            Pending
                          </span>
                          <span className="font-medium">{campaignStats.pending}</span>
                        </div>
                        <Progress value={(campaignStats.pending / Math.max(campaignStats.total, 1)) * 100} className="h-2 bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            Completed
                          </span>
                          <span className="font-medium">{campaignStats.completed}</span>
                        </div>
                        <Progress value={(campaignStats.completed / Math.max(campaignStats.total, 1)) * 100} className="h-2 bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gray-400" />
                            Draft
                          </span>
                          <span className="font-medium">{campaignStats.draft}</span>
                        </div>
                        <Progress value={(campaignStats.draft / Math.max(campaignStats.total, 1)) * 100} className="h-2 bg-muted" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>Latest donations and campaign updates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                      {recentActivity.length > 0 ? (
                        recentActivity.map((activity, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              activity.type === "donation" 
                                ? "bg-green-500/20" 
                                : "bg-blue-500/20"
                            }`}>
                              <activity.icon className={`w-4 h-4 ${
                                activity.type === "donation" 
                                  ? "text-green-600" 
                                  : "text-blue-600"
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground truncate">{activity.message}</p>
                              <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.time)}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No recent activity
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-accent" />
                      Top Performing Campaigns
                    </CardTitle>
                    <CardDescription>Campaigns with highest funds raised</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {topCampaigns.length > 0 ? (
                        topCampaigns.map((campaign, index) => (
                          <div key={campaign.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                  {index + 1}
                                </span>
                                <span className="font-medium text-sm truncate max-w-[200px]">
                                  {campaign.title}
                                </span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {campaign.category}
                              </Badge>
                            </div>
                            <Progress
                              value={(campaign.amount_raised / campaign.goal_amount) * 100}
                              className="h-2"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{formatCurrency(campaign.amount_raised)} raised</span>
                              <span>{Math.round((campaign.amount_raised / campaign.goal_amount) * 100)}% of {formatCurrency(campaign.goal_amount)}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No active campaigns
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="export" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-primary" />
                    Data Export
                  </CardTitle>
                  <CardDescription>
                    Export your platform data to CSV format for analysis, reporting, or backup purposes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Donations Export */}
                    <div className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                          <IndianRupee className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">One-time Donations</h4>
                          <p className="text-xs text-muted-foreground">All donation records</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Export donor names, emails, amounts, receipts, and campaign associations.
                      </p>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={exportDonations}
                        disabled={exporting === "donations"}
                      >
                        {exporting === "donations" ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        Export Donations
                      </Button>
                    </div>

                    {/* Monthly Donations Export */}
                    <div className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">Monthly Donations</h4>
                          <p className="text-xs text-muted-foreground">Recurring subscriptions</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Export monthly donor details, plan information, and subscription data.
                      </p>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={exportMonthlyDonations}
                        disabled={exporting === "monthly"}
                      >
                        {exporting === "monthly" ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        Export Monthly
                      </Button>
                    </div>

                    {/* Campaigns Export */}
                    <div className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <Target className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">Campaigns</h4>
                          <p className="text-xs text-muted-foreground">All campaign data</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Export campaign titles, goals, amounts raised, status, and dates.
                      </p>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={exportCampaigns}
                        disabled={exporting === "campaigns"}
                      >
                        {exporting === "campaigns" ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        Export Campaigns
                      </Button>
                    </div>

                    {/* Users Export */}
                    <div className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">Users</h4>
                          <p className="text-xs text-muted-foreground">User profiles</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Export user names, emails, phone numbers, and registration dates.
                      </p>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={exportUsers}
                        disabled={exporting === "users"}
                      >
                        {exporting === "users" ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        Export Users
                      </Button>
                    </div>

                    {/* Fundraiser Requests Export */}
                    <div className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                          <FileSpreadsheet className="w-5 h-5 text-pink-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">Fundraiser Requests</h4>
                          <p className="text-xs text-muted-foreground">Submitted requests</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Export all fundraiser requests with status and admin notes.
                      </p>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={exportFundraiserRequests}
                        disabled={exporting === "requests"}
                      >
                        {exporting === "requests" ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        Export Requests
                      </Button>
                    </div>
                  </div>

                  <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-foreground text-sm">Data Privacy Notice</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Exported data contains personal information. Handle with care and in compliance with 
                          applicable data protection regulations. Do not share exported files without proper authorization.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* System Status */}
      <section className="py-6 pb-12">
        <div className="container mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                System Overview
              </CardTitle>
              <CardDescription>Platform health and configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-sm">Database</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Healthy</p>
                </div>
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-sm">Authentication</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-sm">Storage</span>
                  </div>
                  <p className="text-xs text-muted-foreground">1 bucket active</p>
                </div>
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <span className="font-medium text-sm">Admins</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{userStats.admins} configured</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default OwnerDashboard;
