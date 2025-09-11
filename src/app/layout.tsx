import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { metadata as siteMetadata } from './metadata';
import { PWA_CONFIG } from '@/lib/utils/constants';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  themeColor: PWA_CONFIG.theme_color,
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CO">
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://api.deepgram.com" />
        <link rel="preconnect" href="https://api.elevenlabs.io" />
        <link rel="preconnect" href="https://api.openai.com" />
        
        {/* DNS prefetch for faster loading */}
        <link rel="dns-prefetch" href="https://vercel.app" />
        <link rel="dns-prefetch" href="https://supabase.com" />
        
        {/* PWA specific meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Fedepalma 2025" />
        <meta name="msapplication-TileColor" content="#2D7A2D" />
        
        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        
        {/* Icons */}
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        {/* Structured data for better SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Fedepalma 2025 Voice Bot',
              description: 'Sistema de voz interactivo para el Congreso Nacional de Cultivadores de Palma de Aceite 2025',
              url: process.env.NEXT_PUBLIC_APP_URL || 'https://bot-fedepalma2025.vercel.app',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web Browser',
              browserRequirements: 'Requires modern browser with WebRTC support',
              creator: {
                '@type': 'Organization',
                name: 'Fedepalma',
                url: 'https://fedepalma.org',
              },
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
            }),
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
