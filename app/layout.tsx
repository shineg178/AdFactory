import type { Metadata } from "next";
import { Geist, Geist_Mono, Nanum_Gothic } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const nanumGothic = Nanum_Gothic({
  variable: "--font-nanum-gothic",
  weight: ["400", "700", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "알감자의 카피 공장",
  description: "AI 광고 소재 자동화 카피 제작 툴",
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} ${nanumGothic.variable} h-full antialiased`}
    >
      <head>
        {/* Pretendard — canvas에서도 사용 가능하도록 직접 @font-face 로드 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
        {/* GmarketSans */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/gmarket-sans@1.0.1/css/gmarketsans.css"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
