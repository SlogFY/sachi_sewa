import { useState, useEffect } from "react";
import { Loader2, Save, Plus, Trash2, Eye, FileText, BarChart3, Heart, Target, Upload, X, User, Linkedin, Twitter, Instagram, Facebook, Globe, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const ICON_OPTIONS = ["Heart", "Users", "Award", "Target", "CheckCircle", "Star", "Shield", "Globe"];

const AdminAboutSettings = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [aboutContent, setAboutContent] = useState("");
  const [stats, setStats] = useState<Stat[]>([]);
  const [values, setValues] = useState<Value[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [founder, setFounder] = useState<Founder>({ name: "", title: "", story: "", image_url: "" });

  const [originalData, setOriginalData] = useState({
    aboutContent: "",
    stats: "[]",
    values: "[]",
    milestones: "[]",
    founder: "{}",
  });

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .in("key", ["about_us_content", "about_stats", "about_values", "about_milestones", "about_founder"]);

      if (error) throw error;

      const contentSetting = data?.find((s) => s.key === "about_us_content");
      const statsSetting = data?.find((s) => s.key === "about_stats");
      const valuesSetting = data?.find((s) => s.key === "about_values");
      const milestonesSetting = data?.find((s) => s.key === "about_milestones");
      const founderSetting = data?.find((s) => s.key === "about_founder");

      setAboutContent(contentSetting?.value || "");
      setStats(statsSetting ? JSON.parse(statsSetting.value) : []);
      setValues(valuesSetting ? JSON.parse(valuesSetting.value) : []);
      setMilestones(milestonesSetting ? JSON.parse(milestonesSetting.value) : []);
      setFounder(founderSetting ? JSON.parse(founderSetting.value) : { name: "", title: "", story: "", image_url: "" });

      setOriginalData({
        aboutContent: contentSetting?.value || "",
        stats: statsSetting?.value || "[]",
        values: valuesSetting?.value || "[]",
        milestones: milestonesSetting?.value || "[]",
        founder: founderSetting?.value || "{}",
      });
    } catch (error: any) {
      console.error("Fetch settings error:", error);
      toast({
        title: "Error",
        description: "Failed to fetch About Us settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = [
        { key: "about_us_content", value: aboutContent, description: "Content for About Us page" },
        { key: "about_stats", value: JSON.stringify(stats), description: "Stats shown on About Us page" },
        { key: "about_values", value: JSON.stringify(values), description: "Core values shown on About Us page" },
        { key: "about_milestones", value: JSON.stringify(milestones), description: "Milestones shown on About Us page" },
        { key: "about_founder", value: JSON.stringify(founder), description: "Founder information for About Us page" },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("site_settings")
          .upsert(
            { key: update.key, value: update.value, description: update.description },
            { onConflict: "key" }
          );

        if (error) throw error;
      }

      toast({
        title: "Settings Saved",
        description: "About Us page settings have been updated successfully.",
      });
      fetchSettings();
    } catch (error: any) {
      console.error("Save settings error:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    aboutContent !== originalData.aboutContent ||
    JSON.stringify(stats) !== originalData.stats ||
    JSON.stringify(values) !== originalData.values ||
    JSON.stringify(milestones) !== originalData.milestones ||
    JSON.stringify(founder) !== originalData.founder;

  // Stats handlers
  const addStat = () => setStats([...stats, { value: "", label: "" }]);
  const removeStat = (index: number) => setStats(stats.filter((_, i) => i !== index));
  const updateStat = (index: number, field: keyof Stat, value: string) => {
    const updated = [...stats];
    updated[index][field] = value;
    setStats(updated);
  };

  // Values handlers
  const addValue = () => setValues([...values, { icon: "Heart", title: "", description: "" }]);
  const removeValue = (index: number) => setValues(values.filter((_, i) => i !== index));
  const updateValue = (index: number, field: keyof Value, value: string) => {
    const updated = [...values];
    updated[index][field] = value;
    setValues(updated);
  };

  // Milestones handlers
  const addMilestone = () => setMilestones([...milestones, { year: "", title: "", description: "", image_url: "" }]);
  const removeMilestone = (index: number) => setMilestones(milestones.filter((_, i) => i !== index));
  const updateMilestone = (index: number, field: keyof Milestone, value: string) => {
    const updated = [...milestones];
    (updated[index] as any)[field] = value;
    setMilestones(updated);
  };

  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadingFounder, setUploadingFounder] = useState(false);

  // Founder image upload
  const handleFounderImageUpload = async (file: File) => {
    if (!file) return;
    
    setUploadingFounder(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `founder-${Date.now()}.${fileExt}`;
      const filePath = `founder/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('campaign-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('campaign-images')
        .getPublicUrl(filePath);

      setFounder(prev => ({ ...prev, image_url: publicUrl }));
      
      toast({
        title: "Image Uploaded",
        description: "Founder photo has been uploaded successfully.",
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingFounder(false);
    }
  };

  const handleMilestoneImageUpload = async (index: number, file: File) => {
    if (!file) return;
    
    setUploadingIndex(index);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `milestone-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `milestones/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('campaign-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('campaign-images')
        .getPublicUrl(filePath);

      updateMilestone(index, 'image_url', publicUrl);
      
      toast({
        title: "Image Uploaded",
        description: "Milestone image has been uploaded successfully.",
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingIndex(null);
    }
  };

  const removeMilestoneImage = (index: number) => {
    updateMilestone(index, 'image_url', '');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* About Content */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              About Us Content
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Main content displayed on the About Us page. Use # for headings and ## for subheadings.
            </p>
          </div>
          <Link
            to="/about"
            target="_blank"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <Eye className="w-3 h-3" />
            Preview Page
          </Link>
        </div>
        <Textarea
          value={aboutContent}
          onChange={(e) => setAboutContent(e.target.value)}
          placeholder="Enter About Us content..."
          rows={10}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground mt-2">
          Use markdown format: # Heading, ## Subheading, - **Bold**: text for bullet points
        </p>
      </div>

      {/* Stats Section */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Impact Stats
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Statistics displayed prominently on the About Us page
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={addStat}>
            <Plus className="w-4 h-4 mr-2" />
            Add Stat
          </Button>
        </div>

        <div className="space-y-4">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Value (e.g., 1000+, ₹50L+)</Label>
                  <Input
                    value={stat.value}
                    onChange={(e) => updateStat(index, "value", e.target.value)}
                    placeholder="1000+"
                  />
                </div>
                <div>
                  <Label className="text-xs">Label</Label>
                  <Input
                    value={stat.label}
                    onChange={(e) => updateStat(index, "label", e.target.value)}
                    placeholder="Lives Changed"
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeStat(index)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {stats.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No stats added yet</p>
          )}
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Core Values
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your organization's core values displayed with icons
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={addValue}>
            <Plus className="w-4 h-4 mr-2" />
            Add Value
          </Button>
        </div>

        <div className="space-y-4">
          {values.map((value, index) => (
            <div key={index} className="p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-start gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                  <div>
                    <Label className="text-xs">Icon</Label>
                    <Select
                      value={value.icon}
                      onValueChange={(v) => updateValue(index, "icon", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select icon" />
                      </SelectTrigger>
                      <SelectContent>
                        {ICON_OPTIONS.map((icon) => (
                          <SelectItem key={icon} value={icon}>
                            {icon}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs">Title</Label>
                    <Input
                      value={value.title}
                      onChange={(e) => updateValue(index, "title", e.target.value)}
                      placeholder="Compassion"
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeValue(index)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Textarea
                  value={value.description}
                  onChange={(e) => updateValue(index, "description", e.target.value)}
                  placeholder="We believe in the power of empathy and kindness to transform lives."
                  rows={2}
                />
              </div>
            </div>
          ))}
          {values.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No values added yet</p>
          )}
        </div>
      </div>

      {/* Milestones Section */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Milestones Timeline
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your organization's journey and achievements
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={addMilestone}>
            <Plus className="w-4 h-4 mr-2" />
            Add Milestone
          </Button>
        </div>

        <div className="space-y-4">
          {milestones.map((milestone, index) => (
            <div key={index} className="p-4 bg-muted/50 rounded-lg space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs">Year</Label>
                    <Input
                      value={milestone.year}
                      onChange={(e) => updateMilestone(index, "year", e.target.value)}
                      placeholder="2024"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Label className="text-xs">Title</Label>
                    <Input
                      value={milestone.title}
                      onChange={(e) => updateMilestone(index, "title", e.target.value)}
                      placeholder="Major Achievement"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      value={milestone.description}
                      onChange={(e) => updateMilestone(index, "description", e.target.value)}
                      placeholder="Brief description of this milestone..."
                      rows={2}
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMilestone(index)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Image Upload Section */}
              <div>
                <Label className="text-xs">Milestone Image (Optional)</Label>
                <div className="mt-2">
                  {milestone.image_url ? (
                    <div className="relative inline-block">
                      <img
                        src={milestone.image_url}
                        alt={milestone.title}
                        className="w-32 h-20 object-cover rounded-lg border border-border"
                      />
                      <button
                        onClick={() => removeMilestoneImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors w-fit">
                      {uploadingIndex === index ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span className="text-sm">
                        {uploadingIndex === index ? "Uploading..." : "Upload Image"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleMilestoneImageUpload(index, file);
                        }}
                        disabled={uploadingIndex !== null}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          ))}
          {milestones.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No milestones added yet</p>
          )}
        </div>
      </div>

      {/* Founder Section */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Our Founder
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Founder information displayed on About Us page
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Photo Upload */}
          <div>
            <Label className="text-xs">Founder Photo</Label>
            <div className="mt-2 flex items-start gap-4">
              {founder.image_url ? (
                <div className="relative">
                  <img
                    src={founder.image_url}
                    alt={founder.name || "Founder"}
                    className="w-32 h-32 object-cover rounded-full border-4 border-primary/20"
                  />
                  <button
                    onClick={() => setFounder(prev => ({ ...prev, image_url: "" }))}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-32 h-32 bg-muted/50 border-2 border-dashed border-border rounded-full cursor-pointer hover:bg-muted transition-colors">
                  {uploadingFounder ? (
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Upload</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFounderImageUpload(file);
                    }}
                    disabled={uploadingFounder}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Name</Label>
              <Input
                value={founder.name}
                onChange={(e) => setFounder(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Founder Name"
              />
            </div>
            <div>
              <Label className="text-xs">Title / Designation</Label>
              <Input
                value={founder.title}
                onChange={(e) => setFounder(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Founder & CEO"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Story / Bio</Label>
            <Textarea
              value={founder.story}
              onChange={(e) => setFounder(prev => ({ ...prev, story: e.target.value }))}
              placeholder="Write a short story about the founder..."
              rows={5}
            />
          </div>

          {/* Social Links */}
          <div>
            <Label className="text-xs mb-3 block">Social Media Links</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-[#0077B5]/10 rounded-lg flex items-center justify-center shrink-0">
                  <Linkedin className="w-5 h-5 text-[#0077B5]" />
                </div>
                <Input
                  value={founder.socials?.linkedin || ""}
                  onChange={(e) => setFounder(prev => ({ 
                    ...prev, 
                    socials: { ...prev.socials, linkedin: e.target.value } 
                  }))}
                  placeholder="LinkedIn URL"
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-[#1DA1F2]/10 rounded-lg flex items-center justify-center shrink-0">
                  <Twitter className="w-5 h-5 text-[#1DA1F2]" />
                </div>
                <Input
                  value={founder.socials?.twitter || ""}
                  onChange={(e) => setFounder(prev => ({ 
                    ...prev, 
                    socials: { ...prev.socials, twitter: e.target.value } 
                  }))}
                  placeholder="Twitter URL"
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-[#E4405F]/10 rounded-lg flex items-center justify-center shrink-0">
                  <Instagram className="w-5 h-5 text-[#E4405F]" />
                </div>
                <Input
                  value={founder.socials?.instagram || ""}
                  onChange={(e) => setFounder(prev => ({ 
                    ...prev, 
                    socials: { ...prev.socials, instagram: e.target.value } 
                  }))}
                  placeholder="Instagram URL"
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-[#1877F2]/10 rounded-lg flex items-center justify-center shrink-0">
                  <Facebook className="w-5 h-5 text-[#1877F2]" />
                </div>
                <Input
                  value={founder.socials?.facebook || ""}
                  onChange={(e) => setFounder(prev => ({ 
                    ...prev, 
                    socials: { ...prev.socials, facebook: e.target.value } 
                  }))}
                  placeholder="Facebook URL"
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <Input
                  value={founder.socials?.website || ""}
                  onChange={(e) => setFounder(prev => ({ 
                    ...prev, 
                    socials: { ...prev.socials, website: e.target.value } 
                  }))}
                  placeholder="Personal Website URL"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Founder Quote */}
          <div>
            <Label className="text-xs flex items-center gap-2">
              <Quote className="w-4 h-4 text-primary" />
              Inspirational Quote
            </Label>
            <Textarea
              value={founder.quote || ""}
              onChange={(e) => setFounder(prev => ({ ...prev, quote: e.target.value }))}
              placeholder="Enter an inspirational quote from the founder..."
              rows={3}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This quote will be displayed prominently on the About Us page
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          size="lg"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save All Changes
        </Button>
      </div>
    </div>
  );
};

export default AdminAboutSettings;