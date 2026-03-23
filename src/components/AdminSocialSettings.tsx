import { useState, useEffect } from "react";
import { Loader2, Save, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SocialSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
}

const AdminSocialSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SocialSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  const socialMediaKeys = [
    "instagram_url",
    "facebook_url", 
    "whatsapp_number",
    "whatsapp_default_message",
    "twitter_url",
    "linkedin_url"
  ];

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .in("key", socialMediaKeys)
        .order("key");

      if (error) throw error;
      setSettings(data || []);
      
      // Initialize edited values
      const values: Record<string, string> = {};
      data?.forEach((s) => {
        values[s.key] = s.value;
      });
      setEditedValues(values);
    } catch (error: any) {
      console.error("Fetch settings error:", error);
      toast({
        title: "Error",
        description: "Failed to fetch settings",
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
      // Update each changed setting
      for (const setting of settings) {
        if (editedValues[setting.key] !== setting.value) {
          const { error } = await supabase
            .from("site_settings")
            .update({ value: editedValues[setting.key] })
            .eq("key", setting.key);

          if (error) throw error;
        }
      }

      toast({
        title: "Settings Saved",
        description: "Social media settings have been updated successfully.",
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

  const handleChange = (key: string, value: string) => {
    setEditedValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const hasChanges = settings.some((s) => editedValues[s.key] !== s.value);

  const settingLabels: Record<string, { label: string; placeholder: string; type: "input" | "textarea" }> = {
    instagram_url: { label: "Instagram URL", placeholder: "https://www.instagram.com/yourpage/", type: "input" },
    facebook_url: { label: "Facebook URL", placeholder: "https://www.facebook.com/yourpage/", type: "input" },
    whatsapp_number: { label: "WhatsApp Number", placeholder: "919311536630", type: "input" },
    whatsapp_default_message: { label: "WhatsApp Default Message", placeholder: "Hi! I would like to support this cause.", type: "textarea" },
    twitter_url: { label: "Twitter/X URL", placeholder: "https://x.com/yourhandle", type: "input" },
    linkedin_url: { label: "LinkedIn URL", placeholder: "https://www.linkedin.com/company/yourpage/", type: "input" },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Social Media Settings</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Configure social sharing links for campaign pages
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6">
        {settings.map((setting) => {
          const config = settingLabels[setting.key] || {
            label: setting.key,
            placeholder: "",
            type: "input" as const,
          };

          return (
            <div key={setting.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={setting.key}>{config.label}</Label>
                {config.type === "input" && editedValues[setting.key] && (
                  <a
                    href={editedValues[setting.key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    Preview <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              {config.type === "textarea" ? (
                <Textarea
                  id={setting.key}
                  value={editedValues[setting.key] || ""}
                  onChange={(e) => handleChange(setting.key, e.target.value)}
                  placeholder={config.placeholder}
                  rows={3}
                />
              ) : (
                <Input
                  id={setting.key}
                  value={editedValues[setting.key] || ""}
                  onChange={(e) => handleChange(setting.key, e.target.value)}
                  placeholder={config.placeholder}
                />
              )}
              {setting.description && (
                <p className="text-xs text-muted-foreground">{setting.description}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminSocialSettings;
