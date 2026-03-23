import { useState, useEffect } from "react";
import { Loader2, Save, RefreshCw, BarChart3, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useImpactStatsAdmin } from "@/hooks/useImpactStats";

const AdminImpactStatsSettings = () => {
  const { toast } = useToast();
  const { config, autoStats, isLoading, isSaving, saveConfig, refetch, formatNumber, formatCurrency } = useImpactStatsAdmin();

  const [useAutoCalculated, setUseAutoCalculated] = useState(true);
  const [overrides, setOverrides] = useState({
    livesChanged: "",
    fundsRaised: "",
    fundraisers: "",
  });

  useEffect(() => {
    if (config) {
      setUseAutoCalculated(config.useAutoCalculated !== false);
      setOverrides({
        livesChanged: config.overrides?.livesChanged || "",
        fundsRaised: config.overrides?.fundsRaised || "",
        fundraisers: config.overrides?.fundraisers || "",
      });
    }
  }, [config]);

  const handleSave = async () => {
    const newConfig = {
      useAutoCalculated,
      overrides: {
        livesChanged: overrides.livesChanged || undefined,
        fundsRaised: overrides.fundsRaised || undefined,
        fundraisers: overrides.fundraisers || undefined,
      },
    };

    const success = await saveConfig(newConfig);
    if (success) {
      toast({
        title: "Settings Saved",
        description: "Impact stats settings have been updated.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    }
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
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Impact Stats (Homepage & About)
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Auto-calculated from database or manually override
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Auto-calculated Stats Preview */}
      <div className="bg-muted/50 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Auto-Calculated Values (from database)</span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">
              {autoStats ? formatNumber(autoStats.donors) : "-"}
            </div>
            <div className="text-xs text-muted-foreground">Unique Donors</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">
              {autoStats ? formatCurrency(autoStats.funds) : "-"}
            </div>
            <div className="text-xs text-muted-foreground">Total Donations</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">
              {autoStats ? formatNumber(autoStats.campaigns) : "-"}
            </div>
            <div className="text-xs text-muted-foreground">Live Campaigns</div>
          </div>
        </div>
      </div>

      {/* Use Auto-Calculated Toggle */}
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg mb-6">
        <div>
          <Label className="font-medium">Use Auto-Calculated Values</Label>
          <p className="text-xs text-muted-foreground mt-1">
            When enabled, stats are calculated from actual database data
          </p>
        </div>
        <Switch
          checked={useAutoCalculated}
          onCheckedChange={setUseAutoCalculated}
        />
      </div>

      {/* Override Fields */}
      <div className="space-y-4">
        <div className="text-sm font-medium text-foreground">
          Manual Overrides {useAutoCalculated ? "(Optional - leave empty to use auto)" : "(Required when auto is off)"}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs">Lives Changed</Label>
            <Input
              value={overrides.livesChanged}
              onChange={(e) => setOverrides(prev => ({ ...prev, livesChanged: e.target.value }))}
              placeholder={useAutoCalculated ? autoStats ? formatNumber(autoStats.donors) : "Auto" : "e.g., 1000+"}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {overrides.livesChanged ? "Using override" : useAutoCalculated ? "Using auto value" : "Enter value"}
            </p>
          </div>
          
          <div>
            <Label className="text-xs">Funds Raised</Label>
            <Input
              value={overrides.fundsRaised}
              onChange={(e) => setOverrides(prev => ({ ...prev, fundsRaised: e.target.value }))}
              placeholder={useAutoCalculated ? autoStats ? formatCurrency(autoStats.funds) : "Auto" : "e.g., ₹50L+"}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {overrides.fundsRaised ? "Using override" : useAutoCalculated ? "Using auto value" : "Enter value"}
            </p>
          </div>
          
          <div>
            <Label className="text-xs">Fundraisers</Label>
            <Input
              value={overrides.fundraisers}
              onChange={(e) => setOverrides(prev => ({ ...prev, fundraisers: e.target.value }))}
              placeholder={useAutoCalculated ? autoStats ? formatNumber(autoStats.campaigns) : "Auto" : "e.g., 100+"}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {overrides.fundraisers ? "Using override" : useAutoCalculated ? "Using auto value" : "Enter value"}
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end mt-6 pt-4 border-t border-border">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default AdminImpactStatsSettings;
