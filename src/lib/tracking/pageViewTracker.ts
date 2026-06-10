export function getUTMParams() {
  if (typeof window === "undefined") return { source: "", medium: "", campaign: "" };
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get("utm_source") || "",
    medium: params.get("utm_medium") || "",
    campaign: params.get("utm_campaign") || "",
  };
}

export async function trackPageView(supabase: any, locale: string, path: string) {
  try {
    const utm = getUTMParams();
    await supabase.from("page_views").insert({
      locale, path,
      country: "",
      user_agent: navigator.userAgent,
      referrer: document.referrer || "",
      utm_source: utm.source, utm_medium: utm.medium, utm_campaign: utm.campaign,
      session_id: sessionStorage.getItem("session_id") || crypto.randomUUID(),
    });
    if (!sessionStorage.getItem("session_id")) {
      sessionStorage.setItem("session_id", crypto.randomUUID());
    }
  } catch (e) {
    // Silently fail
  }
}
