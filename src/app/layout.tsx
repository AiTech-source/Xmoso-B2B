import "./globals.css";
import { Inter } from "next/font/google";
import { ReactNode } from "react";
import Script from "next/script";
import ErrorBoundary from "@/components/ErrorBoundary";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata() {
  let siteTitle = "DeepCool";
  let faviconUrl = "/favicon.svg";
  try {
    const supabase = await createServerSupabaseClient();
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
    alternates: { canonical: "/" },
    openGraph: { type: "website" },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  let defaultTheme = "dark";
  let faviconUrl = "/favicon.svg";
  let logoUrl = "";
  let footerLogo = "", footerCompany = "", footerAddress = "", footerEmail = "";
  try {
    const supabase = await createServerSupabaseClient();
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
    const supabase = await createServerSupabaseClient();
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

  return (
    <html lang="en" className={inter.className} data-theme={defaultTheme === "light" ? "light" : undefined}>
      <head>
        {faviconUrl && <link rel="icon" href={faviconUrl} sizes="any" />}
        {logoUrl && <link rel="preload" as="image" href={logoUrl} fetchPriority="high" />}
        <link rel="preconnect" href="https://khauqgzdxkpejdoijzqf.supabase.co" />
        <link rel="dns-prefetch" href="https://khauqgzdxkpejdoijzqf.supabase.co" />
        <meta name="msvalidate.01" content="A529385DB999D1C1111D38C42C6ED8FD" />
        <meta name="p:domain_verify" content="26f3ea34d7e6f9eaa43d929e5e06c693" />
        <style id="light-theme-css" dangerouslySetInnerHTML={{ __html: "/* Light theme — loaded as a separate CSS file, not processed by Tailwind v4 */\nhtml[data-theme=\"light\"] body,\nhtml[data-theme=\"light\"] main {\n  background-color: #F2F0EB !important;\n  color: #2A2A2A !important;\n}\nhtml[data-theme=\"light\"] .bg-deep-blue,\nhtml[data-theme=\"light\"] .bg-deep-blue\\/20,\nhtml[data-theme=\"light\"] .bg-deep-blue\\/30,\nhtml[data-theme=\"light\"] .bg-deep-blue\\/40 { background-color: #FFF !important; }\nhtml[data-theme=\"light\"] .bg-deep-dark,\nhtml[data-theme=\"light\"] .bg-deep-dark\\/30,\nhtml[data-theme=\"light\"] .bg-deep-dark\\/40,\nhtml[data-theme=\"light\"] .bg-deep-dark\\/50,\nhtml[data-theme=\"light\"] .bg-deep-dark\\/60,\nhtml[data-theme=\"light\"] .bg-deep-dark\\/80 { background-color: #FFF !important; }\nhtml[data-theme=\"light\"] .text-white { color: #1A1A1A !important; }\nhtml[data-theme=\"light\"] .text-silver,\nhtml[data-theme=\"light\"] .text-silver\\/30,\nhtml[data-theme=\"light\"] .text-silver\\/40,\nhtml[data-theme=\"light\"] .text-silver\\/50,\nhtml[data-theme=\"light\"] .text-silver\\/60,\nhtml[data-theme=\"light\"] .text-silver\\/70,\nhtml[data-theme=\"light\"] .text-silver\\/80 { color: #333 !important; }\nhtml[data-theme=\"light\"] nav .text-silver\\/50 { color: #444 !important; }\nhtml[data-theme=\"light\"] nav .text-silver\\/80,\nhtml[data-theme=\"light\"] nav .text-silver\\/70 { color: #111 !important; }\nhtml[data-theme=\"light\"] nav .text-silver\\/20 { color: rgba(0,0,0,0.3) !important; }\nhtml[data-theme=\"light\"] .border-silver\\/5,\nhtml[data-theme=\"light\"] .border-silver\\/10,\nhtml[data-theme=\"light\"] .border-silver\\/20 { border-color: rgba(0,0,0,0.1) !important; }\nhtml[data-theme=\"light\"] h1,html[data-theme=\"light\"] h2,html[data-theme=\"light\"] h3,html[data-theme=\"light\"] h4,\nhtml[data-theme=\"light\"] p,html[data-theme=\"light\"] .rich-text-display,\nhtml[data-theme=\"light\"] .leading-relaxed,html[data-theme=\"light\"] .tracking-wide { color: #2A2A2A !important; }\nhtml[data-theme=\"light\"] .rounded-full { color: #333 !important; border-color: rgba(0,0,0,0.15) !important; }\nhtml[data-theme=\"light\"] .hover\\:text-white:hover,\nhtml[data-theme=\"light\"] .hover\\:text-silver:hover { color: #333 !important; }\nhtml[data-theme=\"light\"] .text-ice { color: #3a8ba8 !important; }\nhtml[data-theme=\"light\"] .text-forest { color: #009f4b !important; }\nhtml[data-theme=\"light\"] .bg-forest\\/20 { background-color: rgba(0,159,75,0.15) !important; }\nhtml[data-theme=\"light\"] main [class*=\"aspect-square\"] { background-color: #FFF !important; }\nhtml[data-theme=\"light\"] table thead .bg-deep-blue\\/40 { background-color: #e8e6e0 !important; }\nhtml[data-theme=\"light\"] table tbody .text-white { color: #111 !important; }\nhtml[data-theme=\"light\"] table .text-silver\\/40 { color: #555 !important; }\nhtml[data-theme=\"light\"] table .text-silver\\/80 { color: #333 !important; }\nhtml[data-theme=\"light\"] .text-center p,\nhtml[data-theme=\"light\"] .uppercase { color: #555 !important; }\nhtml[data-theme=\"light\"] header.bg-deep-dark,\nhtml[data-theme=\"light\"] header.bg-deep-dark\\/80,\nhtml[data-theme=\"light\"] footer { background-color: #0A0A0F !important; color: rgba(255,255,255,0.85) !important; }\nhtml[data-theme=\"light\"] header .text-white,\nhtml[data-theme=\"light\"] footer .text-white,\nhtml[data-theme=\"light\"] header .text-silver,\nhtml[data-theme=\"light\"] header .text-silver\\/50,\nhtml[data-theme=\"light\"] header .text-silver\\/60 { color: rgba(255,255,255,0.85) !important; }\nhtml[data-theme=\"light\"] header .text-forest { color: #8BC8A0 !important; }\nhtml[data-theme=\"light\"] footer .bg-deep-dark { background-color: #0A0A0F !important; }\nhtml[data-theme=\"light\"] header .border-silver\\/10,\nhtml[data-theme=\"light\"] footer .border-silver\\/10 { border-color: rgba(192,192,192,0.1) !important; }\nhtml[data-theme=\"light\"] .text-ice\\/60,\nhtml[data-theme=\"light\"] .hover\\:text-ice\\/90:hover { color: #3a8ba8 !important; }\nhtml[data-theme=\"light\"] .border-t.border-silver\\/10 { border-color: rgba(0,0,0,0.08) !important; }\nhtml[data-theme=\"light\"] table .text-ice\\/60 { color: #3a8ba8 !important; }\nhtml[data-theme=\"light\"] .bg-row-even { background-color: rgba(0, 0, 0, 0.02); }\nhtml[data-theme=\"light\"] .bg-row-odd { background-color: rgba(0, 0, 0, 0.06); }\n" }} />
        {gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <script dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','${gaId}');`
            }} />
          </>
        )}
        {lsScript && <script dangerouslySetInnerHTML={{ __html: lsScript }} />}
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
                      urlTemplate: "https://xmoso.com/en/products?q={search_term_string}",
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
