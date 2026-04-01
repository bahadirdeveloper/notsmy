import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: 'Notsmy',
  description: 'Kişisel ve ekip not yönetimi',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* Powered by simay.tech badge */}
        <a
          href="https://simay.tech"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-4 left-4 z-50 flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#10b981]/30 bg-[#10b981]/8 text-[#10b981] text-[11px] font-medium hover:bg-[#10b981]/15 transition-colors"
        >
          ⚡ simay.tech
        </a>
      </body>
    </html>
  );
}
