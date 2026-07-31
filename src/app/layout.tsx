import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
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
  title: "Switch Region & Language DB",
  description: "Track region-free status and language support for Nintendo Switch cartridges.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
        <footer
          className="border-t px-4 py-6 text-center text-[13px]"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
        >
          <Link href="/support" className="underline">
            Support this project
          </Link>
        </footer>
      </body>
    </html>
  );
}
