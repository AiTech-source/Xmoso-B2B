/**
 * Transform a Supabase Storage URL to go through xmoso.com CDN proxy.
 * Using the same domain avoids DNS/TCP/TLS overhead to supabase.co.
 * Cloudflare edge caches the response for 365 days.
 *
 * For product listing images, specify width+quality to trigger sharp
 * compression in the proxy route (reduces ~2MB → ~30KB per image).
 */
export function cdnUrl(url: string, width?: number, quality?: number): string {
  if (!url) return url;
  if (url.includes("supabase.co/storage/v1/object/public/")) {
    let target = url;
    if (width) {
      const sep = target.includes("?") ? "&" : "?";
      target = `${target}${sep}w=${width}`;
      if (quality) target += `&q=${quality}`;
    }
    return `/api/cdn-image?url=${encodeURIComponent(target)}`;
  }
  return url;
}

/** For hero/banner images — larger size */
export function cdnUrlHero(url: string): string {
  return cdnUrl(url, 1200, 80);
}
