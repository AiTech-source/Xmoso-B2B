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
  try {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const [themeRes, faviconRes, logoRes] = await Promise.all([
        supabase.from("site_settings").select("value").eq("key", "default_theme").single(),
        supabase.from("site_settings").select("value").eq("key", "favicon_url").single(),
        supabase.from("site_settings").select("value").eq("key", "logo_url").single(),
      ]);
      if (themeRes.data?.value === "light") defaultTheme = "light";
      if (faviconRes.data?.value) faviconUrl = faviconRes.data.value;
      if (logoRes.data?.value) logoUrl = logoRes.data.value;
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

  const escapedLogo = logoUrl ? logoUrl.replace(/"/g, '\\"').replace(/'/g, "\\'") : "";

  return (
    <html lang="en" className={inter.className} data-theme={defaultTheme === "light" ? "light" : undefined}>
      <head>
        {faviconUrl && <link rel="icon" href={faviconUrl} sizes="any" />}
        {logoUrl && <link rel="preload" as="image" href={logoUrl} />}
        <link rel="stylesheet" href="/light-theme.css" />
        {gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <script dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','${gaId}');`
            }} />
          </>
        )}
        <script dangerouslySetInnerHTML={{
          __html: escapedLogo
            ? `(function(){try{localStorage.setItem("logo_url","${escapedLogo}")}catch(e){}})();`
            : `(function(){try{localStorage.removeItem("logo_url")}catch(e){}})();`
        }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  try{var t=localStorage.getItem("theme");if(t==="light")document.documentElement.setAttribute("data-theme","light");if(t==="dark")document.documentElement.removeAttribute("data-theme")}catch(e){}
})();`
          }}
        />
      </head>
      <body className="bg-deep-dark text-soft-white antialiased min-h-screen" suppressHydrationWarning>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
