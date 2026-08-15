import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter substitui a pilha de fontes do sistema (Arial) — pedido explícito
// do usuário por algo "mais profissional" em todo o sistema. next/font faz
// self-host automático no build (sem request pro Google em runtime).
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
import { ThemeProvider } from "@/components/theme-provider";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES, loadMessages, type Locale } from "@/lib/i18n/config";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "TDL Multilaser",
  description: "Gestão de atividades prioritárias — Grupo Multilaser",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale = (LOCALES as readonly string[]).includes(cookieLocale ?? "")
    ? (cookieLocale as Locale)
    : DEFAULT_LOCALE;
  const messages = await loadMessages(locale);

  return (
    <html lang={locale} className={`h-full antialiased ${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <LocaleProvider initialLocale={locale} initialMessages={messages}>
            {children}
            <Toaster />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
