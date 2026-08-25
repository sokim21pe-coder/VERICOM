import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSans = Noto_Sans_KR({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "베리컴 VERICOM | M&A, Your Way",
  description:
    "AI와 M&A 전문가가 함께하는 기밀형 기업 인수합병 플랫폼. 기업가치 예비평가부터 경영진 미팅까지 TOM이 안내합니다.",
  icons: {
    icon: "/brand/vericom-logo.jpg",
    apple: "/brand/vericom-logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSans.variable} bg-white text-foreground antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
