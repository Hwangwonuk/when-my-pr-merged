import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "내 PR 언제 머지돼?",
  description: "PR 리뷰 속도를 추적하고, 팀 코드 리뷰 문화를 개선하세요.",
  openGraph: {
    title: "내 PR 언제 머지돼?",
    description: "PR 리뷰 속도를 추적하고, 팀 코드 리뷰 문화를 개선하세요.",
    type: "website",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
