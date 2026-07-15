import type { Metadata } from "next";
import { Rajdhani, JetBrains_Mono } from "next/font/google";
import { ConsoleLizard } from "@/components/console-lizard";
import "./globals.css";

// 관제실 컨셉 전용 서체: 라틴·숫자만 커버하고 한글은 시스템 산세리프로 폴백
const rajdhani = Rajdhani({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-rajdhani",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "대외활동 기록보관소",
  description: "공모전·동아리·봉사, 흩어진 대외활동을 한 저장소에.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`h-full antialiased ${rajdhani.variable} ${jetbrains.variable}`}>
      <body className="min-h-full flex flex-col">
        {children}
        <ConsoleLizard />
      </body>
    </html>
  );
}
