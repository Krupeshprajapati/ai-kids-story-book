import type { Metadata } from "next";
import { Geist, Geist_Mono, Caveat } from "next/font/google";
import "./globals.css";
import BackgroundMusic from "./components/BackgroundMusic";
import Navbar from "./components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Magic Story World ✨",
  description: "Create beautiful AI-powered kids story books",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning={true}
        className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} antialiased bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 min-h-screen`}
      >
        {/* ⭐ Animated Stars */}
        <div className="stars"></div>

        {/* 🧭 Navbar */}
        <Navbar />

        {/* 🎵 Background Music Component */}
        <BackgroundMusic />

        {children}
      </body>
    </html>
  );
}