import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Upload, 
  X, 
  Loader2,
  FileText,
  Target,
  Image as ImageIcon,
  Send,
  Save,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const categories = [
  "Medical",
  "Education", 
  "Animal Welfare",
  "Environment",
  "Disaster Relief",
  "Community",
  "Children",
  "Elderly Care",
  "Sports",
  "Arts & Culture"
];

const steps = [
  { id: 1, title: "Basic Info", icon: FileText },
  { id: 2, title: "Goal & Timeline", icon: Target },
  { id: 3, title: "Story & Media", icon: ImageIcon },
  { id: 4, title: "Review & Submit", icon: Send },
];

interface CampaignData {
  title: string;
  description: string;
  category: string;
  goal_amount: string;
  deadline: string;
  story: string;
  video_url: string;
  image_url: string;
}

const CreateCampaign = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [formData, setFormData] = useState<CampaignData>({
    title: "",
    description: "",
    category: "",
    goal_amount: "",
    deadline: "",
    story: "",
    video_url: "",
    image_url: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CampaignData, string>>>({});

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast({
        title: "Login Required",
        description: "Please login to create a campaign",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    setUser(session.user);
    
    // Check for edit parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get("edit");
    
    if (editId) {
      loadCampaignForEdit(editId, session.user.id);
    } else {
      loadDraft(session.user.id);
    }
  };

  const loadCampaignForEdit = async (campaignId: string, userId: string) => {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .eq("creator_id", userId)
      .maybeSingle();

    if (error || !data) {
      toast({
        title: "Campaign not found",
        description: "Unable to load the campaign for editing",
        variant: "destructive",
      });
      navigate("/my-campaigns");
      return;
    }

    // Only allow editing draft or rejected campaigns
    if (data.status !== "draft" && data.status !== "rejected") {
      toast({
        title: "Cannot edit",
        description: "You can only edit draft or rejected campaigns",
        variant: "destructive",
      });
      navigate("/my-campaigns");
      return;
    }

    setDraftId(data.id);
    setFormData({
      title: data.title || "",
      description: data.description || "",
      category: data.category || "",
      goal_amount: data.goal_amount?.toString() || "",
      deadline: data.deadline ? new Date(data.deadline).toISOString().split("T")[0] : "",
      story: data.story || "",
      video_url: data.video_url || "",
      image_url: data.image_url || "",
    });
    if (data.image_url) {
      setImagePreview(data.image_url);
    }
  };

  const loadDraft = async (userId: string) => {
    const { data } = await supabase
      .from("campaigns")
      .select("*")
      .eq("creator_id", userId)
      .eq("status", "draft")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setDraftId(data.id);
      setFormData({
        title: data.title || "",
        description: data.description || "",
        category: data.category || "",
        goal_amount: data.goal_amount?.toString() || "",
        deadline: data.deadline ? new Date(data.deadline).toISOString().split("T")[0] : "",
        story: data.story || "",
        video_url: data.video_url || "",
        image_url: data.image_url || "",
      });
      if (data.image_url) {
        setImagePreview(data.image_url);
      }
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof CampaignData, string>> = {};

    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = "Title is required";
      if (formData.title.length > 100) newErrors.title = "Title must be under 100 characters";
      if (!formData.description.trim()) newErrors.description = "Description is required";
      if (formData.description.length > 500) newErrors.description = "Description must be under 500 characters";
      if (!formData.category) newErrors.category = "Category is required";
    }

    if (step === 2) {
      if (!formData.goal_amount) newErrors.goal_amount = "Goal amount is required";
      const goalNum = parseFloat(formData.goal_amount);
      if (isNaN(goalNum) || goalNum < 1000) newErrors.goal_amount = "Minimum goal is ₹1,000";
      if (goalNum > 100000000) newErrors.goal_amount = "Maximum goal is ₹10 Crore";
      if (!formData.deadline) newErrors.deadline = "Deadline is required";
      const deadlineDate = new Date(formData.deadline);
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 7);
      if (deadlineDate < minDate) newErrors.deadline = "Deadline must be at least 7 days from now";
    }

    if (step === 3) {
      if (!formData.story.trim()) newErrors.story = "Campaign story is required";
      if (formData.story.length < 100) newErrors.story = "Story must be at least 100 characters";
      if (formData.video_url && !isValidUrl(formData.video_url)) {
        newErrors.video_url = "Please enter a valid URL";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be under 5MB",
          variant: "destructive",
        });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return formData.image_url || null;

    setUploadProgress(0);
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("campaign-images")
      .upload(fileName, imageFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      throw error;
    }

    setUploadProgress(100);
    const { data: { publicUrl } } = supabase.storage
      .from("campaign-images")
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const saveDraft = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      let imageUrl = formData.image_url;
      if (imageFile) {
        imageUrl = await uploadImage() || "";
      }

      const campaignData = {
        title: formData.title || "Untitled Campaign",
        description: formData.description || "No description",
        category: formData.category || "Community",
        goal_amount: parseFloat(formData.goal_amount) || 0,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
        story: formData.story || null,
        video_url: formData.video_url || null,
        image_url: imageUrl,
        creator_id: user.id,
        status: "draft",
        updated_at: new Date().toISOString(),
      };

      if (draftId) {
        const { error } = await supabase
          .from("campaigns")
          .update(campaignData)
          .eq("id", draftId)
          .eq("creator_id", user.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("campaigns")
          .insert(campaignData)
          .select()
          .single();

        if (error) throw error;
        setDraftId(data.id);
      }

      setFormData(prev => ({ ...prev, image_url: imageUrl || "" }));

      toast({
        title: "Draft Saved",
        description: "Your campaign draft has been saved",
      });
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: "Failed to save draft",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const submitForReview = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;
    setIsLoading(true);

    try {
      let imageUrl = formData.image_url;
      if (imageFile) {
        imageUrl = await uploadImage() || "";
      }

      const campaignData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        goal_amount: parseFloat(formData.goal_amount),
        deadline: new Date(formData.deadline).toISOString(),
        story: formData.story,
        video_url: formData.video_url || null,
        image_url: imageUrl,
        creator_id: user.id,
        status: "pending",
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (draftId) {
        const { error } = await supabase
          .from("campaigns")
          .update(campaignData)
          .eq("id", draftId)
          .eq("creator_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("campaigns")
          .insert(campaignData);

        if (error) throw error;
      }

      toast({
        title: "Campaign Submitted! 🎉",
        description: "Your campaign is now pending review. We'll notify you once it's approved.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Submit error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit campaign",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return "₹0";
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const progress = (currentStep / 4) * 100;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-8 bg-gradient-soft">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Create Your Campaign
            </h1>
            <p className="text-muted-foreground text-lg">
              Launch your fundraising campaign in just a few steps
            </p>
          </motion.div>
        </div>
      </section>

      {/* Progress Steps */}
      <section className="py-6 border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                      currentStep > step.id
                        ? "bg-primary border-primary text-primary-foreground"
                        : currentStep === step.id
                        ? "border-primary text-primary bg-primary/10"
                        : "border-muted-foreground/30 text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`hidden sm:block w-16 md:w-24 h-0.5 mx-2 transition-all ${
                        currentStep > step.id ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <Progress value={progress} className="h-1" />
            <p className="text-center text-sm text-muted-foreground mt-2">
              Step {currentStep} of 4: {steps[currentStep - 1].title}
            </p>
          </div>
        </div>
      </section>

      {/* Form Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <AnimatePresence mode="wait">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-card rounded-xl border border-border p-6 md:p-8"
                >
                  <h2 className="text-xl font-display font-semibold text-foreground mb-6">
                    Basic Information
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="title">Campaign Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Help Ravi Get Heart Surgery"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className={errors.title ? "border-destructive" : ""}
                        maxLength={100}
                      />
                      <div className="flex justify-between mt-1">
                        {errors.title && (
                          <p className="text-sm text-destructive">{errors.title}</p>
                        )}
                        <p className="text-xs text-muted-foreground ml-auto">
                          {formData.title.length}/100
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && (
                        <p className="text-sm text-destructive mt-1">{errors.category}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="description">Short Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Briefly describe what this campaign is about..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className={`min-h-[100px] ${errors.description ? "border-destructive" : ""}`}
                        maxLength={500}
                      />
                      <div className="flex justify-between mt-1">
                        {errors.description && (
                          <p className="text-sm text-destructive">{errors.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground ml-auto">
                          {formData.description.length}/500
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Goal & Timeline */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-card rounded-xl border border-border p-6 md:p-8"
                >
                  <h2 className="text-xl font-display font-semibold text-foreground mb-6">
                    Goal & Timeline
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="goal_amount">Fundraising Goal (₹) *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                        <Input
                          id="goal_amount"
                          type="number"
                          placeholder="100000"
                          value={formData.goal_amount}
                          onChange={(e) => setFormData({ ...formData, goal_amount: e.target.value })}
                          className={`pl-8 ${errors.goal_amount ? "border-destructive" : ""}`}
                          min={1000}
                          max={100000000}
                        />
                      </div>
                      {errors.goal_amount ? (
                        <p className="text-sm text-destructive mt-1">{errors.goal_amount}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">
                          Target: {formatCurrency(formData.goal_amount)}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="deadline">Campaign Deadline *</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        className={errors.deadline ? "border-destructive" : ""}
                        min={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                      />
                      {errors.deadline && (
                        <p className="text-sm text-destructive mt-1">{errors.deadline}</p>
                      )}
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium text-foreground mb-2">💡 Tips for setting your goal</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Be realistic about the amount you need</li>
                        <li>• Include any platform or payment fees</li>
                        <li>• Consider setting a stretch goal for extra impact</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Story & Media */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-card rounded-xl border border-border p-6 md:p-8"
                >
                  <h2 className="text-xl font-display font-semibold text-foreground mb-6">
                    Story & Media
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="story">Campaign Story *</Label>
                      <Textarea
                        id="story"
                        placeholder="Tell your story in detail. Why are you raising funds? How will the money be used? Share the impact this campaign will make..."
                        value={formData.story}
                        onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                        className={`min-h-[200px] ${errors.story ? "border-destructive" : ""}`}
                      />
                      <div className="flex justify-between mt-1">
                        {errors.story && (
                          <p className="text-sm text-destructive">{errors.story}</p>
                        )}
                        <p className="text-xs text-muted-foreground ml-auto">
                          {formData.story.length} characters (min 100)
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label>Campaign Image</Label>
                      <div className="mt-2">
                        {imagePreview ? (
                          <div className="relative rounded-lg overflow-hidden">
                            <img
                              src={imagePreview}
                              alt="Campaign preview"
                              className="w-full h-48 object-cover"
                            />
                            <button
                              onClick={() => {
                                setImageFile(null);
                                setImagePreview(null);
                                setFormData({ ...formData, image_url: "" });
                              }}
                              className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground">
                              Click to upload image
                            </span>
                            <span className="text-xs text-muted-foreground mt-1">
                              JPG, PNG, WebP (max 5MB)
                            </span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={handleImageChange}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="video_url">Video URL (Optional)</Label>
                      <Input
                        id="video_url"
                        type="url"
                        placeholder="https://youtube.com/watch?v=..."
                        value={formData.video_url}
                        onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                        className={errors.video_url ? "border-destructive" : ""}
                      />
                      {errors.video_url && (
                        <p className="text-sm text-destructive mt-1">{errors.video_url}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Add a YouTube or Vimeo link to help tell your story
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Review & Submit */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-card rounded-xl border border-border p-6 md:p-8"
                >
                  <h2 className="text-xl font-display font-semibold text-foreground mb-6">
                    Review Your Campaign
                  </h2>
                  
                  <div className="space-y-6">
                    {/* Preview Card */}
                    <div className="border border-border rounded-lg overflow-hidden">
                      {imagePreview && (
                        <img
                          src={imagePreview}
                          alt="Campaign"
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                            {formData.category}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {formData.title || "Campaign Title"}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {formData.description}
                        </p>
                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Goal</span>
                            <span className="font-semibold text-primary">
                              {formatCurrency(formData.goal_amount)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm mt-2">
                            <span className="text-muted-foreground">Deadline</span>
                            <span className="text-foreground">
                              {formData.deadline ? new Date(formData.deadline).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "long",
                                year: "numeric"
                              }) : "Not set"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Story Preview */}
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Campaign Story</h4>
                      <div className="bg-muted/50 rounded-lg p-4 max-h-40 overflow-y-auto">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {formData.story || "No story provided"}
                        </p>
                      </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-foreground">What happens next?</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          After submitting, our team will review your campaign within 24-48 hours. 
                          You'll receive a notification once it's approved and goes live.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-6">
              <div className="flex gap-2">
                {currentStep > 1 && (
                  <Button variant="outline" onClick={prevStep}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={saveDraft}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Draft
                </Button>

                {currentStep < 4 ? (
                  <Button variant="primary" onClick={nextStep}>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={submitForReview}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit for Review
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default CreateCampaign;