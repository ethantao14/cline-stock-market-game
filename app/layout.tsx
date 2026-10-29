import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { ThemePicker } from "@/components/theme-picker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Cline Stock Market Game",
    template: "%s | Cline Stock Market Game",
  },
  description:
    "Draft one stock per sector across 8 rounds in blind or informed mode, then see how your portfolio would have performed over 10 years of real historical prices.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <div className="fixed right-4 top-4 z-50">
            <ThemePicker />
          </div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
