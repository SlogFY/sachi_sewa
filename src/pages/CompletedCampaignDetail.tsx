import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, Users, Target, Loader2, Play } from "lucide-react";
import { FaWhatsapp, FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from "react-icons/fa";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface SocialLinks {
  whatsapp?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
}

interface SocialShareOptions {
  whatsapp?: boolean;
  facebook?: boolean;
  twitter?: boolean;
  linkedin?: boolean;
  instagram?: boolean;
}

interface Campaign {
  id: string;
  title: string;
  description: string;
  story: string | null;
  image_url: string | null;
  goal_amount: number;
  amount_raised: number;
  category: string;
  social_share_options: SocialShareOptions | null;
  social_links: SocialLinks | null;
  completion_content: string | null;
  completion_media: string[] | null;
}

const formatCurrency = (amount: number) => {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
};

const CompletedCampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [donorCount, setDonorCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", id)
        .eq("status", "live")
        .eq("is_active", true)
        .single();

      if (!error && data) {
        setCampaign({
          ...data,
          social_share_options: data.social_share_options as SocialShareOptions | null,
          social_links: data.social_links as SocialLinks | null,
          completion_media: (data.completion_media as string[]) || [],
        } as Campaign);
      }
      setIsLoading(false);
    };

    const fetchDonorCount = async () => {
      if (!id) return;

      const { count, error } = await supabase
        .from("donations")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", id);

      if (!error && count) {
        setDonorCount(count);
      }
    };

    fetchCampaign();
    fetchDonorCount();
  }, [id]);

  const shareUrl = `${window.location.origin}/completed-donations/${id}`;
  const shareText = campaign
    ? `🎉 Amazing! "${campaign.title}" has reached its goal of ${formatCurrency(Number(campaign.goal_amount))}! ${donorCount} generous donors made this possible. Check it out!`
    : "";

  const handleShare = (platform: string) => {
    const customLink = campaign?.social_links?.[platform as keyof SocialLinks];
    
    if (customLink) {
      window.open(customLink, "_blank");
      return;
    }

    // Default share behavior
    switch (platform) {
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`, "_blank");
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, "_blank");
        break;
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
        break;
      case "linkedin":
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank");
        break;
      case "instagram":
        navigator.clipboard.writeText(shareText + " " + shareUrl);
        alert("Link copied! You can now share it on Instagram.");
        break;
    }
  };

  const socialButtons = [
    { name: "whatsapp", icon: FaWhatsapp, color: "hover:bg-green-500 hover:text-white" },
    { name: "facebook", icon: FaFacebook, color: "hover:bg-blue-600 hover:text-white" },
    { name: "twitter", icon: FaTwitter, color: "hover:bg-sky-500 hover:text-white" },
    { name: "linkedin", icon: FaLinkedin, color: "hover:bg-blue-700 hover:text-white" },
    { name: "instagram", icon: FaInstagram, color: "hover:bg-pink-500 hover:text-white" },
  ];

  const getEnabledSocialButtons = () => {
    if (!campaign?.social_share_options) {
      return socialButtons;
    }
    return socialButtons.filter(
      (btn) => campaign.social_share_options?.[btn.name as keyof SocialShareOptions] === true
    );
  };

  const isVideoUrl = (url: string) => {
    return url.includes("youtube") || url.includes("youtu.be") || url.includes("vimeo") || url.endsWith(".mp4") || url.endsWith(".webm");
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return url;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Campaign Not Found</h1>
          <p className="text-muted-foreground mb-6">This campaign doesn't exist or is no longer available.</p>
          <Link to="/completed-donations">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Completed Donations
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const enabledButtons = getEnabledSocialButtons();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          <Link to="/completed-donations" className="inline-flex items-center text-primary hover:underline mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Completed Donations
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            {/* Success Banner */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 mb-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
                🎉 Goal Reached!
              </h2>
              <p className="text-green-600 dark:text-green-500">
                This campaign has successfully reached its fundraising goal thanks to {donorCount} generous donors!
              </p>
            </div>

            {/* Completion Content */}
            {campaign.completion_content && (
              <div className="bg-card rounded-2xl p-6 shadow-md border border-border/50 mb-8">
                <p className="text-foreground whitespace-pre-line text-lg leading-relaxed">
                  {campaign.completion_content}
                </p>
              </div>
            )}

            {/* Completion Media */}
            {campaign.completion_media && campaign.completion_media.length > 0 && (
              <div className="mb-8 space-y-4">
                <h3 className="text-xl font-semibold text-foreground">Updates & Media</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {campaign.completion_media.map((url, index) => (
                    <div key={index} className="rounded-xl overflow-hidden border border-border/50 shadow-md">
                      {isVideoUrl(url) ? (
                        url.includes("youtube") || url.includes("youtu.be") ? (
                          <iframe
                            src={getYouTubeEmbedUrl(url)}
                            className="w-full aspect-video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <video
                            src={url}
                            controls
                            className="w-full aspect-video"
                          />
                        )
                      ) : (
                        <img
                          src={url}
                          alt={`Campaign update ${index + 1}`}
                          className="w-full aspect-video object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Campaign Image */}
            <div className="relative rounded-2xl overflow-hidden mb-8">
              <img
                src={campaign.image_url || "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800"}
                alt={campaign.title}
                className="w-full h-[400px] object-cover"
              />
              <div className="absolute top-4 left-4">
                <span className="bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-full">
                  {campaign.category}
                </span>
              </div>
              <div className="absolute top-4 right-4">
                <span className="bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-full flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Completed
                </span>
              </div>
            </div>

            {/* Campaign Details */}
            <div className="bg-card rounded-2xl p-8 shadow-md border border-border/50 mb-8">
              <h1 className="text-3xl font-display font-bold text-foreground mb-4">
                {campaign.title}
              </h1>
              <p className="text-muted-foreground text-lg mb-6">
                {campaign.description}
              </p>

              {campaign.story && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Story</h3>
                  <p className="text-muted-foreground whitespace-pre-line">{campaign.story}</p>
                </div>
              )}

              {/* Progress Section */}
              <div className="bg-muted/50 rounded-xl p-6 mb-6">
                <div className="flex justify-between text-lg mb-3">
                  <span className="font-bold text-green-600">
                    {formatCurrency(Number(campaign.amount_raised))} raised
                  </span>
                  <span className="text-muted-foreground">
                    of {formatCurrency(Number(campaign.goal_amount))} goal
                  </span>
                </div>
                <Progress value={100} className="h-3 [&>div]:bg-green-500" />
                <div className="flex items-center justify-between mt-4 text-sm">
                  <div className="flex items-center gap-2 text-green-600">
                    <Target className="w-5 h-5" />
                    <span className="font-medium">100% Funded</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-5 h-5" />
                    <span>{donorCount} donors contributed</span>
                  </div>
                </div>
              </div>

              {/* Share Section */}
              {enabledButtons.length > 0 && (
                <div className="border-t border-border pt-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
                    Share This Success Story
                  </h3>
                  <div className="flex justify-center gap-4 flex-wrap">
                    {enabledButtons.map((social) => (
                      <Button
                        key={social.name}
                        variant="outline"
                        size="lg"
                        onClick={() => handleShare(social.name)}
                        className={`rounded-full p-4 transition-all ${social.color}`}
                      >
                        <social.icon className="w-6 h-6" />
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CompletedCampaignDetail;
