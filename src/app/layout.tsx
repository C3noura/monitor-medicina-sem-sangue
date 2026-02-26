import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Monitor de Medicina Sem Sangue",
  description: "Sistema de monitoramento semanal de pesquisas médicas sobre tratamentos sem transfusão de sangue - Bloodless Medicine Research Monitor",
  keywords: ["medicina sem sangue", "bloodless medicine", "Patient Blood Management", "PBM", "transfusão", "pesquisa médica"],
  authors: [{ name: "Monitor de Medicina Sem Sangue" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Monitor de Medicina Sem Sangue",
    description: "Sistema de monitoramento semanal de pesquisas médicas sobre tratamentos sem transfusão de sangue",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased bg-background text-foreground"
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
