import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PageWallpapers {
  home_wallpaper: string;
  about_wallpaper: string;
  causes_wallpaper: string;
  fundraisers_wallpaper: string;
  contact_wallpaper: string;
  how_it_works_wallpaper: string;
}

export interface PageOverlayOpacities {
  home_wallpaper: number;
  about_wallpaper: number;
  causes_wallpaper: number;
  fundraisers_wallpaper: number;
  contact_wallpaper: number;
  how_it_works_wallpaper: number;
}

const DEFAULT_WALLPAPERS: PageWallpapers = {
  home_wallpaper: "",
  about_wallpaper: "",
  causes_wallpaper: "",
  fundraisers_wallpaper: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1920",
  contact_wallpaper: "",
  how_it_works_wallpaper: "",
};

const DEFAULT_OVERLAY_OPACITY = 40;

const DEFAULT_OPACITIES: PageOverlayOpacities = {
  home_wallpaper: DEFAULT_OVERLAY_OPACITY,
  about_wallpaper: DEFAULT_OVERLAY_OPACITY,
  causes_wallpaper: DEFAULT_OVERLAY_OPACITY,
  fundraisers_wallpaper: DEFAULT_OVERLAY_OPACITY,
  contact_wallpaper: DEFAULT_OVERLAY_OPACITY,
  how_it_works_wallpaper: DEFAULT_OVERLAY_OPACITY,
};

export const usePageWallpapers = () => {
  const [wallpapers, setWallpapers] = useState<PageWallpapers>(DEFAULT_WALLPAPERS);
  const [overlayOpacities, setOverlayOpacities] = useState<PageOverlayOpacities>(DEFAULT_OPACITIES);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWallpapers = async () => {
    try {
      const wallpaperKeys = [
        "home_wallpaper",
        "about_wallpaper",
        "causes_wallpaper",
        "fundraisers_wallpaper",
        "contact_wallpaper",
        "how_it_works_wallpaper",
      ];
      
      const allKeys = [
        ...wallpaperKeys,
        ...wallpaperKeys.map(k => `${k}_overlay_opacity`),
      ];

      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", allKeys);

      if (error) throw error;

      if (data) {
        const fetchedWallpapers: Partial<PageWallpapers> = {};
        const fetchedOpacities: Partial<PageOverlayOpacities> = {};
        
        data.forEach((item) => {
          if (item.key.endsWith("_overlay_opacity")) {
            const pageKey = item.key.replace("_overlay_opacity", "") as keyof PageOverlayOpacities;
            fetchedOpacities[pageKey] = parseInt(item.value) || DEFAULT_OVERLAY_OPACITY;
          } else if (item.value) {
            fetchedWallpapers[item.key as keyof PageWallpapers] = item.value;
          }
        });
        
        setWallpapers({ ...DEFAULT_WALLPAPERS, ...fetchedWallpapers });
        setOverlayOpacities({ ...DEFAULT_OPACITIES, ...fetchedOpacities });
      }
    } catch (error) {
      console.error("Error fetching wallpapers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWallpapers();
  }, []);

  return { wallpapers, overlayOpacities, isLoading, refetch: fetchWallpapers };
};

export const usePageWallpaper = (page: keyof PageWallpapers) => {
  const { wallpapers, overlayOpacities, isLoading } = usePageWallpapers();
  return { 
    wallpaper: wallpapers[page], 
    overlayOpacity: overlayOpacities[page],
    isLoading 
  };
};
