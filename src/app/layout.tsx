import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GardenNarrativeProvider } from "@/components/garden/GardenNarrativeContext";
import ClientGardenStage from "@/components/garden/ClientGardenStage";

export const metadata: Metadata = {
  title: "E-Life",
  description: "整理海外支付、域名邮箱、云服网络、福利羊毛、OPC 实战与 AI 研究的长期文章。",
  openGraph: {
    title: "E-Life",
    description: "整理海外支付、域名邮箱、云服网络、福利羊毛、OPC 实战与 AI 研究的长期文章。",
    type: "website",
    url: "https://blog.sovoice.asia",
    siteName: "E-Life",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
    title: "E-Life",
    description: "整理海外支付、域名邮箱、云服网络、福利羊毛、OPC 实战与 AI 研究的长期文章。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        <script
          // 阻塞式主题脚本:在首帧绘制前根据 localStorage/系统偏好挂载主题 class,避免暗色用户闪白
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('blog-theme');var d=t==='dark'||((t==null||t==='system')&&matchMedia('(prefers-color-scheme: dark)').matches);var c=document.documentElement.classList;c.add(d?'dark':'light');c.remove(d?'light':'dark');}catch(e){}})();",
          }}
        />
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
          <GardenNarrativeProvider>
            <Header />
            <main className="shell-container flex-grow py-7 md:py-8">
              {children}
            </main>
            {/* Global garden character stage — renders Solaris + cats on all pages */}
            <ClientGardenStage />
            <Footer />
          </GardenNarrativeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
