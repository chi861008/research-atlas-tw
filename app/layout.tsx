import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "論證 Research Atlas",
  description: "以中文搜尋跨語言學術文獻，透明檢查關聯性、中文摘要與來源品質。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className="antialiased">{children}</body>
    </html>
  );
}
