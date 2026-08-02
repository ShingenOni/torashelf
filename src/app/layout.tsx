import type { Metadata } from "next";
import Link from "next/link";
import { ThemeProvider } from "next-themes";
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
  title: "ToraShelf",
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
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
          <SiteHeader />
          {children}
          <footer
            className="border-t px-4 py-6 text-center text-[13px]"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              <Link href="/about" className="underline">
                About / FAQ
              </Link>
              <Link href="/contact" className="underline">
                Contact
              </Link>
              <Link href="/support" className="underline">
                Support this project
              </Link>
              <Link href="/privacy" className="underline">
                Privacy &amp; Terms
              </Link>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
