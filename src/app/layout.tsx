import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Diaz Premium Envíos - Tu Tienda Premium de Envíos",
  description: "Productos de alta calidad con entrega rápida y segura. Paga fácil con Zelle y reciba en la puerta de su casa.",
  keywords: ["Diaz Premium", "Envíos", "E-commerce", "Zelle", "Tienda Online"],
  authors: [{ name: "Diaz Premium Envíos" }],
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ backgroundColor: '#ffffff', color: '#111827' }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
