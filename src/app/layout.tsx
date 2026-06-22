import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/i18n/I18nContext";
import AppHeader from "@/components/ui/AppHeader";
import AppFooter from "@/components/ui/AppFooter";
import BottomTabBar from "@/components/ui/BottomTabBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Design-language renewal (SOT-1019): a serif for English phrase display so the
// study text reads as a focused flashcard, and Noto Sans JP for crisp Japanese.
const lora = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
});

const notoSansJp = Noto_Sans_JP({
  variable: "--font-jp",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "英語フレーズ学習 | Phrase Trainer",
  description: "忘却曲線に基づいて効率よく復習する、個人利用向け英語フレーズ学習アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} ${notoSansJp.variable}`}
    >
      <body>
        <I18nProvider>
          <AppHeader />
          {children}
          <AppFooter />
          <BottomTabBar />
        </I18nProvider>
      </body>
    </html>
  );
}
