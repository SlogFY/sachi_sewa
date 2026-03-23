import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, CheckCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const categories = [
  "Medical",
  "Education",
  "Animal Welfare",
  "Environment",
  "Disaster Relief",
  "Community",
];

const StartFundraiser = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    requester_name: "",
    requester_email: "",
    requester_phone: "",
    title: "",
    description: "",
    category: "",
    goal_amount: "",
    story: "",
    image_url: "",
    video_url: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.requester_name ||
      !formData.requester_email ||
      !formData.title ||
      !formData.description ||
      !formData.category ||
      !formData.goal_amount
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("fundraiser_requests").insert({
        requester_name: formData.requester_name,
        requester_email: formData.requester_email,
        requester_phone: formData.requester_phone || null,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        goal_amount: parseFloat(formData.goal_amount),
        story: formData.story || null,
        image_url: formData.image_url || null,
        video_url: formData.video_url || null,
      });

      if (error) throw error;

      setIsSuccess(true);
      toast({
        title: "Request Submitted!",
        description: "Your fundraiser request has been sent for admin approval.",
      });
    } catch (error: any) {
      console.error("Submit error:", error);
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <section className="pt-32 pb-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg mx-auto text-center"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-display font-bold text-foreground mb-4">
                Request Submitted!
              </h1>
              <p className="text-muted-foreground mb-8">
                Thank you for submitting your fundraiser request. Our team will
                review it and get back to you within 24-48 hours. Once approved,
                your campaign will be live on SacchiSewa.
              </p>
              <Button variant="primary" onClick={() => (window.location.href = "/")}>
                Back to Home
              </Button>
            </motion.div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 bg-gradient-to-b from-slate-800 to-slate-700 overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1920")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 to-slate-800/80" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Start Your Fundraiser
            </h1>
            <p className="text-lg text-slate-300">
              Share your story and get the support you need. Fill out the form
              below and our team will review your request.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-card rounded-2xl border border-border p-8 shadow-lg">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Details */}
                <div>
                  <h2 className="text-xl font-display font-bold text-foreground mb-4">
                    Your Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-foreground">
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        placeholder="Enter your full name"
                        value={formData.requester_name}
                        onChange={(e) =>
                          setFormData({ ...formData, requester_name: e.target.value })
                        }
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-foreground">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.requester_email}
                        onChange={(e) =>
                          setFormData({ ...formData, requester_email: e.target.value })
                        }
                        className="mt-1"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="phone" className="text-foreground">
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={formData.requester_phone}
                        onChange={(e) =>
                          setFormData({ ...formData, requester_phone: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Campaign Details */}
                <div>
                  <h2 className="text-xl font-display font-bold text-foreground mb-4">
                    Campaign Details
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title" className="text-foreground">
                        Campaign Title *
                      </Label>
                      <Input
                        id="title"
                        placeholder="Give your campaign a title"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        className="mt-1"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category" className="text-foreground">
                          Category *
                        </Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) =>
                            setFormData({ ...formData, category: value })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="goal" className="text-foreground">
                          Goal Amount (₹) *
                        </Label>
                        <Input
                          id="goal"
                          type="number"
                          placeholder="How much do you need?"
                          value={formData.goal_amount}
                          onChange={(e) =>
                            setFormData({ ...formData, goal_amount: e.target.value })
                          }
                          className="mt-1"
                          min="1"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-foreground">
                        Short Description *
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Briefly describe your campaign (100-200 words)"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        className="mt-1"
                        rows={3}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="story" className="text-foreground">
                        Your Story
                      </Label>
                      <Textarea
                        id="story"
                        placeholder="Tell your complete story. Why do you need help? What will the funds be used for?"
                        value={formData.story}
                        onChange={(e) =>
                          setFormData({ ...formData, story: e.target.value })
                        }
                        className="mt-1"
                        rows={6}
                      />
                    </div>
                  </div>
                </div>

                {/* Media */}
                <div>
                  <h2 className="text-xl font-display font-bold text-foreground mb-4">
                    Photos & Videos
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="image" className="text-foreground">
                        Image URL
                      </Label>
                      <Input
                        id="image"
                        type="url"
                        placeholder="https://example.com/your-image.jpg"
                        value={formData.image_url}
                        onChange={(e) =>
                          setFormData({ ...formData, image_url: e.target.value })
                        }
                        className="mt-1"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Paste a link to your campaign image
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="video" className="text-foreground">
                        Video URL
                      </Label>
                      <Input
                        id="video"
                        type="url"
                        placeholder="https://youtube.com/watch?v=..."
                        value={formData.video_url}
                        onChange={(e) =>
                          setFormData({ ...formData, video_url: e.target.value })
                        }
                        className="mt-1"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Paste a YouTube or video link
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit for Approval
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  By submitting, you agree to our terms and conditions. Your
                  request will be reviewed within 24-48 hours.
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default StartFundraiser;
