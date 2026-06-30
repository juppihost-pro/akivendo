import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "@/styles/globals.css";

const montserrat = Montserrat({
  subsets: ["latin"], variable: "--font-montserrat",
  weight: ["300","400","500","600","700","800","900"], display: "swap",
});

export const metadata: Metadata = {
  title: "akivendo — Comprá cerca de vos",
  description: "Encontrá vendedores ambulantes, tiendas de barrio y mercados comunitarios cerca de tu ubicación.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${montserrat.variable} font-montserrat antialiased`}>{children}</body>
    </html>
  );
}
