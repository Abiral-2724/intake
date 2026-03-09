import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";
import GlobalProviders from "@/components/GlobalProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "intake",
  description: "Collect information. Effortlessly.",
  icons: {
    icon: "https://res.cloudinary.com/dci6nuwrm/image/upload/v1766659954/favicon_wghbca.svg",
  },
  verification: {
    google: "qJhi0_OK0liUvaZiGMnl7DGtXvwok9zI0M3lo15",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        
        <GlobalProviders>
         {children}
       </GlobalProviders>
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          defer
        />
        
        <Toaster className="text-black"/>
      </body>
    </html>
  );
}
