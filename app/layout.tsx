import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Roboto_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeScript } from "@/components/theme-script";
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Credex Subscription Optimizer",
    template: "%s · Credex",
  },
  description: "AI spend audit and subscription optimization for startups",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  appleWebApp: {
    capable: true,
    title: "Credex",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "Credex — AI spend audit",
    description: "Map AI subscriptions, surface overlap, and model defensible savings with Credex.",
    type: "website",
    url: siteUrl,
    siteName: "Credex",
    images: [{ url: "/api/og?title=Credex%20%E2%80%94%20AI%20spend%20audit&subtitle=Modeled%20savings%20%26%20recommendations", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Credex — AI spend audit",
    description: "Map AI subscriptions, surface overlap, and model defensible savings with Credex.",
    images: ["/api/og?title=Credex%20%E2%80%94%20AI%20spend%20audit&subtitle=Modeled%20savings%20%26%20recommendations"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${interSans.variable} ${robotoMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground antialiased [font-feature-settings:'ss01']">
        <Script id="credex-theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: ThemeScript() }} />
        <ThemeProvider>
          <SiteHeader />
          <div className="flex-1">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
