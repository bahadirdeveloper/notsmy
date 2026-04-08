import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { PushNotificationManager } from "@/components/PushNotificationManager";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://notsmy.vercel.app'),
  title: {
    default: 'Notsmy — Not Yönetimi',
    template: '%s | Notsmy',
  },
  description: 'Kişisel ve ekip not yönetimi. 3 günlük takvim görünümünde görevlerinizi yönetin, önceliklendirin ve takip edin.',
  keywords: ['not', 'görev', 'takvim', 'ekip', 'proje yönetimi', 'todo', 'notsmy'],
  authors: [{ name: 'simay.tech', url: 'https://simay.tech' }],
  creator: 'simay.tech',
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Notsmy',
    title: 'Notsmy — Not Yönetimi',
    description: 'Kişisel ve ekip not yönetimi. 3 günlük takvim görünümünde görevlerinizi yönetin.',
    images: [{ url: '/icons/icon-512x512.png', width: 512, height: 512, alt: 'Notsmy' }],
  },
  twitter: {
    card: 'summary',
    title: 'Notsmy — Not Yönetimi',
    description: 'Kişisel ve ekip not yönetimi',
    images: ['/icons/icon-512x512.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Notsmy',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#09090b',
  viewportFit: 'cover',
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
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-96x96.png" />
      </head>
      <body className="min-h-full flex flex-col overscroll-none">
        {children}
        <ServiceWorkerRegister />
        <PushNotificationManager />
        {/* Powered by simay.tech badge */}
        <a
          href="https://simay.tech"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-4 left-4 z-50 flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#10b981]/30 bg-[#09090b]/80 backdrop-blur-sm text-[#10b981] text-[10px] font-medium hover:bg-[#10b981]/15 transition-colors"
        >
          simay.tech
        </a>
      </body>
    </html>
  );
}
