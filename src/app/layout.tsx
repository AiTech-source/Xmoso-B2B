import "./globals.css";
import { Inter } from "next/font/google";
import { ReactNode } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { createServerStaticClient } from "@/lib/supabase/server-static";
import { headers } from "next/headers";
import { generateAlternates } from "@/lib/seo/hreflang";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export async function generateMetadata() {
  let siteTitle = "Xmoso";
  let faviconUrl = "/favicon.svg";
  try {
    const supabase = await createServerStaticClient();
    if (supabase) {
      const [titleRes, favRes] = await Promise.all([
        supabase.from("site_settings").select("value").eq("key", "site_title").single(),
        supabase.from("site_settings").select("value").eq("key", "favicon_url").single(),
      ]);
      if (titleRes.data?.value) siteTitle = titleRes.data.value;
      if (favRes.data?.value) faviconUrl = favRes.data.value;
    }
  } catch (_) {}
  return {
    title: { template: `%s — ${siteTitle}`, default: siteTitle },
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://xmoso.com"),
    icons: { icon: faviconUrl },
    alternates: generateAlternates("/", "en"),
    openGraph: { type: "website" },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Read locale from x-middleware-request-locale header (set by next-intl middleware)
  const headersList = await headers();
  const locale = headersList.get("x-next-intl-locale") || "en";

  let defaultTheme = "dark";
  let faviconUrl = "/favicon.svg";
  let logoUrl = "";
  let footerLogo = "", footerCompany = "", footerAddress = "", footerEmail = "";
  try {
    const supabase = await createServerStaticClient();
    if (supabase) {
      const [themeRes, faviconRes, logoRes, ftLogoRes, ftCompanyRes, ftAddrRes, ftEmailRes] = await Promise.all([
        supabase.from("site_settings").select("value").eq("key", "default_theme").single(),
        supabase.from("site_settings").select("value").eq("key", "favicon_url").single(),
        supabase.from("site_settings").select("value").eq("key", "logo_url").single(),
        supabase.from("site_settings").select("value").eq("key", "footer_logo_url").single(),
        supabase.from("site_settings").select("value").eq("key", "footer_company").single(),
        supabase.from("site_settings").select("value").eq("key", "footer_address").single(),
        supabase.from("site_settings").select("value").eq("key", "footer_email").single(),
      ]);
      if (themeRes.data?.value === "light") defaultTheme = "light";
      if (faviconRes.data?.value) faviconUrl = faviconRes.data.value;
      if (logoRes.data?.value) logoUrl = logoRes.data.value;
      if (ftLogoRes.data?.value) footerLogo = ftLogoRes.data.value;
      if (ftCompanyRes.data?.value) footerCompany = ftCompanyRes.data.value;
      if (ftAddrRes.data?.value) footerAddress = ftAddrRes.data.value;
      if (ftEmailRes.data?.value) footerEmail = ftEmailRes.data.value;
    }
  } catch (_) {}

  let gaId = "";
  try {
    const supabase = await createServerStaticClient();
    if (supabase) {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "ga_id").single();
      if (data?.value) gaId = data.value;
    }
  } catch (_) {}

  const esc = (s: string) => s.replace(/"/g, '\\"').replace(/'/g, "\\'");
  const lsItems: string[] = [];
  if (logoUrl) lsItems.push(`localStorage.setItem("logo_url","${esc(logoUrl)}")`);
  if (footerLogo) lsItems.push(`localStorage.setItem("footer_logo_url","${esc(footerLogo)}")`);
  if (footerCompany) lsItems.push(`localStorage.setItem("footer_company","${esc(footerCompany)}")`);
  if (footerAddress) lsItems.push(`localStorage.setItem("footer_address","${esc(footerAddress)}")`);
  if (footerEmail) lsItems.push(`localStorage.setItem("footer_email","${esc(footerEmail)}")`);

  const lsScript = lsItems.length > 0
    ? `(function(){try{${lsItems.join(";")}}catch(e){}})();`
    : "";

  // External light-theme CSS loaded as a plain file (not processed by Tailwind)
  // This removes the massive inline <style> block and eliminates render-blocking CSS

  return (
    <html lang={locale === "zh" ? "zh-Hans" : locale} className={inter.className} data-theme={defaultTheme === "light" ? "light" : undefined} suppressHydrationWarning>
      <head>
        {faviconUrl && <link rel="icon" href={faviconUrl} sizes="any" />}
        {logoUrl && <link rel="preload" as="image" href={logoUrl} fetchPriority="high" />}
        <link rel="preconnect" href="https://khauqgzdxkpejdoijzqf.supabase.co" />
        <link rel="dns-prefetch" href="https://khauqgzdxkpejdoijzqf.supabase.co" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="msvalidate.01" content="A529385DB999D1C1111D38C42C6ED8FD" />
        <meta name="p:domain_verify" content="26f3ea34d7e6f9eaa43d929e5e06c693" />
        {/* Responsive: allow dynamic theme-color for light mode */}
        <meta name="theme-color" content={defaultTheme === "light" ? "#F2F0EB" : "#0A0A0F"} />
        {/* Light theme CSS — external file, loaded for all themes (overrides triggered by JS data-theme attribute) */}
        <link rel="preload" as="style" href="/light-theme.css" id="lt-preload" />
        <noscript><link rel="stylesheet" href="/light-theme.css" /></noscript>
        <script dangerouslySetInnerHTML={{
            __html: "var e=document.getElementById('lt-preload');e.onload=function(){e.onload=null;e.rel='stylesheet'}"
          }} />
        {gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <script dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','${gaId}');`
            }} />
          </>
        )}
        {lsScript && <script dangerouslySetInnerHTML={{ __html: lsScript }} />}
        <script dangerouslySetInnerHTML={{ __html: `window.addEventListener('beforeinstallprompt',e=>e.preventDefault())` }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  try{var t=localStorage.getItem("theme");if(t==="light")document.documentElement.setAttribute("data-theme","light");if(t==="dark")document.documentElement.removeAttribute("data-theme")}catch(e){}
})();`
          }}
        />

        {/* GEO / SEO structured data — Organization + WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  name: "Xmoso",
                  url: "https://xmoso.com",
                  logo: logoUrl || undefined,
                  description: "Premium wine cooling cabinets, cigar cabinets, and bar cabinets for hospitality and residential.",
                  contactPoint: {
                    "@type": "ContactPoint",
                    email: footerEmail || undefined,
                    contactType: "sales",
                  },
                },
                {
                  "@type": "WebSite",
                  url: "https://xmoso.com",
                  name: "Xmoso",
                  description: "Premium wine cooling cabinets, cigar cabinets, and bar cabinets for hospitality and residential.",
                  potentialAction: {
                    "@type": "SearchAction",
                    target: {
                      "@type": "EntryPoint",
                      urlTemplate: "https://xmoso.com/products?q={search_term_string}",
                    },
                    "query-input": "required name=search_term_string",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className="bg-deep-dark text-soft-white antialiased min-h-screen" itemScope itemType="https://schema.org/WebPage" suppressHydrationWarning>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
