import type { Metadata, Viewport } from "next";
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
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('cleo_theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
