import { motion } from "framer-motion";
import { Heart, GraduationCap, PawPrint, Utensils, Home, Droplets, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { usePageWallpaper } from "@/hooks/usePageWallpapers";

const causes = [
  {
    icon: Heart,
    title: "Medical Support",
    description: "Providing crucial medical aid and healthcare support to underprivileged communities who cannot afford treatment. From life-saving surgeries to ongoing medical care, we help those in need access quality healthcare.",
    color: "primary",
    stats: "500+ patients helped",
    campaigns: 45,
    raised: "₹15L+",
  },
  {
    icon: GraduationCap,
    title: "Educational Aid",
    description: "Empowering the next generation through access to quality education, scholarships, and learning materials. We believe education is the key to breaking the cycle of poverty.",
    color: "secondary",
    stats: "200+ students supported",
    campaigns: 30,
    raised: "₹8L+",
  },
  {
    icon: PawPrint,
    title: "Animal Welfare",
    description: "Providing care, shelter, and protection for stray and injured animals in need of love and medical attention. Every creature deserves compassion and a chance at a better life.",
    color: "accent",
    stats: "300+ animals rescued",
    campaigns: 25,
    raised: "₹5L+",
  },
  {
    icon: Utensils,
    title: "Food & Nutrition",
    description: "Fighting hunger by providing nutritious meals and food supplies to families facing food insecurity. No one should go to bed hungry.",
    color: "primary",
    stats: "10,000+ meals served",
    campaigns: 20,
    raised: "₹6L+",
  },
  {
    icon: Home,
    title: "Shelter & Housing",
    description: "Helping families find safe and secure housing. From disaster relief to permanent shelter solutions, we work to ensure everyone has a roof over their head.",
    color: "secondary",
    stats: "50+ families housed",
    campaigns: 15,
    raised: "₹10L+",
  },
  {
    icon: Droplets,
    title: "Clean Water",
    description: "Providing access to clean drinking water and sanitation facilities to communities in need. Clean water is a basic human right.",
    color: "accent",
    stats: "20+ communities served",
    campaigns: 10,
    raised: "₹6L+",
  },
];

const getColorClasses = (color: string) => {
  switch (color) {
    case "primary":
      return {
        bg: "bg-primary-light",
        icon: "text-primary",
        hover: "group-hover:bg-primary",
        iconHover: "group-hover:text-primary-foreground",
      };
    case "secondary":
      return {
        bg: "bg-secondary-light",
        icon: "text-secondary",
        hover: "group-hover:bg-secondary",
        iconHover: "group-hover:text-secondary-foreground",
      };
    case "accent":
      return {
        bg: "bg-accent-light",
        icon: "text-accent",
        hover: "group-hover:bg-accent",
        iconHover: "group-hover:text-accent-foreground",
      };
    default:
      return {
        bg: "bg-primary-light",
        icon: "text-primary",
        hover: "group-hover:bg-primary",
        iconHover: "group-hover:text-primary-foreground",
      };
  }
};

const Causes = () => {
  const { wallpaper, overlayOpacity } = usePageWallpaper("causes_wallpaper");

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
              Our Causes
            </h1>
            <p className="text-lg text-primary-foreground/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
              We focus on key areas that create lasting impact and help build stronger 
              communities. Every cause is verified and every donation makes a difference.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Causes Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {causes.map((cause, index) => {
              const colors = getColorClasses(cause.color);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group"
                >
                  <div className="bg-card rounded-2xl p-8 shadow-md hover:shadow-lg transition-all duration-300 border border-border/50 hover:border-primary/30 h-full flex flex-col">
                    <div
                      className={`w-20 h-20 rounded-2xl ${colors.bg} ${colors.hover} flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110`}
                    >
                      <cause.icon
                        className={`w-10 h-10 ${colors.icon} ${colors.iconHover} transition-colors`}
                      />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-foreground mb-4">
                      {cause.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed flex-grow mb-6">
                      {cause.description}
                    </p>
                    
                    <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-border mb-6">
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary">{cause.campaigns}</div>
                        <div className="text-xs text-muted-foreground">Campaigns</div>
                      </div>
                      <div className="text-center border-l border-r border-border">
                        <div className="text-lg font-bold text-primary">{cause.raised}</div>
                        <div className="text-xs text-muted-foreground">Raised</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary">{cause.stats.split(" ")[0]}</div>
                        <div className="text-xs text-muted-foreground">Helped</div>
                      </div>
                    </div>

                    <Link to="/fundraisers">
                      <Button variant="outline" className="w-full group">
                        View Campaigns
                        <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">
              Want to Start a Campaign?
            </h2>
            <p className="text-muted-foreground mb-8">
              If you have a cause that needs support, start your fundraiser today. 
              Our platform makes it easy to raise funds and make a difference.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg">
                Start a Fundraiser
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Link to="/fundraisers">
                <Button variant="outline" size="lg">
                  Browse All Campaigns
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Causes;
