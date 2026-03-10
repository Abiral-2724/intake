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
{/* <meta name="google-site-verification" content="w-auKxdR9b5JHgyfHO5loJ74KpzaICktQHb6rGsBV-8" /> */}
export const metadata: Metadata = {
  title: "intake",
  description: "Collect information. Effortlessly.",
  appleWebApp: {
    title: "intake",
  },
  icons: {
    icon: "/icon.ico",
    apple: "/apple-icon.png",
  },

  manifest: "/manifest.json",
  verification: {
    google: "w-auKxdR9b5JHgyfHO5loJ74KpzaICktQHb6rGsBV-8",
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
        <head>
    <meta name="apple-mobile-web-app-title" content="intake" />
  </head>
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
