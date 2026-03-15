import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://cleo-app-iota.vercel.app'),
  title: {
    default: 'Cleo - Assistente Financeiro com IA',
    template: '%s | Cleo',
  },
  description:
    'Conecte seu banco, converse com IA sobre suas finanças e tome decisões mais inteligentes. Categorização automática, projeções e planejamento de aposentadoria.',
  keywords: [
    'finanças pessoais',
    'assistente financeiro',
    'inteligência artificial',
    'open finance',
    'controle financeiro',
    'planejamento financeiro',
  ],
  authors: [{ name: 'Cleo' }],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Cleo',
    title: 'Cleo - Sua Assistente Financeira com IA',
    description:
      'Conecte seu banco, converse com IA sobre suas finanças e tome decisões mais inteligentes.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Cleo - Assistente Financeiro com IA' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cleo - Assistente Financeiro com IA',
    description:
      'Conecte seu banco e use IA para entender suas finanças.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('cleo_theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${inter.variable} antialiased`}
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
