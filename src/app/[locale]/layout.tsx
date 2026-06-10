import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ReactNode } from "react";
import Tracker from "@/components/Tracker";

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
