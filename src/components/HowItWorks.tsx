import { motion } from "framer-motion";
import { FileText, Share2, CreditCard, HeartHandshake, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: FileText,
    step: "01",
    title: "Create Your Campaign",
    description: "Sign up and create your fundraiser in minutes. Add your story, photos, and set your goal.",
  },
  {
    icon: Share2,
    step: "02",
    title: "Share Your Story",
    description: "Share your campaign on social media, WhatsApp, and with your network to spread the word.",
  },
  {
    icon: CreditCard,
    step: "03",
    title: "Collect Donations",
    description: "Receive donations directly through secure payment gateways. Track progress in real-time.",
  },
  {
    icon: HeartHandshake,
    step: "04",
    title: "Get Quick Disbursement",
    description: "Funds are disbursed directly to the hospital or beneficiary quickly and securely.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary-light/30 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            Simple Process
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mt-3">
            How Fundraising Works
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Start your fundraiser in just a few simple steps and begin making a difference today.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-primary/50 to-primary/10" />
              )}

              <div className="text-center relative">
                {/* Step number */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-6xl font-display font-bold text-primary/10">
                  {step.step}
                </div>
                
                {/* Icon */}
                <div className="relative z-10 w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-lg">
                  <step.icon className="w-10 h-10 text-primary-foreground" />
                </div>

                <h3 className="text-xl font-display font-bold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Features highlight */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            { title: "0% Platform Fee", description: "100% of your donation goes to the cause" },
            { title: "Quick Disbursement", description: "Funds reach beneficiaries within 24-48 hours" },
            { title: "Secure Payments", description: "Bank-grade security for all transactions" },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-primary-light/50 rounded-xl p-6 text-center border border-primary/20"
            >
              <h4 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h4>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-12"
        >
          <Link to="/how-it-works">
            <Button variant="outline" size="lg" className="group">
              Learn More
              <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
