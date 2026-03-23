import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, LogOut, Users, IndianRupee, TrendingUp, Loader2, Clock, Check, XCircle, Heart, Eye, FileCheck, AlertTriangle, Settings, CreditCard, Receipt, Share2, HelpCircle, MessageCircleQuestion, Info, BarChart3, Image, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AdminSocialSettings from "./AdminSocialSettings";
import AdminPaymentSettings from "./AdminPaymentSettings";
import AdminTransactionLogs from "./AdminTransactionLogs";
import AdminCampaignSocialSettings from "./AdminCampaignSocialSettings";
import AdminSupportSettings from "./AdminSupportSettings";
import AdminFAQSettings from "./AdminFAQSettings";
import AdminAboutSettings from "./AdminAboutSettings";
import AdminImpactStatsSettings from "./AdminImpactStatsSettings";
import AdminWallpaperSettings from "./AdminWallpaperSettings";
import AdminManagement from "./AdminManagement";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Donation {
  id: string;
  donor_name: string;
  donor_email: string;
  amount: number;
  receipt_number: string;
  created_at: string;
  campaigns: {
    title: string;
  };
}

interface Campaign {
  id: string;
  title: string;
  description: string;
  category: string;
  goal_amount: number;
  amount_raised: number;
  is_active: boolean;
  status: string;
  creator_id: string | null;
  story: string | null;
  image_url: string | null;
  deadline: string | null;
  rejection_reason: string | null;
  submitted_at: string | null;
  created_at: string;
}

interface FundraiserRequest {
  id: string;
  requester_name: string;
  requester_email: string;
  requester_phone: string | null;
  title: string;
  description: string;
  category: string;
  goal_amount: number;
  story: string | null;
  image_url: string | null;
  video_url: string | null;
  status: string;
  created_at: string;
}

interface MonthlyDonation {
  id: string;
  donor_name: string;
  donor_email: string;
  donor_phone: string | null;
  amount: number;
  plan_id: string;
  plan_name: string;
  is_indian_citizen: boolean;
  receipt_number: string;
  created_at: string;
}

interface CreatorProfile {
  email: string | null;
  full_name: string | null;
}

const AdminPanel = ({ isOpen, onClose }: AdminPanelProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"donations" | "campaigns" | "pending" | "requests" | "monthly" | "add" | "settings" | "payments" | "transactions" | "social-share" | "support" | "faqs" | "about" | "impact-stats" | "wallpapers" | "admins">("donations");
  const [donations, setDonations] = useState<Donation[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [requests, setRequests] = useState<FundraiserRequest[]>([]);
  const [monthlyDonations, setMonthlyDonations] = useState<MonthlyDonation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    title: "",
    description: "",
    category: "",
    goal_amount: "",
    image_url: "",
  });

  const categories = ["Medical", "Education", "Animal Welfare", "Environment", "Disaster Relief", "Community"];

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch donations with campaign info
      const { data: donationsData, error: donationsError } = await supabase
        .from("donations")
        .select(`
          id,
          donor_name,
          donor_email,
          amount,
          receipt_number,
          created_at,
          campaigns!fk_donations_campaign (title)
        `)
        .order("created_at", { ascending: false });

      if (donationsError) throw donationsError;
      setDonations((donationsData as any) || []);

      // Fetch campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (campaignsError) throw campaignsError;
      setCampaigns(campaignsData || []);

      // Fetch fundraiser requests
      const { data: requestsData, error: requestsError } = await supabase
        .from("fundraiser_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (requestsError) throw requestsError;

      // Fetch monthly donations
      const { data: monthlyData, error: monthlyError } = await supabase
        .from("monthly_donations")
        .select("*")
        .order("created_at", { ascending: false });

      if (monthlyError) throw monthlyError;
      setMonthlyDonations(monthlyData || []);
      setRequests(requestsData || []);
    } catch (error: any) {
      console.error("Fetch error:", error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  };

  const handleAddCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCampaign.title || !newCampaign.description || !newCampaign.category || !newCampaign.goal_amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("campaigns")
        .insert({
          title: newCampaign.title,
          description: newCampaign.description,
          category: newCampaign.category,
          goal_amount: parseFloat(newCampaign.goal_amount),
          image_url: newCampaign.image_url || null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Campaign created successfully",
      });

      setNewCampaign({
        title: "",
        description: "",
        category: "",
        goal_amount: "",
        image_url: "",
      });
      setActiveTab("campaigns");
      fetchData();
    } catch (error: any) {
      console.error("Create campaign error:", error);
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveRequest = async (request: FundraiserRequest) => {
    try {
      // Create campaign from request
      const { error: campaignError } = await supabase
        .from("campaigns")
        .insert({
          title: request.title,
          description: request.description,
          category: request.category,
          goal_amount: request.goal_amount,
          image_url: request.image_url,
        });

      if (campaignError) throw campaignError;

      // Update request status
      const { error: updateError } = await supabase
        .from("fundraiser_requests")
        .update({ status: "approved" })
        .eq("id", request.id);

      if (updateError) throw updateError;

      toast({
        title: "Approved!",
        description: "The fundraiser is now live.",
      });
      fetchData();
    } catch (error: any) {
      console.error("Approve error:", error);
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("fundraiser_requests")
        .update({ status: "rejected" })
        .eq("id", requestId);

      if (error) throw error;

      toast({
        title: "Rejected",
        description: "The request has been rejected.",
      });
      fetchData();
    } catch (error: any) {
      console.error("Reject error:", error);
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      });
    }
  };

  // Campaign approval/rejection handlers
  const handleApproveCampaign = async (campaign: Campaign) => {
    setIsSubmitting(true);
    try {
      // Update campaign status to live
      const { error } = await supabase
        .from("campaigns")
        .update({ 
          status: "live", 
          approved_at: new Date().toISOString(),
          rejection_reason: null 
        })
        .eq("id", campaign.id);

      if (error) throw error;

      // Send notification to creator if they exist
      if (campaign.creator_id) {
        try {
          await supabase.functions.invoke("send-notification", {
            body: {
              user_id: campaign.creator_id,
              title: "Campaign Approved! 🎉",
              message: `Great news! Your campaign "${campaign.title}" has been approved and is now live. Donors can now contribute to your cause.`,
              type: "success",
              send_email: true,
              email_subject: `Your Campaign "${campaign.title}" is Now Live!`,
              related_campaign_id: campaign.id,
            },
          });
        } catch (notifError) {
          console.error("Notification error:", notifError);
        }
      }

      toast({
        title: "Campaign Approved! ✅",
        description: `"${campaign.title}" is now live and accepting donations.`,
      });
      setShowPreviewDialog(false);
      setSelectedCampaign(null);
      fetchData();
    } catch (error: any) {
      console.error("Approve campaign error:", error);
      toast({
        title: "Error",
        description: "Failed to approve campaign",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectCampaign = async () => {
    if (!selectedCampaign || !rejectionReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Update campaign status to rejected
      const { error } = await supabase
        .from("campaigns")
        .update({ 
          status: "rejected", 
          rejection_reason: rejectionReason.trim() 
        })
        .eq("id", selectedCampaign.id);

      if (error) throw error;

      // Send notification to creator if they exist
      if (selectedCampaign.creator_id) {
        try {
          await supabase.functions.invoke("send-notification", {
            body: {
              user_id: selectedCampaign.creator_id,
              title: "Campaign Needs Revision",
              message: `Your campaign "${selectedCampaign.title}" needs some changes before it can go live. Reason: ${rejectionReason.trim()}. Please update your campaign and resubmit.`,
              type: "warning",
              send_email: true,
              email_subject: `Action Required: Your Campaign "${selectedCampaign.title}"`,
              related_campaign_id: selectedCampaign.id,
            },
          });
        } catch (notifError) {
          console.error("Notification error:", notifError);
        }
      }

      toast({
        title: "Campaign Rejected",
        description: "The creator has been notified with your feedback.",
      });
      setShowRejectDialog(false);
      setShowPreviewDialog(false);
      setSelectedCampaign(null);
      setRejectionReason("");
      fetchData();
    } catch (error: any) {
      console.error("Reject campaign error:", error);
      toast({
        title: "Error",
        description: "Failed to reject campaign",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      draft: { variant: "secondary", label: "Draft" },
      pending: { variant: "outline", label: "Pending Review" },
      live: { variant: "default", label: "Live" },
      rejected: { variant: "destructive", label: "Rejected" },
    };
    const config = statusConfig[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const pendingRequests = requests.filter(r => r.status === "pending");
  const pendingCampaigns = campaigns.filter(c => c.status === "pending");
  const liveCampaigns = campaigns.filter(c => c.status === "live");
  const totalDonations = donations.reduce((sum, d) => sum + Number(d.amount), 0);
  const totalMonthlyDonations = monthlyDonations.reduce((sum, d) => sum + Number(d.amount), 0);
  const totalCampaigns = liveCampaigns.length;
  const totalDonors = new Set([...donations.map(d => d.donor_email), ...monthlyDonations.map(d => d.donor_email)]).size;

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background flex flex-col"
        >
          {/* Header */}
          <div className="bg-card border-b border-border shrink-0">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <h1 className="text-2xl font-display font-bold text-foreground">Admin Panel</h1>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-card rounded-xl p-6 border border-border">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <IndianRupee className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">One-Time Donations</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(totalDonations)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl p-6 border border-border">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-pink-500" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Monthly Pledges</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(totalMonthlyDonations)}/mo</p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl p-6 border border-border">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Active Campaigns</p>
                    <p className="text-2xl font-bold text-foreground">{totalCampaigns}</p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl p-6 border border-border">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Total Donors</p>
                    <p className="text-2xl font-bold text-foreground">{totalDonors}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant={activeTab === "donations" ? "primary" : "outline"}
                onClick={() => setActiveTab("donations")}
              >
                Donations
              </Button>
              <Button
                variant={activeTab === "campaigns" ? "primary" : "outline"}
                onClick={() => setActiveTab("campaigns")}
              >
                Campaigns
              </Button>
              <Button
                variant={activeTab === "pending" ? "primary" : "outline"}
                onClick={() => setActiveTab("pending")}
                className="relative"
              >
                <FileCheck className="w-4 h-4 mr-2" />
                Pending Campaigns
                {pendingCampaigns.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
                    {pendingCampaigns.length}
                  </span>
                )}
              </Button>
              <Button
                variant={activeTab === "monthly" ? "primary" : "outline"}
                onClick={() => setActiveTab("monthly")}
              >
                <Heart className="w-4 h-4 mr-2" />
                Monthly Donations
              </Button>
              <Button
                variant={activeTab === "requests" ? "primary" : "outline"}
                onClick={() => setActiveTab("requests")}
                className="relative"
              >
                <Clock className="w-4 h-4 mr-2" />
                Pending Requests
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                    {pendingRequests.length}
                  </span>
                )}
              </Button>
              <Button
                variant={activeTab === "add" ? "primary" : "outline"}
                onClick={() => setActiveTab("add")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Campaign
              </Button>
              <Button
                variant={activeTab === "transactions" ? "primary" : "outline"}
                onClick={() => setActiveTab("transactions")}
              >
                <Receipt className="w-4 h-4 mr-2" />
                Transaction Logs
              </Button>
              <Button
                variant={activeTab === "payments" ? "primary" : "outline"}
                onClick={() => setActiveTab("payments")}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Payment Gateway
              </Button>
              <Button
                variant={activeTab === "social-share" ? "primary" : "outline"}
                onClick={() => setActiveTab("social-share")}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Settings
              </Button>
              <Button
                variant={activeTab === "settings" ? "primary" : "outline"}
                onClick={() => setActiveTab("settings")}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button
                variant={activeTab === "support" ? "primary" : "outline"}
                onClick={() => setActiveTab("support")}
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Support
              </Button>
              <Button
                variant={activeTab === "faqs" ? "primary" : "outline"}
                onClick={() => setActiveTab("faqs")}
              >
                <MessageCircleQuestion className="w-4 h-4 mr-2" />
                FAQs
              </Button>
              <Button
                variant={activeTab === "about" ? "primary" : "outline"}
                onClick={() => setActiveTab("about")}
              >
                <Info className="w-4 h-4 mr-2" />
                About Us
              </Button>
              <Button
                variant={activeTab === "impact-stats" ? "primary" : "outline"}
                onClick={() => setActiveTab("impact-stats")}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Impact Stats
              </Button>
              <Button
                variant={activeTab === "wallpapers" ? "primary" : "outline"}
                onClick={() => setActiveTab("wallpapers")}
              >
                <Image className="w-4 h-4 mr-2" />
                Wallpapers
              </Button>
              <Button
                variant={activeTab === "admins" ? "primary" : "outline"}
                onClick={() => setActiveTab("admins")}
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Manage Admins
              </Button>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <>
                {activeTab === "donations" && (
                  <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Donor Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Campaign</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Receipt No</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {donations.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No donations yet
                            </TableCell>
                          </TableRow>
                        ) : (
                          donations.map((donation) => (
                            <TableRow key={donation.id}>
                              <TableCell className="font-medium">{donation.donor_name}</TableCell>
                              <TableCell>{donation.donor_email}</TableCell>
                              <TableCell className="max-w-[200px] truncate">{donation.campaigns?.title}</TableCell>
                              <TableCell className="text-primary font-semibold">
                                {formatCurrency(Number(donation.amount))}
                              </TableCell>
                              <TableCell className="font-mono text-sm">{donation.receipt_number}</TableCell>
                              <TableCell>
                                {new Date(donation.created_at).toLocaleDateString("en-IN")}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {activeTab === "campaigns" && (
                  <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Goal</TableHead>
                          <TableHead>Raised</TableHead>
                          <TableHead>Progress</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaigns.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              No campaigns yet
                            </TableCell>
                          </TableRow>
                        ) : (
                          campaigns.map((campaign) => (
                            <TableRow key={campaign.id}>
                              <TableCell className="font-medium max-w-[200px] truncate">{campaign.title}</TableCell>
                              <TableCell>{campaign.category}</TableCell>
                              <TableCell>{formatCurrency(Number(campaign.goal_amount))}</TableCell>
                              <TableCell className="text-primary font-semibold">
                                {formatCurrency(Number(campaign.amount_raised))}
                              </TableCell>
                              <TableCell>
                                {((Number(campaign.amount_raised) / Number(campaign.goal_amount)) * 100).toFixed(1)}%
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(campaign.status)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCampaign(campaign);
                                    setShowPreviewDialog(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {activeTab === "pending" && (
                  <div className="space-y-4">
                    {pendingCampaigns.length === 0 ? (
                      <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground">
                        <FileCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No pending campaigns to review</p>
                      </div>
                    ) : (
                      pendingCampaigns.map((campaign) => (
                        <div key={campaign.id} className="bg-card rounded-xl border border-border p-6">
                          <div className="flex flex-col md:flex-row gap-6">
                            {campaign.image_url && (
                              <img 
                                src={campaign.image_url} 
                                alt={campaign.title}
                                className="w-full md:w-48 h-32 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h3 className="text-lg font-semibold text-foreground">{campaign.title}</h3>
                                  <p className="text-sm text-muted-foreground mt-1">{campaign.category}</p>
                                </div>
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                                  Pending Review
                                </Badge>
                              </div>
                              <p className="text-muted-foreground mt-3 line-clamp-2">{campaign.description}</p>
                              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
                                <span className="text-foreground font-medium">
                                  Goal: {formatCurrency(Number(campaign.goal_amount))}
                                </span>
                                {campaign.deadline && (
                                  <span className="text-muted-foreground">
                                    Deadline: {new Date(campaign.deadline).toLocaleDateString("en-IN")}
                                  </span>
                                )}
                                {campaign.submitted_at && (
                                  <span className="text-muted-foreground">
                                    Submitted: {new Date(campaign.submitted_at).toLocaleDateString("en-IN")}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2 mt-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCampaign(campaign);
                                    setShowPreviewDialog(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Review Details
                                </Button>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleApproveCampaign(campaign)}
                                  disabled={isSubmitting}
                                >
                                  <Check className="w-4 h-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCampaign(campaign);
                                    setShowRejectDialog(true);
                                  }}
                                  disabled={isSubmitting}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "monthly" && (
                  <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Donor Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Amount/Mo</TableHead>
                          <TableHead>Receipt No</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {monthlyDonations.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No monthly donations yet
                            </TableCell>
                          </TableRow>
                        ) : (
                          monthlyDonations.map((donation) => (
                            <TableRow key={donation.id}>
                              <TableCell className="font-medium">{donation.donor_name}</TableCell>
                              <TableCell>{donation.donor_email}</TableCell>
                              <TableCell className="max-w-[200px] truncate">{donation.plan_name}</TableCell>
                              <TableCell className="text-pink-500 font-semibold">
                                {formatCurrency(Number(donation.amount))}/mo
                              </TableCell>
                              <TableCell className="font-mono text-sm">{donation.receipt_number}</TableCell>
                              <TableCell>
                                {new Date(donation.created_at).toLocaleDateString("en-IN")}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {activeTab === "requests" && (
                  <div className="space-y-4">
                    {requests.length === 0 ? (
                      <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground">
                        No fundraiser requests yet
                      </div>
                    ) : (
                      requests.map((request) => (
                        <div
                          key={request.id}
                          className="bg-card rounded-xl border border-border p-6"
                        >
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  request.status === "pending"
                                    ? "bg-yellow-500/10 text-yellow-600"
                                    : request.status === "approved"
                                    ? "bg-primary/10 text-primary"
                                    : "bg-destructive/10 text-destructive"
                                }`}>
                                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(request.created_at).toLocaleDateString("en-IN")}
                                </span>
                              </div>
                              <h3 className="text-lg font-display font-bold text-foreground mb-1">
                                {request.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                {request.description}
                              </p>
                              <div className="flex flex-wrap gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Requester:</span>{" "}
                                  <span className="font-medium text-foreground">{request.requester_name}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Email:</span>{" "}
                                  <span className="text-foreground">{request.requester_email}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Category:</span>{" "}
                                  <span className="text-foreground">{request.category}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Goal:</span>{" "}
                                  <span className="font-semibold text-primary">{formatCurrency(Number(request.goal_amount))}</span>
                                </div>
                              </div>
                              {request.image_url && (
                                <div className="mt-3">
                                  <img
                                    src={request.image_url}
                                    alt={request.title}
                                    className="w-32 h-24 object-cover rounded-lg"
                                  />
                                </div>
                              )}
                            </div>
                            {request.status === "pending" && (
                              <div className="flex gap-2 shrink-0">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleApproveRequest(request)}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleRejectRequest(request.id)}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "add" && (
                  <div className="bg-card rounded-xl border border-border p-6 max-w-2xl">
                    <h2 className="text-xl font-display font-bold text-foreground mb-6">Create New Campaign</h2>
                    <form onSubmit={handleAddCampaign} className="space-y-5">
                      <div>
                        <Label htmlFor="title" className="text-foreground">Campaign Title *</Label>
                        <Input
                          id="title"
                          placeholder="Enter campaign title"
                          value={newCampaign.title}
                          onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                          className="mt-1"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="description" className="text-foreground">Description *</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe your campaign..."
                          value={newCampaign.description}
                          onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                          className="mt-1"
                          rows={4}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <Label htmlFor="category" className="text-foreground">Category *</Label>
                          <Select
                            value={newCampaign.category}
                            onValueChange={(value) => setNewCampaign({ ...newCampaign, category: value })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="goal" className="text-foreground">Goal Amount (₹) *</Label>
                          <Input
                            id="goal"
                            type="number"
                            placeholder="Enter goal amount"
                            value={newCampaign.goal_amount}
                            onChange={(e) => setNewCampaign({ ...newCampaign, goal_amount: e.target.value })}
                            className="mt-1"
                            min="1"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="image" className="text-foreground">Image URL (Optional)</Label>
                        <Input
                          id="image"
                          type="url"
                          placeholder="https://example.com/image.jpg"
                          value={newCampaign.image_url}
                          onChange={(e) => setNewCampaign({ ...newCampaign, image_url: e.target.value })}
                          className="mt-1"
                        />
                      </div>

                      <Button type="submit" variant="primary" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Campaign
                          </>
                        )}
                      </Button>
                    </form>
                  </div>
                )}

                {activeTab === "transactions" && (
                  <AdminTransactionLogs />
                )}

                {activeTab === "payments" && (
                  <AdminPaymentSettings />
                )}

                {activeTab === "settings" && (
                  <AdminSocialSettings />
                )}

                {activeTab === "social-share" && (
                  <AdminCampaignSocialSettings />
                )}

                {activeTab === "support" && (
                  <AdminSupportSettings />
                )}

                {activeTab === "faqs" && (
                  <AdminFAQSettings />
                )}

                {activeTab === "about" && (
                  <AdminAboutSettings />
                )}

                {activeTab === "impact-stats" && (
                  <AdminImpactStatsSettings />
                )}

                {activeTab === "wallpapers" && (
                  <AdminWallpaperSettings />
                )}

                {activeTab === "admins" && (
                  <AdminManagement />
                )}
              </>
            )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Campaign Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Campaign Details</DialogTitle>
            <DialogDescription>
              Review the campaign details before approving or rejecting
            </DialogDescription>
          </DialogHeader>
          
          {selectedCampaign && (
            <div className="space-y-6">
              {selectedCampaign.image_url && (
                <img 
                  src={selectedCampaign.image_url} 
                  alt={selectedCampaign.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold">{selectedCampaign.title}</h3>
                  {getStatusBadge(selectedCampaign.status)}
                </div>
                <Badge variant="secondary">{selectedCampaign.category}</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Goal Amount:</span>
                  <p className="font-semibold text-lg">{formatCurrency(Number(selectedCampaign.goal_amount))}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Amount Raised:</span>
                  <p className="font-semibold text-lg text-primary">{formatCurrency(Number(selectedCampaign.amount_raised))}</p>
                </div>
                {selectedCampaign.deadline && (
                  <div>
                    <span className="text-muted-foreground">Deadline:</span>
                    <p className="font-medium">{new Date(selectedCampaign.deadline).toLocaleDateString("en-IN")}</p>
                  </div>
                )}
                {selectedCampaign.submitted_at && (
                  <div>
                    <span className="text-muted-foreground">Submitted:</span>
                    <p className="font-medium">{new Date(selectedCampaign.submitted_at).toLocaleDateString("en-IN")}</p>
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-muted-foreground">{selectedCampaign.description}</p>
              </div>
              
              {selectedCampaign.story && (
                <div>
                  <h4 className="font-medium mb-2">Full Story</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selectedCampaign.story}</p>
                </div>
              )}
              
              {selectedCampaign.rejection_reason && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-destructive mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">Previous Rejection Reason</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedCampaign.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
          
          {selectedCampaign?.status === "pending" && (
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowPreviewDialog(false)}
              >
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setShowRejectDialog(true);
                }}
                disabled={isSubmitting}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                variant="primary"
                onClick={() => handleApproveCampaign(selectedCampaign)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Approve & Go Live
              </Button>
            </DialogFooter>
          )}
          
          {selectedCampaign?.status !== "pending" && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowPreviewDialog(false)}
              >
                Close
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Campaign</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection. This will be sent to the campaign creator.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Reason for Rejection *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Please explain what needs to be changed or why this campaign cannot be approved..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectCampaign}
              disabled={isSubmitting || !rejectionReason.trim()}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatePresence>
  );
};

export default AdminPanel;
