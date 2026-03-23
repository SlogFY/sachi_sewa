import { motion } from "framer-motion";
import { Heart, GraduationCap, PawPrint, Utensils, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const causes = [
  {
    icon: Heart,
    title: "Medical Support",
    description: "Providing crucial medical aid and healthcare support to underprivileged communities who cannot afford treatment.",
    color: "primary",
    stats: "500+ patients helped",
  },
  {
    icon: GraduationCap,
    title: "Educational Aid",
    description: "Empowering the next generation through access to quality education, scholarships, and learning materials.",
    color: "secondary",
    stats: "200+ students supported",
  },
  {
    icon: PawPrint,
    title: "Animal Welfare",
    description: "Providing care, shelter, and protection for stray and injured animals in need of love and medical attention.",
    color: "accent",
    stats: "300+ animals rescued",
  },
  {
    icon: Utensils,
    title: "Food & Nutrition",
    description: "Fighting hunger by providing nutritious meals and food supplies to families facing food insecurity.",
    color: "primary",
    stats: "10,000+ meals served",
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

const CausesSection = () => {
  return (
    <section id="causes" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            Our Causes
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mt-3">
            Transforming Lives Together
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            We focus on key areas that create lasting impact and help build stronger communities.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {causes.map((cause, index) => {
            const colors = getColorClasses(cause.color);
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group cursor-pointer"
              >
                <div className="bg-card rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-border/50 hover:border-primary/30 h-full flex flex-col">
                  <div
                    className={`w-16 h-16 rounded-2xl ${colors.bg} ${colors.hover} flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110`}
                  >
                    <cause.icon
                      className={`w-8 h-8 ${colors.icon} ${colors.iconHover} transition-colors`}
                    />
                  </div>
                  <h3 className="text-xl font-display font-bold text-foreground mb-3">
                    {cause.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed flex-grow">
                    {cause.description}
                  </p>
                  <div className="mt-4 pt-4 border-t border-border">
                    <span className="text-primary font-semibold text-sm">
                      {cause.stats}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link to="/causes">
            <Button variant="outline" size="lg" className="group">
              View All Causes
              <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CausesSection;
