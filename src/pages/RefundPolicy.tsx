import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

const RefundPolicy = () => {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "refund_policy_content")
        .single();

      if (!error && data) {
        setContent(data.value);
      }
      setIsLoading(false);
    };
    fetchContent();
  }, []);

  const renderContent = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, index) => {
      if (line.startsWith("# ")) {
        return (
          <h1 key={index} className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
            {line.replace("# ", "")}
          </h1>
        );
      } else if (line.startsWith("## ")) {
        return (
          <h2 key={index} className="text-xl md:text-2xl font-display font-bold text-foreground mt-8 mb-4">
            {line.replace("## ", "")}
          </h2>
        );
      } else if (line.startsWith("### ")) {
        return (
          <h3 key={index} className="text-lg font-display font-bold text-foreground mt-6 mb-3">
            {line.replace("### ", "")}
          </h3>
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
      
      <section className="pt-32 pb-16 bg-gradient-hero">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-6">
              Refund Policy
            </h1>
            <p className="text-lg text-primary-foreground/80">
              Our commitment to your satisfaction
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-3xl mx-auto bg-card rounded-xl border border-border p-8"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : content ? (
              <div className="prose prose-lg max-w-none">
                {renderContent(content)}
              </div>
            ) : (
              <p className="text-muted-foreground text-center">No content available</p>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default RefundPolicy;
