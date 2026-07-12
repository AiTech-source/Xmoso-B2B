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
  async redirects() {
    return [
      {
        source: "/sitemap.xml",
        destination: "/sitemap-index.xml",
        permanent: true,
      },
      {
        source: "/en",
        destination: "/",
        permanent: true,
      },
      {
        source: "/en/:path*",
        destination: "/:path*",
        permanent: true,
      },
      {
        source: "/products/xbi70d",
        destination: "/products/xbi70d-wine-cooler",
        permanent: true,
      },
      {
        source: "/zh/products/xbi70d",
        destination: "/zh/products/xbi70d-wine-cooler-cn",
        permanent: true,
      },
      {
        source: "/products/xbi70db",
        destination: "/products/xbi70db-wine-cooler",
        permanent: true,
      },
      {
        source: "/products/xbiu90d",
        destination: "/products/xbiu90d-wine-cooler",
        permanent: true,
      },
      {
        source: "/products/xbiu90db",
        destination: "/products/xbiu90db-wine-cooler",
        permanent: true,
      },
      {
        source: "/products/xbc90db",
        destination: "/products/xbc90db-wine-cooler",
        permanent: true,
      },
    ];
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
