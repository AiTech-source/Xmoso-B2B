import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  // Prevent Cloudflare from caching HTML/RSC pages — stale cache causes
  // "0:{"f":..." rendering errors when deployment build IDs change
  async headers() {
    return [
      {
        source: "/:path((?!_next|api|.*\\.(?:ico|png|jpg|jpeg|svg|webp|css|js|woff|woff2|ttf|eot|map|json|xml)$).*)",
        headers: [
          { key: "Cache-Control", value: "private, no-cache, no-store, max-age=0, s-maxage=0, must-revalidate" },
          { key: "CDN-Cache-Control", value: "no-store" },
          { key: "Pragma", value: "no-cache" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
