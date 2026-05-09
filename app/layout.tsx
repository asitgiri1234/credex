import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const interSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
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
      className={`dark ${interSans.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground antialiased [font-feature-settings:'ss01']">
        <SiteHeader />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
