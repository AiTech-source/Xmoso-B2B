import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "zh", "fr", "de", "no", "fi", "sv"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: false,
});
