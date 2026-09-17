import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LoveFailureBackground from '@/components/LoveFailureBackground';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'StoryVault | Mretyun Jai B',
  description: 'Stories of unsaid feelings, choices, memories, and one-sided love. The official digital sanctuary for author Mretyun Jai B.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon.png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        <link rel="icon" href="/favicon.png?v=2" type="image/png" />
        <link rel="shortcut icon" href="/favicon.ico?v=2" />
        <link rel="apple-touch-icon" href="/favicon.png?v=2" />
      </head>
      <body className="bg-[#080C14] text-slate-100 font-sans antialiased min-h-screen flex flex-col selection:bg-rose-500/30 selection:text-rose-200 relative overflow-x-hidden">
        <LoveFailureBackground />
        <Navbar />
        <main className="flex-1 relative z-10">{children}</main>
        <Footer />
        <Script src="/pdf.min.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
