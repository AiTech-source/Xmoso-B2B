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
        hostname: "khauqgzdxkpejdoijzqf.supabase.co",
        port: "",
        pathname: "/**", // 【极度重要】允许该域名下的所有子路径和图片文件
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

// 确保 withNextIntl 完美包裹完整的 nextConfig
export default withNextIntl(nextConfig);
