import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Users, Award, Target, CheckCircle, Loader2, Star, Shield, Globe, Linkedin, Twitter, Instagram, Facebook, Quote } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { usePageWallpaper } from "@/hooks/usePageWallpapers";

interface Stat {
  value: string;
  label: string;
}

interface Value {
  icon: string;
  title: string;
  description: string;
}

interface Milestone {
  year: string;
  title: string;
  description: string;
  image_url?: string;
}

interface FounderSocials {
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
}

interface Founder {
  name: string;
  title: string;
  story: string;
  image_url: string;
  quote?: string;
  socials?: FounderSocials;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Heart,
  Users,
  Award,
  Target,
  CheckCircle,
  Star,
  Shield,
  Globe,
};

const About = () => {
  const [aboutContent, setAboutContent] = useState("");
  const [stats, setStats] = useState<Stat[]>([]);
  const [values, setValues] = useState<Value[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [founder, setFounder] = useState<Founder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { wallpaper, overlayOpacity } = usePageWallpaper("about_wallpaper");

  useEffect(() => {
    const fetchContent = async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["about_us_content", "about_stats", "about_values", "about_milestones", "about_founder"]);

      if (!error && data) {
        data.forEach((item) => {
          if (item.key === "about_us_content") {
            setAboutContent(item.value);
          } else if (item.key === "about_stats") {
            try { setStats(JSON.parse(item.value)); } catch { }
          } else if (item.key === "about_values") {
            try { setValues(JSON.parse(item.value)); } catch { }
          } else if (item.key === "about_milestones") {
            try { setMilestones(JSON.parse(item.value)); } catch { }
          } else if (item.key === "about_founder") {
            try { 
              const founderData = JSON.parse(item.value);
              if (founderData.name || founderData.story || founderData.image_url) {
                setFounder(founderData);
              }
            } catch { }
          }
        });
      }
      setIsLoading(false);
    };
    fetchContent();
  }, []);

  // Fallback data if nothing in database
  const displayStats = stats.length > 0 ? stats : [
    { value: "1000+", label: "Lives Changed" },
    { value: "₹50L+", label: "Funds Raised" },
    { value: "100+", label: "Active Campaigns" },
    { value: "5000+", label: "Donors" },
  ];

  const displayValues = values.length > 0 ? values : [
    { icon: "Heart", title: "Compassion", description: "We believe in the power of empathy and kindness to transform lives." },
    { icon: "Users", title: "Community", description: "Together, we are stronger. Our community drives positive change." },
    { icon: "Award", title: "Transparency", description: "100% of donations go directly to the cause. Zero platform fees." },
    { icon: "Target", title: "Impact", description: "Every contribution creates measurable, lasting change." },
  ];

  const displayMilestones = milestones.length > 0 ? milestones : [
    { year: "2020", title: "SacchiSewa Founded", description: "Started with a vision to make charitable giving accessible to all." },
    { year: "2021", title: "First 100 Campaigns", description: "Reached our first milestone of 100 successful fundraising campaigns." },
    { year: "2022", title: "₹10 Lakhs Raised", description: "Crossed the ₹10 lakh mark in total funds raised for various causes." },
    { year: "2023", title: "National Recognition", description: "Received recognition for our impact in healthcare and education." },
    { year: "2024", title: "₹50 Lakhs & Growing", description: "Continuing to expand our reach and impact across India." },
  ];

  const renderContent = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, index) => {
      if (line.startsWith("# ")) {
        return (
          <h2 key={index} className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4 mt-6 first:mt-0">
            {line.replace("# ", "")}
          </h2>
        );
      } else if (line.startsWith("## ")) {
        return (
          <h3 key={index} className="text-xl font-display font-bold text-foreground mt-6 mb-3">
            {line.replace("## ", "")}
          </h3>
        );
      } else if (line.startsWith("- **")) {
        const match = line.match(/- \*\*(.+?)\*\*: (.+)/);
        if (match) {
          return (
            <div key={index} className="flex items-start gap-3 mb-3">
              <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">{match[1]}</span>: {match[2]}
              </p>
            </div>
          );
        }
        return (
          <div key={index} className="flex items-start gap-3 mb-3">
            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-muted-foreground">{line.replace("- ", "")}</p>
          </div>
        );
      } else if (line.trim() === "") {
        return <br key={index} />;
      } else {
        return (
          <p key={index} className="text-muted-foreground mb-4 leading-relaxed">
            {line}
          </p>
        );
      }
    });
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section 
        className="pt-32 pb-16 bg-gradient-hero relative overflow-hidden"
        style={wallpaper ? {
          backgroundImage: `url("${wallpaper}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        } : {}}
      >
        {wallpaper && <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity / 100 }} />}
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              About SacchiSewa
            </h1>
            <p className="text-lg text-primary-foreground/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
              We are a community-driven platform dedicated to connecting compassionate 
              donors with those in need. Our mission is to make giving simple, transparent, 
              and impactful.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {displayStats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-display font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Content from Database */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto bg-card rounded-xl border border-border p-8"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : aboutContent ? (
              <div className="prose prose-lg max-w-none">
                {renderContent(aboutContent)}
              </div>
            ) : (
              <div className="space-y-4 text-muted-foreground">
                <p>
                  SacchiSewa was born from a simple belief: everyone deserves a helping hand 
                  when they need it most. Founded in 2020, we set out to create a platform 
                  that makes charitable giving accessible, transparent, and impactful.
                </p>
                <p>
                  What started as a small initiative has grown into a movement of thousands 
                  of compassionate individuals coming together to support medical treatments, 
                  education, animal welfare, and more.
                </p>
                <p>
                  With our 0% platform fee policy, we ensure that every rupee you donate 
                  goes directly to those who need it. This commitment to transparency has 
                  earned us the trust of donors across India.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              What Drives Us
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mt-3">
              Our Core Values
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayValues.map((value, index) => {
              const IconComponent = ICON_MAP[value.icon] || Heart;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-card rounded-2xl p-6 border border-border/50 text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-light flex items-center justify-center">
                    <IconComponent className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-display font-bold text-foreground mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Founder Section */}
      {founder && (founder.name || founder.story || founder.image_url) && (
        <section className="py-20 bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <span className="text-primary font-medium text-sm uppercase tracking-wider">
                The Vision Behind SacchiSewa
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mt-3">
                Our Founder
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-card rounded-3xl border border-border p-8 md:p-12 shadow-lg">
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                  {founder.image_url && (
                    <div className="shrink-0">
                      <div className="relative">
                        <div className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-primary/20 shadow-xl">
                          <img
                            src={founder.image_url}
                            alt={founder.name || "Founder"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg">
                          <Heart className="w-6 h-6 text-primary-foreground fill-current" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex-1 text-center md:text-left">
                    {founder.name && (
                      <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">
                        {founder.name}
                      </h3>
                    )}
                    {founder.title && (
                      <p className="text-primary font-medium mb-4">{founder.title}</p>
                    )}
                    {founder.story && (
                      <div className="text-muted-foreground leading-relaxed space-y-4 mb-6">
                        {founder.story.split('\n').map((paragraph, idx) => (
                          <p key={idx}>{paragraph}</p>
                        ))}
                      </div>
                    )}
                    {/* Social Links */}
                    {founder.socials && Object.values(founder.socials).some(v => v) && (
                      <div className="flex items-center gap-3 justify-center md:justify-start">
                        {founder.socials.linkedin && (
                          <a
                            href={founder.socials.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 bg-[#0077B5]/10 hover:bg-[#0077B5]/20 rounded-full flex items-center justify-center transition-colors"
                          >
                            <Linkedin className="w-5 h-5 text-[#0077B5]" />
                          </a>
                        )}
                        {founder.socials.twitter && (
                          <a
                            href={founder.socials.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 rounded-full flex items-center justify-center transition-colors"
                          >
                            <Twitter className="w-5 h-5 text-[#1DA1F2]" />
                          </a>
                        )}
                        {founder.socials.instagram && (
                          <a
                            href={founder.socials.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 bg-[#E4405F]/10 hover:bg-[#E4405F]/20 rounded-full flex items-center justify-center transition-colors"
                          >
                            <Instagram className="w-5 h-5 text-[#E4405F]" />
                          </a>
                        )}
                        {founder.socials.facebook && (
                          <a
                            href={founder.socials.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 rounded-full flex items-center justify-center transition-colors"
                          >
                            <Facebook className="w-5 h-5 text-[#1877F2]" />
                          </a>
                        )}
                        {founder.socials.website && (
                          <a
                            href={founder.socials.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 bg-primary/10 hover:bg-primary/20 rounded-full flex items-center justify-center transition-colors"
                          >
                            <Globe className="w-5 h-5 text-primary" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Founder Quote */}
                {founder.quote && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="mt-8 pt-8 border-t border-border"
                  >
                    <div className="relative">
                      <Quote className="w-10 h-10 text-primary/20 absolute -top-2 -left-2" />
                      <blockquote className="pl-8 pr-4">
                        <p className="text-lg md:text-xl italic text-foreground leading-relaxed">
                          "{founder.quote}"
                        </p>
                        <footer className="mt-4 flex items-center gap-3">
                          {founder.image_url && (
                            <img
                              src={founder.image_url}
                              alt={founder.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
                            />
                          )}
                          <div>
                            <cite className="not-italic font-semibold text-foreground">
                              {founder.name}
                            </cite>
                            {founder.title && (
                              <p className="text-sm text-muted-foreground">{founder.title}</p>
                            )}
                          </div>
                        </footer>
                      </blockquote>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Timeline */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              Our Journey
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mt-3">
              Milestones We Have Achieved
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            {displayMilestones.map((milestone, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex gap-6 mb-8 last:mb-0"
              >
                <div className="shrink-0 w-20 text-right">
                  <span className="text-primary font-display font-bold">{milestone.year}</span>
                </div>
                <div className="relative pl-6 border-l-2 border-primary/30 pb-8 last:pb-0 flex-1">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary" />
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <h3 className="font-display font-bold text-foreground mb-1">{milestone.title}</h3>
                      <p className="text-sm text-muted-foreground">{milestone.description}</p>
                    </div>
                    {milestone.image_url && (
                      <div className="shrink-0">
                        <img
                          src={milestone.image_url}
                          alt={milestone.title}
                          className="w-full md:w-40 h-24 object-cover rounded-lg border border-border"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default About;
