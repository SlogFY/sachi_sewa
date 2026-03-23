import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Image, Upload, Loader2, Save, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface WallpaperSetting {
  key: string;
  label: string;
  description: string;
  value: string;
}

const wallpaperPages: Omit<WallpaperSetting, "value">[] = [
  {
    key: "home_wallpaper",
    label: "Home Page",
    description: "Hero section background on the homepage",
  },
  {
    key: "about_wallpaper",
    label: "About Page",
    description: "Hero section background on the About page",
  },
  {
    key: "causes_wallpaper",
    label: "Causes Page",
    description: "Hero section background on the Causes page",
  },
  {
    key: "fundraisers_wallpaper",
    label: "Fundraisers Page",
    description: "Hero section background on the Fundraisers page",
  },
  {
    key: "contact_wallpaper",
    label: "Contact Page",
    description: "Hero section background on the Contact page",
  },
  {
    key: "how_it_works_wallpaper",
    label: "How It Works Page",
    description: "Hero section background on the How It Works page",
  },
];

const DEFAULT_OVERLAY_OPACITY = 40;

const AdminWallpaperSettings = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [wallpapers, setWallpapers] = useState<Record<string, string>>({});
  const [overlayOpacities, setOverlayOpacities] = useState<Record<string, number>>({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const fetchWallpapers = async () => {
    setIsLoading(true);
    try {
      const allKeys = [
        ...wallpaperPages.map((p) => p.key),
        ...wallpaperPages.map((p) => `${p.key}_overlay_opacity`),
      ];

      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", allKeys);

      if (error) throw error;

      const wallpaperData: Record<string, string> = {};
      const opacityData: Record<string, number> = {};
      
      data?.forEach((item) => {
        if (item.key.endsWith("_overlay_opacity")) {
          const pageKey = item.key.replace("_overlay_opacity", "");
          opacityData[pageKey] = parseInt(item.value) || DEFAULT_OVERLAY_OPACITY;
        } else {
          wallpaperData[item.key] = item.value;
        }
      });
      
      // Set defaults for pages without opacity settings
      wallpaperPages.forEach((page) => {
        if (opacityData[page.key] === undefined) {
          opacityData[page.key] = DEFAULT_OVERLAY_OPACITY;
        }
      });
      
      setWallpapers(wallpaperData);
      setOverlayOpacities(opacityData);
    } catch (error) {
      console.error("Error fetching wallpapers:", error);
      toast({
        title: "Error",
        description: "Failed to load wallpaper settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWallpapers();
  }, []);

  const handleUrlChange = (key: string, value: string) => {
    setWallpapers((prev) => ({ ...prev, [key]: value }));
  };

  const handleOpacityChange = (key: string, value: number[]) => {
    setOverlayOpacities((prev) => ({ ...prev, [key]: value[0] }));
  };

  const handleImageUpload = async (key: string, file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingKey(key);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${key}_${Date.now()}.${fileExt}`;
      const filePath = `wallpapers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("campaign-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("campaign-images")
        .getPublicUrl(filePath);

      setWallpapers((prev) => ({ ...prev, [key]: urlData.publicUrl }));

      toast({
        title: "Image Uploaded",
        description: "Wallpaper image uploaded successfully",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingKey(null);
    }
  };

  const handleSave = async (key: string) => {
    setIsSaving(true);
    try {
      const value = wallpapers[key] || "";
      const opacityKey = `${key}_overlay_opacity`;
      const opacityValue = String(overlayOpacities[key] ?? DEFAULT_OVERLAY_OPACITY);

      // Save wallpaper URL
      const { data: existingWallpaper } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", key)
        .single();

      if (existingWallpaper) {
        const { error } = await supabase
          .from("site_settings")
          .update({ value, updated_at: new Date().toISOString() })
          .eq("key", key);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_settings").insert({
          key,
          value,
          description: `Wallpaper for ${key.replace("_wallpaper", "").replace("_", " ")} page`,
        });
        if (error) throw error;
      }

      // Save overlay opacity
      const { data: existingOpacity } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", opacityKey)
        .single();

      if (existingOpacity) {
        const { error } = await supabase
          .from("site_settings")
          .update({ value: opacityValue, updated_at: new Date().toISOString() })
          .eq("key", opacityKey);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_settings").insert({
          key: opacityKey,
          value: opacityValue,
          description: `Overlay opacity for ${key.replace("_wallpaper", "").replace("_", " ")} page`,
        });
        if (error) throw error;
      }

      toast({
        title: "Saved!",
        description: "Wallpaper and overlay settings saved successfully",
      });
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: "Failed to save wallpaper setting",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = (key: string) => {
    setWallpapers((prev) => ({ ...prev, [key]: "" }));
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
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Image className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Page Wallpapers</h2>
          <p className="text-sm text-muted-foreground">
            Manage hero section background images for each page
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {wallpaperPages.map((page, index) => (
          <motion.div
            key={page.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="bg-card rounded-xl border border-border p-6"
          >
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Preview with overlay */}
              <div className="lg:w-48 shrink-0">
                <div className="aspect-video rounded-lg overflow-hidden bg-muted border border-border relative">
                  {wallpapers[page.key] ? (
                    <>
                      <img
                        src={wallpapers[page.key]}
                        alt={page.label}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://via.placeholder.com/400x225?text=Invalid+URL";
                        }}
                      />
                      <div 
                        className="absolute inset-0 bg-black transition-opacity" 
                        style={{ opacity: (overlayOpacities[page.key] ?? DEFAULT_OVERLAY_OPACITY) / 100 }}
                      />
                      <span className="absolute bottom-1 right-1 text-[10px] text-white bg-black/50 px-1 rounded">
                        {overlayOpacities[page.key] ?? DEFAULT_OVERLAY_OPACITY}%
                      </span>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Image className="w-8 h-8" />
                    </div>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground">{page.label}</h3>
                  <p className="text-sm text-muted-foreground">{page.description}</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor={`url-${page.key}`} className="text-sm">
                      Image URL
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id={`url-${page.key}`}
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={wallpapers[page.key] || ""}
                        onChange={(e) => handleUrlChange(page.key, e.target.value)}
                        className="flex-1"
                      />
                      {wallpapers[page.key] && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(wallpapers[page.key], "_blank")}
                          title="Open in new tab"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">or</span>
                    <Label
                      htmlFor={`file-${page.key}`}
                      className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-muted hover:bg-muted/80 rounded-md text-sm transition-colors"
                    >
                      {uploadingKey === page.key ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Upload Image
                    </Label>
                    <input
                      id={`file-${page.key}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(page.key, file);
                      }}
                      disabled={uploadingKey === page.key}
                    />
                  </div>

                  {/* Overlay Opacity Slider */}
                  <div className="pt-3 border-t border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm">Overlay Darkness</Label>
                      <span className="text-sm font-medium text-primary">
                        {overlayOpacities[page.key] ?? DEFAULT_OVERLAY_OPACITY}%
                      </span>
                    </div>
                    <Slider
                      value={[overlayOpacities[page.key] ?? DEFAULT_OVERLAY_OPACITY]}
                      onValueChange={(value) => handleOpacityChange(page.key, value)}
                      min={0}
                      max={90}
                      step={5}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      0% = No overlay, 90% = Maximum darkness
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleSave(page.key)}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save
                  </Button>
                  {wallpapers[page.key] && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemove(page.key)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminWallpaperSettings;
