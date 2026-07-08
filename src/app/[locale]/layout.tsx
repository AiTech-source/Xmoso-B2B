import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ReactNode } from "react";
import Tracker from "@/components/Tracker";

// ISR: re-render every 5 min (cache Supabase data at Vercel edge)
export const revalidate = 300;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={messages}>
      {children}
      <Tracker locale={locale} />
    </NextIntlClientProvider>
  );
}
