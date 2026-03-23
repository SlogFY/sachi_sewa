import { useState, useEffect } from "react";
import { Loader2, Save, HelpCircle, FileText, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface SupportSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
}

const AdminSupportSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SupportSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  const supportKeys = [
    "privacy_policy_content",
    "terms_of_service_content",
    "refund_policy_content",
    "contact_address",
    "contact_phone",
    "contact_email",
  ];

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .in("key", supportKeys)
        .order("key");

      if (error) throw error;
      setSettings(data || []);

      const values: Record<string, string> = {};
      data?.forEach((s) => {
        values[s.key] = s.value;
      });
      setEditedValues(values);
    } catch (error: any) {
      console.error("Fetch settings error:", error);
      toast({
        title: "Error",
        description: "Failed to fetch support settings",
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
        description: "Support settings have been updated successfully.",
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

  const contentPages = [
    { key: "privacy_policy_content", label: "Privacy Policy", path: "/privacy-policy" },
    { key: "terms_of_service_content", label: "Terms of Service", path: "/terms-of-service" },
    { key: "refund_policy_content", label: "Refund Policy", path: "/refund-policy" },
  ];

  const contactSettings = [
    { key: "contact_address", label: "Contact Address", placeholder: "123 Main Street, City, Country", type: "textarea" },
    { key: "contact_phone", label: "Contact Phone", placeholder: "+91 98765 43210", type: "input" },
    { key: "contact_email", label: "Contact Email", placeholder: "contact@example.com", type: "input" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Content Management */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Page Content Management
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Edit content for policy pages. Use # for headings and ## for subheadings.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {contentPages.map((page) => {
            const setting = settings.find((s) => s.key === page.key);
            
            return (
              <div key={page.key} className="space-y-3 border-b border-border pb-6 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <Label htmlFor={page.key} className="text-base font-medium">
                    {page.label}
                  </Label>
                  <Link
                    to={page.path}
                    target="_blank"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Preview Page
                  </Link>
                </div>
                <Textarea
                  id={page.key}
                  value={editedValues[page.key] || ""}
                  onChange={(e) => handleChange(page.key, e.target.value)}
                  placeholder={`Enter ${page.label.toLowerCase()} content...`}
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Use markdown format: # Heading, ## Subheading, regular text for paragraphs
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Contact Information
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Configure the contact details shown in the footer
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {contactSettings.map((config) => {
            return (
              <div key={config.key} className="space-y-2">
                <Label htmlFor={config.key}>{config.label}</Label>
                {config.type === "textarea" ? (
                  <Textarea
                    id={config.key}
                    value={editedValues[config.key] || ""}
                    onChange={(e) => handleChange(config.key, e.target.value)}
                    placeholder={config.placeholder}
                    rows={2}
                  />
                ) : (
                  <Input
                    id={config.key}
                    value={editedValues[config.key] || ""}
                    onChange={(e) => handleChange(config.key, e.target.value)}
                    placeholder={config.placeholder}
                  />
                )}
              </div>
            );
          })}
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

export default AdminSupportSettings;
