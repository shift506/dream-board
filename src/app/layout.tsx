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
        <BottomNav />
      </body>
    </html>
  );
}
