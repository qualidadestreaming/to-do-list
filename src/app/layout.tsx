import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TDL Multilaser",
  description: "Gestão de atividades prioritárias — Grupo Multilaser",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
