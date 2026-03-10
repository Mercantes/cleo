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
    icon: '/favicon.svg',
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
