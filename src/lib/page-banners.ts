export interface PageBannerData {
  id: string;
  image_url: string;
  alt_text?: string | null;
  orientation?: string | null;
}

interface PageBannerSupabaseClient {
  from(table: "page_banners"): {
    select(columns: string): {
      eq(column: "page_key", value: string): {
        order(column: "sort_order", options: { ascending: boolean }): {
          limit(count: number): Promise<{ data: PageBannerData[] | null }>;
        };
      };
    };
  };
}

export async function getInitialPageBanners(
  supabase: PageBannerSupabaseClient,
  pageKey: string,
  limit = 20,
): Promise<PageBannerData[]> {
  if (!supabase) return [];

  const { data } = await supabase
    .from("page_banners")
    .select("id, image_url, alt_text, orientation")
    .eq("page_key", pageKey)
    .order("sort_order", { ascending: true })
    .limit(limit);

  return (data || []).filter((banner: PageBannerData) => Boolean(banner.image_url));
}

export function getResponsiveBannerPreloads(banners: PageBannerData[]): PageBannerData[] {
  const landscape = banners.find((banner) => banner.orientation === "landscape" || !banner.orientation);
  const portrait = banners.find((banner) => banner.orientation === "portrait");

  return [landscape, portrait].filter(
    (banner, index, list): banner is PageBannerData =>
      Boolean(banner?.image_url) && list.findIndex((item) => item?.id === banner?.id) === index,
  );
}

export function getBannerPreloadMedia(banner: PageBannerData): string | undefined {
  if (banner.orientation === "portrait") return "(max-width: 767px)";
  if (banner.orientation === "landscape" || !banner.orientation) return "(min-width: 768px)";
  return undefined;
}
