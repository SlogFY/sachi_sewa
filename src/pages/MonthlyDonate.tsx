import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Check, Calendar, Shield, Users, ArrowLeft, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/Footer";
import type { User } from "@supabase/supabase-js";

const monthlyPlans = [
  { id: "critical", name: "Support Patients Battling Critical Diseases", icon: "🏥" },
  { id: "children", name: "Support Children Fighting Critical Diseases", icon: "👶" },
  { id: "cancer", name: "Support Patients Fighting Cancer", icon: "💪" },
  { id: "transplant", name: "Support Patients Needing Organ Transplant", icon: "❤️" },
  { id: "rare", name: "Support Patients Battling Rare Disease", icon: "🌟" },
  { id: "animal", name: "Contribute Towards Animal Welfare", icon: "🐾" },
  { id: "hunger", name: "Support To Fill A Plate", icon: "🍽️" },
  { id: "education", name: "Support To Send a Child to School", icon: "📚" },
  { id: "elderly", name: "Support To Give an Elderly a Second Inning", icon: "👴" },
];

const predefinedAmounts = [
  { value: 501, label: "₹501/mo" },
  { value: 750, label: "₹750/mo" },
  { value: 1001, label: "₹1001/mo" },
  { value: 2001, label: "₹2001/mo" },
];

const MonthlyDonate = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAmount, setSelectedAmount] = useState<number>(1001);
  const [customAmount, setCustomAmount] = useState<string>("1001");
  const [selectedPlan, setSelectedPlan] = useState<string>("critical");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    isIndianCitizen: "yes",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setFormData(prev => ({
          ...prev,
          name: session.user.user_metadata?.full_name || prev.name,
          email: session.user.email || prev.email,
          phone: session.user.user_metadata?.phone || prev.phone,
        }));
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setFormData(prev => ({
          ...prev,
          name: session.user.user_metadata?.full_name || prev.name,
          email: session.user.email || prev.email,
          phone: session.user.user_metadata?.phone || prev.phone,
        }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount(amount.toString());
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      setSelectedAmount(numValue);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to make a monthly donation",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name || !formData.phone || !formData.email) {
      toast({
        title: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const selectedPlanData = monthlyPlans.find(p => p.id === selectedPlan);
      
      const donationData = {
        donor_name: formData.name,
        donor_email: formData.email,
        donor_phone: formData.phone || null,
        amount: selectedAmount,
        plan_id: selectedPlan,
        plan_name: selectedPlanData?.name || selectedPlan,
        is_indian_citizen: formData.isIndianCitizen === "yes",
        receipt_number: 'TEMP',
        user_id: user.id,
      };

      const { error } = await supabase
        .from("monthly_donations")
        .insert(donationData as any);

      if (error) throw error;

      toast({
        title: "Monthly Donation Initiated! 🎉",
        description: `Thank you for pledging ₹${selectedAmount}/month. You'll receive a confirmation email shortly.`,
      });
      
      navigate("/");
    } catch (error: any) {
      console.error("Donation error:", error);
      toast({
        title: "Error",
        description: "Failed to process donation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navbar />
      
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </motion.button>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <Heart className="w-5 h-5 text-primary fill-primary" />
              </motion.div>
              <span className="text-primary font-semibold">Become a Monthly Hero</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Your Monthly Gift,{" "}
              <span className="text-gradient-primary">Lasting Impact</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join our community of monthly donors making a difference every single month. 
              Amount is auto-debited on the 5th of every month.
            </p>
          </motion.div>

          {/* Login Required Message */}
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl shadow-elegant border border-border p-8 text-center mb-8"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <LogIn className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-bold text-foreground mb-2">
                Login Required
              </h3>
              <p className="text-muted-foreground mb-6">
                Please create an account or login to make a monthly donation
              </p>
              <Button variant="primary" onClick={() => navigate("/auth")} className="min-w-[200px]">
                Login / Sign Up
              </Button>
            </motion.div>
          )}

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12"
          >
            {[
              { icon: Calendar, text: "Consistent monthly support" },
              { icon: Shield, text: "Secure & encrypted payments" },
              { icon: Users, text: "Join 10,000+ monthly donors" },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-card rounded-xl p-4 shadow-sm border border-border"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{item.text}</span>
              </div>
            ))}
          </motion.div>

          {/* Main Form */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-2xl shadow-elegant border border-border overflow-hidden"
            >
              <form onSubmit={handleSubmit}>
                {/* Amount Selection */}
                <div className="p-6 md:p-8 border-b border-border">
                  <h2 className="text-xl font-display font-bold text-foreground mb-6">
                    Choose Monthly Amount
                  </h2>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {predefinedAmounts.map((amount) => (
                      <motion.button
                        key={amount.value}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAmountSelect(amount.value)}
                        className={`py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                          selectedAmount === amount.value
                            ? "bg-primary text-primary-foreground shadow-lg"
                            : "bg-muted text-foreground hover:bg-muted/80 border border-border"
                        }`}
                      >
                        {amount.label}
                      </motion.button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg border border-border">
                      <span className="text-muted-foreground font-medium">₹ - INR</span>
                    </div>
                    <Input
                      type="number"
                      value={customAmount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      placeholder="Enter amount"
                      className="flex-1"
                      min="100"
                    />
                  </div>
                </div>

                {/* Plan Selection */}
                <div className="p-6 md:p-8 border-b border-border bg-muted/30">
                  <h2 className="text-xl font-display font-bold text-foreground mb-4">
                    Choose Monthly Plan
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Select where your monthly donation should make an impact
                  </p>

                  <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                    <SelectTrigger className="w-full bg-card">
                      <SelectValue placeholder="Select a cause" />
                    </SelectTrigger>
                    <SelectContent className="bg-card max-h-[300px]">
                      {monthlyPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{plan.icon}</span>
                            <span>{plan.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20 flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5" />
                    <p className="text-sm text-foreground">
                      Amount will be auto-debited on the <strong>5th of every month</strong>
                    </p>
                  </div>
                </div>

                {/* Personal Details */}
                <div className="p-6 md:p-8 space-y-6">
                  <h2 className="text-xl font-display font-bold text-foreground mb-2">
                    Your Details
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter your full name"
                        className="mt-1"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Mobile Number *</Label>
                        <div className="flex gap-2 mt-1">
                          <div className="px-3 py-2 bg-muted rounded-lg border border-border text-sm text-muted-foreground">
                            +91
                          </div>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="Mobile Number"
                            className="flex-1"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="Enter your email"
                          className="mt-1"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="mb-3 block">Are you an Indian Citizen? *</Label>
                      <RadioGroup
                        value={formData.isIndianCitizen}
                        onValueChange={(value) => setFormData({ ...formData, isIndianCitizen: value })}
                        className="flex gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="citizen-yes" />
                          <Label htmlFor="citizen-yes" className="cursor-pointer">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="citizen-no" />
                          <Label htmlFor="citizen-no" className="cursor-pointer">No</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-gradient-hero text-primary-foreground font-semibold text-lg py-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-6 h-6 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                        />
                      ) : (
                        <>
                          <Heart className="w-5 h-5 mr-2 fill-current" />
                          Start Monthly Donation of ₹{selectedAmount}
                        </>
                      )}
                    </Button>
                  </motion.div>

                  <p className="text-center text-sm text-muted-foreground">
                    🔒 Your payment is secured with 256-bit SSL encryption
                  </p>
                </div>
              </form>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MonthlyDonate;
