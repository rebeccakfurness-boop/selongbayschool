import type { Metadata } from 'next';
import { telex, shadowsIntoLight, nunitoSans } from '@/fonts';
import { siteConfig } from '@/lib/site-content';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} - ${siteConfig.tagline}`,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.mission,
  openGraph: {
    siteName: siteConfig.name,
    type: 'website',
    locale: 'en_AU',
    images: [{ url: '/images/home-hero-sunset.jpg', width: 2400, height: 1800, alt: siteConfig.name }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${telex.variable} ${shadowsIntoLight.variable} ${nunitoSans.variable}`}>
      <body className="flex min-h-screen flex-col bg-cream font-sans text-ink">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
