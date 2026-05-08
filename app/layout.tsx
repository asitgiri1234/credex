import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const interSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Credex Subscription Optimizer",
  description: "AI spend audit and subscription optimization for startups",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${interSans.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
