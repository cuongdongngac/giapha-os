import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import config from "./config";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
});
const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  variable: "--font-playfair",
});
export const metadata: Metadata = {
  title: {
    default: "GIA PHẢ HỌ PHẠM ĐÔNG NGẠC",
    template: "%s | GIA PHẢ HỌ PHẠM ĐÔNG NGẠC",
  },
  description:
    "GIA PHẢ HỌ PHẠM ĐÔNG NGẠC - Nền tảng gia phả hiện đại & bảo mật. Gìn giữ và lưu truyền những giá trị, cội nguồn và truyền thống tốt đẹp của dòng họ cho các thế hệ mai sau.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Họ Phạm Đông Ngạc",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Họ Phạm Đông Ngạc",
    title: "GIA PHẢ HỌ PHẠM ĐÔNG NGẠC",
    description: "Nền tảng gia phả hiện đại & bảo mật",
  },
  twitter: {
    card: "summary_large_image",
    title: "Họ Phạm Đông Ngạc",
    description: "Nền tảng gia phả hiện đại & bảo mật",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
    ],
  },
};

import { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#f59e0b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <meta name="theme-color" content="#f59e0b" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Họ Phạm Đông Ngạc" />
        <meta name="application-name" content="Họ Phạm Đông Ngạc" />
        <meta name="msapplication-TileColor" content="#fafaf9" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link
          rel="apple-touch-icon"
          sizes="152x152"
          href="/icons/icon-152x152.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/icons/icon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/icons/icon-16x16.png"
        />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased relative`}
      >
        {children}
      </body>
    </html>
  );
}
