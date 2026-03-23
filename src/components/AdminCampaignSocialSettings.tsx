import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Share2, ExternalLink, Plus, X, Upload, Image, Video } from "lucide-react";
import { FaWhatsapp, FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from "react-icons/fa";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";

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
  amount_raised: number;
  goal_amount: number;
  social_share_options: SocialShareOptions | null;
  social_links: SocialLinks | null;
  completion_content: string | null;
  completion_media: string[] | null;
}

const AdminCampaignSocialSettings = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [editedMedia, setEditedMedia] = useState<Record<string, string[]>>({});
  const [newMediaUrl, setNewMediaUrl] = useState<Record<string, string>>({});
  const [editedLinks, setEditedLinks] = useState<Record<string, SocialLinks>>({});
  const [uploadingMedia, setUploadingMedia] = useState<Record<string, boolean>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetchCompletedCampaigns();
  }, []);

  const fetchCompletedCampaigns = async () => {
    const { data, error } = await supabase
      .from("campaigns")
      .select("id, title, amount_raised, goal_amount, social_share_options, social_links, completion_content, completion_media")
      .eq("status", "live")
      .eq("is_active", true);

    if (!error && data) {
      const completed = data.filter(
        (campaign) =>
          (Number(campaign.amount_raised) / Number(campaign.goal_amount)) * 100 >= 100
      );
      
      const typedCampaigns = completed.map(c => ({
        ...c,
        social_share_options: c.social_share_options as SocialShareOptions | null,
        social_links: c.social_links as SocialLinks | null,
        completion_media: (c.completion_media as string[]) || []
      })) as Campaign[];
      
      setCampaigns(typedCampaigns);
      
      // Initialize edited states
      const contentMap: Record<string, string> = {};
      const mediaMap: Record<string, string[]> = {};
      const linksMap: Record<string, SocialLinks> = {};
      
      typedCampaigns.forEach(c => {
        contentMap[c.id] = c.completion_content || "";
        mediaMap[c.id] = c.completion_media || [];
        linksMap[c.id] = c.social_links || {};
      });
      
      setEditedContent(contentMap);
      setEditedMedia(mediaMap);
      setEditedLinks(linksMap);
    }
    setIsLoading(false);
  };

  const handleToggle = (campaignId: string, platform: string, currentValue: boolean) => {
    setCampaigns((prev) =>
      prev.map((campaign) => {
        if (campaign.id === campaignId) {
          return {
            ...campaign,
            social_share_options: {
              ...campaign.social_share_options,
              [platform]: !currentValue,
            },
          };
        }
        return campaign;
      })
    );
  };

  const handleLinkChange = (campaignId: string, platform: string, value: string) => {
    setEditedLinks((prev) => ({
      ...prev,
      [campaignId]: {
        ...prev[campaignId],
        [platform]: value,
      },
    }));
  };

  const handleAddMedia = (campaignId: string) => {
    const url = newMediaUrl[campaignId]?.trim();
    if (!url) return;
    
    setEditedMedia((prev) => ({
      ...prev,
      [campaignId]: [...(prev[campaignId] || []), url],
    }));
    setNewMediaUrl((prev) => ({ ...prev, [campaignId]: "" }));
  };

  const handleRemoveMedia = (campaignId: string, index: number) => {
    setEditedMedia((prev) => ({
      ...prev,
      [campaignId]: prev[campaignId]?.filter((_, i) => i !== index) || [],
    }));
  };

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1, // Compress to max 1MB
      maxWidthOrHeight: 1920, // Max dimension
      useWebWorker: true,
      fileType: file.type as "image/jpeg" | "image/png" | "image/webp",
    };

    try {
      const compressedFile = await imageCompression(file, options);
      const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(0);
      console.log(`Compressed ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB (${compressionRatio}% smaller)`);
      return compressedFile;
    } catch (error) {
      console.error('Compression failed, using original:', error);
      return file;
    }
  };

  const handleFileUpload = async (campaignId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingMedia((prev) => ({ ...prev, [campaignId]: true }));
    
    try {
      const uploadedUrls: string[] = [];
      
      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');
        
        if (!isVideo && !isImage) {
          toast.error(`${file.name} is not a valid image or video file`);
          continue;
        }

        // Check file size (max 50MB for videos, 20MB for images before compression)
        const maxSize = isVideo ? 50 * 1024 * 1024 : 20 * 1024 * 1024;
        if (file.size > maxSize) {
          toast.error(`${file.name} is too large. Max size: ${isVideo ? '50MB' : '20MB'}`);
          continue;
        }

        // Compress images before upload
        let fileToUpload: File = file;
        if (isImage) {
          toast.info(`Compressing ${file.name}...`);
          fileToUpload = await compressImage(file);
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${campaignId}/completion-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('campaign-images')
          .upload(fileName, fileToUpload, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          console.error('Upload error:', error);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('campaign-images')
          .getPublicUrl(data.path);

        uploadedUrls.push(urlData.publicUrl);
      }

      if (uploadedUrls.length > 0) {
        setEditedMedia((prev) => ({
          ...prev,
          [campaignId]: [...(prev[campaignId] || []), ...uploadedUrls],
        }));
        toast.success(`${uploadedUrls.length} file(s) uploaded successfully!`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploadingMedia((prev) => ({ ...prev, [campaignId]: false }));
      // Reset file input
      if (fileInputRefs.current[campaignId]) {
        fileInputRefs.current[campaignId]!.value = '';
      }
    }
  };

  const handleSave = async (campaign: Campaign) => {
    setSavingId(campaign.id);
    
    const { error } = await supabase
      .from("campaigns")
      .update({
        social_share_options: campaign.social_share_options as Record<string, boolean>,
        social_links: (editedLinks[campaign.id] || {}) as Record<string, string>,
        completion_content: editedContent[campaign.id] || null,
        completion_media: editedMedia[campaign.id] || [],
      })
      .eq("id", campaign.id);
    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("Campaign settings saved!");
    }
    setSavingId(null);
  };

  const socialPlatforms = [
    { key: "whatsapp", label: "WhatsApp", icon: FaWhatsapp, color: "text-green-500" },
    { key: "facebook", label: "Facebook", icon: FaFacebook, color: "text-blue-600" },
    { key: "twitter", label: "Twitter", icon: FaTwitter, color: "text-sky-500" },
    { key: "linkedin", label: "LinkedIn", icon: FaLinkedin, color: "text-blue-700" },
    { key: "instagram", label: "Instagram", icon: FaInstagram, color: "text-pink-500" },
  ];

  const getShareUrl = (campaignId: string) => {
    return `${window.location.origin}/completed-donations/${campaignId}`;
  };

  const isVideoUrl = (url: string) => {
    return url.includes("youtube") || url.includes("youtu.be") || url.includes("vimeo") || url.endsWith(".mp4") || url.endsWith(".webm");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Campaign Social Share Settings
          </CardTitle>
          <CardDescription>
            Configure social media buttons and completion content for completed campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No completed campaigns yet. Once campaigns reach 100% funding, they will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="w-5 h-5" />
          Campaign Social Share Settings
        </CardTitle>
        <CardDescription>
          Configure social media buttons, custom links, and completion content for each campaign
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="border rounded-lg p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-foreground text-lg">{campaign.title}</h4>
                <a
                  href={getShareUrl(campaign.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  View shareable page <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <Button
                onClick={() => handleSave(campaign)}
                disabled={savingId === campaign.id}
              >
                {savingId === campaign.id ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save All Changes
              </Button>
            </div>

            {/* Completion Content */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Completion Content (Shows after "Goal Reached!")</Label>
              <Textarea
                value={editedContent[campaign.id] || ""}
                onChange={(e) =>
                  setEditedContent((prev) => ({
                    ...prev,
                    [campaign.id]: e.target.value,
                  }))
                }
                placeholder="Add content to display after the goal reached banner..."
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Completion Media */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Media (Photos & Videos)</Label>
              
              {/* Existing Media */}
              {editedMedia[campaign.id]?.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {editedMedia[campaign.id].map((url, index) => (
                    <div key={index} className="relative group">
                      {isVideoUrl(url) ? (
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border">
                          <Video className="w-8 h-8 text-muted-foreground" />
                          <span className="sr-only">Video</span>
                        </div>
                      ) : (
                        <img
                          src={url}
                          alt={`Media ${index + 1}`}
                          className="w-full aspect-video object-cover rounded-lg border"
                        />
                      )}
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveMedia(campaign.id, index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
            {/* Upload Media */}
              <div className="flex flex-wrap gap-2">
                <input
                  ref={(el) => (fileInputRefs.current[campaign.id] = el)}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(campaign.id, e.target.files)}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRefs.current[campaign.id]?.click()}
                  disabled={uploadingMedia[campaign.id]}
                  className="gap-2"
                >
                  {uploadingMedia[campaign.id] ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {uploadingMedia[campaign.id] ? 'Uploading...' : 'Upload Photos/Videos'}
                </Button>
              </div>

              {/* Or add by URL */}
              <div className="flex gap-2">
                <Input
                  value={newMediaUrl[campaign.id] || ""}
                  onChange={(e) =>
                    setNewMediaUrl((prev) => ({
                      ...prev,
                      [campaign.id]: e.target.value,
                    }))
                  }
                  placeholder="Or paste image/video URL..."
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => handleAddMedia(campaign.id)}
                  disabled={!newMediaUrl[campaign.id]?.trim()}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add URL
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Upload photos & videos directly, or paste YouTube/Vimeo links. Images are auto-compressed to ~1MB. Max: 50MB for videos.
              </p>
            </div>

            {/* Social Toggle & Links */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Social Media Buttons & Custom Links</Label>
              <div className="space-y-4">
                {socialPlatforms.map((platform) => {
                  const isEnabled =
                    campaign.social_share_options?.[platform.key as keyof SocialShareOptions] ?? true;
                  return (
                    <div key={platform.key} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                      <Switch
                        id={`${campaign.id}-${platform.key}`}
                        checked={isEnabled}
                        onCheckedChange={() =>
                          handleToggle(campaign.id, platform.key, isEnabled)
                        }
                      />
                      <Label
                        htmlFor={`${campaign.id}-${platform.key}`}
                        className="flex items-center gap-2 cursor-pointer min-w-[120px]"
                      >
                        <platform.icon className={`w-5 h-5 ${platform.color}`} />
                        <span>{platform.label}</span>
                      </Label>
                      <Input
                        value={editedLinks[campaign.id]?.[platform.key as keyof SocialLinks] || ""}
                        onChange={(e) =>
                          handleLinkChange(campaign.id, platform.key, e.target.value)
                        }
                        placeholder={`Custom ${platform.label} link (optional)`}
                        className="flex-1"
                        disabled={!isEnabled}
                      />
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Leave link empty to use default share behavior. Add custom link to redirect to specific page.
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AdminCampaignSocialSettings;
