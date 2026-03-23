import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ImpactStat {
  value: string;
  label: string;
  autoValue?: string; // Auto-calculated value from DB
}

interface ImpactStatsConfig {
  useAutoCalculated: boolean;
  overrides: {
    livesChanged?: string;
    fundsRaised?: string;
    fundraisers?: string;
  };
}

const DEFAULT_STATS: ImpactStat[] = [
  { value: "1000+", label: "Lives Changed" },
  { value: "₹50L+", label: "Funds Raised" },
  { value: "100+", label: "Fundraisers" },
];

const formatNumber = (num: number): string => {
  if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr+`;
  if (num >= 100000) return `${(num / 100000).toFixed(1)}L+`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K+`;
  return `${num}+`;
};

const formatCurrency = (num: number): string => {
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr+`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L+`;
  if (num >= 1000) return `₹${Math.round(num / 1000)}K+`;
  return `₹${num}+`;
};

export const useImpactStats = () => {
  const [stats, setStats] = useState<ImpactStat[]>(DEFAULT_STATS);
  const [autoStats, setAutoStats] = useState<{ donors: number; funds: number; campaigns: number } | null>(null);
  const [config, setConfig] = useState<ImpactStatsConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        // Fetch auto-calculated stats from database
        const [donationsRes, campaignsRes, configRes] = await Promise.all([
          supabase
            .from("donations")
            .select("amount, donor_email"),
          supabase
            .from("campaigns")
            .select("id")
            .eq("status", "live")
            .eq("is_active", true),
          supabase
            .from("site_settings")
            .select("value")
            .eq("key", "impact_stats_config")
            .maybeSingle(),
        ]);

        // Calculate unique donors and total funds
        const uniqueDonors = new Set(donationsRes.data?.map(d => d.donor_email) || []).size;
        const totalFunds = donationsRes.data?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
        const liveCampaigns = campaignsRes.data?.length || 0;

        setAutoStats({
          donors: uniqueDonors,
          funds: totalFunds,
          campaigns: liveCampaigns,
        });

        // Parse config if exists
        let parsedConfig: ImpactStatsConfig | null = null;
        if (configRes.data?.value) {
          try {
            parsedConfig = JSON.parse(configRes.data.value);
            setConfig(parsedConfig);
          } catch (e) {
            console.error("Error parsing impact_stats_config:", e);
          }
        }

        // Build final stats
        const useAuto = parsedConfig?.useAutoCalculated !== false; // Default to auto
        const overrides = parsedConfig?.overrides || {};

        const finalStats: ImpactStat[] = [
          {
            value: overrides.livesChanged || (useAuto ? formatNumber(uniqueDonors) : DEFAULT_STATS[0].value),
            label: "Lives Changed",
            autoValue: formatNumber(uniqueDonors),
          },
          {
            value: overrides.fundsRaised || (useAuto ? formatCurrency(totalFunds) : DEFAULT_STATS[1].value),
            label: "Funds Raised",
            autoValue: formatCurrency(totalFunds),
          },
          {
            value: overrides.fundraisers || (useAuto ? formatNumber(liveCampaigns) : DEFAULT_STATS[2].value),
            label: "Fundraisers",
            autoValue: formatNumber(liveCampaigns),
          },
        ];

        setStats(finalStats);
      } catch (error) {
        console.error("Error fetching impact stats:", error);
        setStats(DEFAULT_STATS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, autoStats, config, isLoading };
};

export const useImpactStatsAdmin = () => {
  const [config, setConfig] = useState<ImpactStatsConfig>({
    useAutoCalculated: true,
    overrides: {},
  });
  const [autoStats, setAutoStats] = useState<{ donors: number; funds: number; campaigns: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [donationsRes, campaignsRes, configRes] = await Promise.all([
        supabase.from("donations").select("amount, donor_email"),
        supabase.from("campaigns").select("id").eq("status", "live").eq("is_active", true),
        supabase.from("site_settings").select("value").eq("key", "impact_stats_config").maybeSingle(),
      ]);

      const uniqueDonors = new Set(donationsRes.data?.map(d => d.donor_email) || []).size;
      const totalFunds = donationsRes.data?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      const liveCampaigns = campaignsRes.data?.length || 0;

      setAutoStats({ donors: uniqueDonors, funds: totalFunds, campaigns: liveCampaigns });

      if (configRes.data?.value) {
        try {
          setConfig(JSON.parse(configRes.data.value));
        } catch (e) {
          console.error("Error parsing config:", e);
        }
      }
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveConfig = async (newConfig: ImpactStatsConfig) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        .upsert(
          { key: "impact_stats_config", value: JSON.stringify(newConfig), description: "Impact stats configuration with auto-calculate and overrides" },
          { onConflict: "key" }
        );

      if (error) throw error;
      setConfig(newConfig);
      return true;
    } catch (error) {
      console.error("Error saving config:", error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    config,
    autoStats,
    isLoading,
    isSaving,
    saveConfig,
    refetch: fetchData,
    formatNumber,
    formatCurrency,
  };
};
