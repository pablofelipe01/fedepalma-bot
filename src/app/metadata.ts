import type { Metadata } from 'next';
import { CONGRESS_INFO } from '@/lib/utils/constants';

export const metadata: Metadata = {
  title: {
    default: `${CONGRESS_INFO.short_name} - Voice Bot Inteligente`,
    template: `%s | ${CONGRESS_INFO.short_name}`,
  },
  description: `Sistema de voz interactivo para el ${CONGRESS_INFO.name}. Consulta información sobre charlas, empresas expositoras, ponentes y todo lo relacionado con el sector palmero colombiano.`,
  keywords: [
    'Fedepalma',
    'Congreso palma de aceite',
    'Sector palmero',
    'Voice bot',
    'Asistente de voz',
    'Palma de aceite Colombia',
    'HOPO alto oleico',
    'Variedades OxG',
    'RSPO sostenibilidad',
    'Innovación palmera',
    'Cultivadores palma',
    'Industria aceitera',
    'Aceite de palma',
    'Tecnología agrícola',
    'Agricultura sostenible',
  ],
  authors: [{ name: 'Fedepalma' }],
  creator: 'Fedepalma',
  publisher: CONGRESS_INFO.organization,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://bot-fedepalma2025.vercel.app'
  ),
  openGraph: {
    title: `${CONGRESS_INFO.short_name} - Voice Bot Inteligente`,
    description: `Sistema de voz interactivo para el ${CONGRESS_INFO.name}. Tecnología de vanguardia para consultar información del congreso más importante del sector palmero colombiano.`,
    url: '/',
    siteName: CONGRESS_INFO.short_name,
    locale: 'es_CO',
    type: 'website',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: `${CONGRESS_INFO.short_name} Voice Bot`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${CONGRESS_INFO.short_name} - Voice Bot Inteligente`,
    description: `Sistema de voz interactivo para el ${CONGRESS_INFO.name}. Consulta información sobre charlas, empresas expositoras y ponentes con tecnología de IA.`,
    images: ['/images/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icons/favicon.ico' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  category: 'technology',
  classification: 'Voice Assistant, Agricultural Technology, Congress Assistant',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'msapplication-TileColor': '#2D7A2D',
    'theme-color': '#2D7A2D',
  },
};