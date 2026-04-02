import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import BottomNav from "@/components/BottomNav";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Your Dream Board",
  description: "Advisory board sessions for ShiftFlow Innovation & Design",
  icons: {
    icon: "/brand/logo/ShiftFlow-Logo-Flavicon-NewLeafMidnight.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="min-h-screen bg-galaxy">
        <Navigation />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-20 sm:pb-0">{children}</main>
        <footer className="hidden sm:flex items-center justify-center gap-1.5 py-6 text-xs text-white/20">
          <span>Powered by</span>
          <span className="text-white/35 font-medium">Claude Sonnet 4.6</span>
          <span className="mx-1 opacity-30">·</span>
          <a href="https://shiftflow.ca" target="_blank" rel="noopener noreferrer" className="text-white/25 hover:text-white/50 transition-colors">shiftflow.ca</a>
        </footer>
        <BottomNav />
      </body>
    </html>
  );
}
