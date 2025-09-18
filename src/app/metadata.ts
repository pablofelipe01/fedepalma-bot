import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: `Asistente Guaicaramo - Sector Palmero`,
    template: `%s | Asistente Guaicaramo`,
  },
  description: `Asistente inteligente del Grupo Empresarial Guaicaramo. Consulta información sobre nuestras empresas DAO, Fundación, Sirius y el sector palmero colombiano.`,
  keywords: [
    'Guaicaramo',
    'Grupo Guaicaramo',
    'DAO',
    'Fundación Guaicaramo',
    'Sirius',
    'Sector palmero',
    'Asistente inteligente',
    'Chatbot',
    'Palma de aceite Colombia',
    'HOPO alto oleico',
    'Variedades OxG',
    'RSPO sostenibilidad',
    'Agricultura regenerativa',
    'Innovación palmera',
    'Cultivadores palma',
    'Industria aceitera',
    'Aceite de palma',
    'Tecnología agrícola',
    'Agricultura sostenible',
  ],
  authors: [{ name: 'Grupo Empresarial Guaicaramo' }],
  creator: 'Grupo Empresarial Guaicaramo',
  publisher: 'Grupo Empresarial Guaicaramo',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://bot-fedepalma2025.vercel.app'
  ),
  openGraph: {
    title: `Bot Inteligente Guaicaramo - Sector Palmero`,
    description: `Sistema de voz inteligente del Grupo Empresarial Guaicaramo. Tecnología de vanguardia para consultar información del sector palmero colombiano con IA.`,
    url: '/',
    siteName: 'Bot Guaicaramo',
    locale: 'es_CO',
    type: 'website',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: `Bot Inteligente Guaicaramo - Sector Palmero`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Bot Inteligente Guaicaramo - Sector Palmero`,
    description: `Sistema de voz inteligente del Grupo Empresarial Guaicaramo. Consulta información sobre empresas, tecnologías y sostenibilidad palmera con IA.`,
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
  classification: 'Voice Assistant, Agricultural Technology, Palm Oil Industry, Regenerative Agriculture',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'msapplication-TileColor': '#2D7A2D',
    'theme-color': '#2D7A2D',
  },
};