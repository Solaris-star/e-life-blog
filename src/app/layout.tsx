import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "E-Life",
  description: "整理海外支付、域名邮箱、云服网络、福利羊毛、OPC 实战与 AI 研究的长期文章。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        <Script
          src="/umami/script.js"
          data-website-id="8f7a8110-e25d-44e3-96ce-44dbdc10656c"
          data-host-url="/umami"
          strategy="afterInteractive"
        />
      </head>
      <body
        className="site-shell min-h-screen flex flex-col antialiased"
      >
        <ThemeProvider defaultTheme="system">
          <Header />
          <main className="shell-container flex-grow py-7 md:py-8">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
