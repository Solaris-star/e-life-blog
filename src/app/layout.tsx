import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "我的博客",
  description: "日常帖子、推荐文章、开源项目、每日新闻热点与Obsidian同步的数字花园。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" suppressHydrationWarning>
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
