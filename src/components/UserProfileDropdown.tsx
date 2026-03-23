import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut, Heart, IndianRupee, Calendar, X, Settings, LayoutDashboard, Megaphone, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Donation {
  id: string;
  amount: number;
  created_at: string;
  campaign_id: string;
}

interface MonthlyDonation {
  id: string;
  amount: number;
  plan_name: string;
  created_at: string;
}

interface Profile {
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

interface UserProfileDropdownProps {
  user: SupabaseUser;
  isAdmin: boolean;
  onAdminClick: () => void;
}

const UserProfileDropdown = ({ user, isAdmin, onAdminClick }: UserProfileDropdownProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [monthlyDonations, setMonthlyDonations] = useState<MonthlyDonation[]>([]);
  const [totalDonated, setTotalDonated] = useState(0);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchUserData();
      checkOwnerStatus();
    }
  }, [isOpen, user]);

  const checkOwnerStatus = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "owner")
      .maybeSingle();
    
    setIsOwner(!!data);
  };

  const fetchUserData = async () => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch donations
      const { data: donationsData } = await supabase
        .from("donations")
        .select("id, amount, created_at, campaign_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (donationsData) {
        setDonations(donationsData);
      }

      // Fetch monthly donations
      const { data: monthlyData } = await supabase
        .from("monthly_donations")
        .select("id, amount, plan_name, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (monthlyData) {
        setMonthlyDonations(monthlyData);
      }

      // Calculate total
      const donationsTotal = donationsData?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      const monthlyTotal = monthlyData?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      setTotalDonated(donationsTotal + monthlyTotal);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleLogout = async () => {
    try {
      console.log("Starting logout...");
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
        toast({
          title: "Logout Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      console.log("Logout successful");
      setIsOpen(false);
      toast({
        title: "Logged Out",
        description: "See you soon!",
      });
      navigate("/");
    } catch (error) {
      console.error("Logout exception:", error);
      toast({
        title: "Error",
        description: "Something went wrong during logout",
        variant: "destructive",
      });
    }
  };

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-full hover:bg-muted transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground font-semibold text-sm">
          {initials}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-card rounded-xl shadow-elegant border border-border z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 bg-gradient-hero text-primary-foreground">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center font-bold text-lg">
                      {initials}
                    </div>
                    <div>
                      <p className="font-semibold">{displayName}</p>
                      <p className="text-sm opacity-90">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-primary-foreground/20 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Donated</p>
                      <p className="font-bold text-foreground flex items-center">
                        <IndianRupee className="w-4 h-4" />
                        {totalDonated.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Donations</p>
                    <p className="font-bold text-foreground">{donations.length + monthlyDonations.length}</p>
                  </div>
                </div>
              </div>

              {/* Recent Donations */}
              <div className="p-4 max-h-48 overflow-y-auto">
                <h4 className="text-sm font-semibold text-foreground mb-3">Recent Donations</h4>
                {donations.length === 0 && monthlyDonations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No donations yet. Start making a difference today!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {donations.slice(0, 3).map((donation) => (
                      <div
                        key={donation.id}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-primary" />
                          <span className="text-sm text-foreground">One-time Donation</span>
                        </div>
                        <span className="text-sm font-semibold text-primary">
                          ₹{Number(donation.amount).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                    {monthlyDonations.slice(0, 3).map((donation) => (
                      <div
                        key={donation.id}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span className="text-sm text-foreground truncate max-w-[140px]">
                            {donation.plan_name}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-primary">
                          ₹{Number(donation.amount).toLocaleString("en-IN")}/mo
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-3 border-t border-border space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setIsOpen(false);
                    navigate("/dashboard");
                  }}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  My Dashboard
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setIsOpen(false);
                    navigate("/my-campaigns");
                  }}
                >
                  <Megaphone className="w-4 h-4 mr-2" />
                  My Campaigns
                </Button>
                {isOwner && (
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20"
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/owner-dashboard");
                    }}
                  >
                    <Crown className="w-4 h-4 mr-2 text-amber-600" />
                    Owner Dashboard
                  </Button>
                )}
                {isAdmin && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setIsOpen(false);
                      onAdminClick();
                    }}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Admin Panel
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserProfileDropdown;
