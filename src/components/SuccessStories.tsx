import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const stories = [
  {
    name: "Aarav Patel",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    story: "Thanks to the generous donations, I was able to undergo a life-saving heart surgery. I'm now back on my feet and living life to the fullest!",
    amount: "₹5,00,000",
    cause: "Medical Treatment",
  },
  {
    name: "Priya Sharma",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    story: "The funds raised helped me complete my education when my family was going through a financial crisis. I'm now working as a software engineer and supporting my family.",
    amount: "₹3,50,000",
    cause: "Education",
  },
  {
    name: "Rahul Verma",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    story: "After losing everything in a natural disaster, the SacchiSewa community came together to help rebuild our home. We're forever grateful for the support.",
    amount: "₹7,25,000",
    cause: "Disaster Relief",
  },
];

const SuccessStories = () => {
  return (
    <section id="success-stories" className="py-24 bg-gradient-soft">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mt-3">
            Inspiring Success Stories
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Real stories from real people whose lives have been transformed through your generosity.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stories.map((story, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="bg-card rounded-2xl p-8 shadow-md border border-border/50 h-full flex flex-col relative">
                {/* Quote icon */}
                <div className="absolute -top-4 left-8">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <Quote className="w-5 h-5 text-secondary-foreground" />
                  </div>
                </div>

                {/* Story */}
                <p className="text-foreground leading-relaxed mb-6 mt-4 flex-grow">
                  "{story.story}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4 pt-6 border-t border-border">
                  <img
                    src={story.image}
                    alt={story.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
                  />
                  <div className="flex-grow">
                    <div className="font-display font-bold text-foreground">
                      {story.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {story.cause}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Raised</div>
                    <div className="font-semibold text-primary">{story.amount}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SuccessStories;
