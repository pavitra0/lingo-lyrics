import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { MusicPlayer } from "@/components/Player/MusicPlayer";
import { Sidebar } from "@/components/Navigation/Sidebar";
import { BottomNav } from "@/components/Navigation/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LyricLingo",
  description: "Global music with synced lyrics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black min-h-screen text-white`}
      >
        <Providers>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            {/* Main Content Area: Padding bottom for player + bottom nav on mobile */}
            <main className="flex-1 overflow-y-auto pb-32 md:pb-24 relative z-0">
              {children}
            </main>
          </div>
          <MusicPlayer />
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
