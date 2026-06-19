import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import LogoutButton from "@/components/ui/LogoutButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
    <html lang="ja" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <header className="app-header">
          <Link href="/" className="brand">
            <span className="brand-mark">英</span>
            <span>英語フレーズ学習</span>
          </Link>
          <div className="header-actions">
            <span className="status-pill">
              <span className="status-dot" />
              ログイン中
            </span>
            <LogoutButton />
          </div>
        </header>
        {children}
        <footer className="app-footer">
          英語フレーズ学習 — 忘却曲線に基づくスペースド・リピティション学習
        </footer>
      </body>
    </html>
  );
}
