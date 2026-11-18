import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LeadFlow — Gestão Inteligente de Leads e Pipeline Comercial',
  description:
    'Plataforma inteligente de gestão de leads, pipeline comercial e acompanhamento de vendas B2B em tempo real.',
  openGraph: {
    title: 'LeadFlow — Gestão Inteligente de Leads e Pipeline Comercial',
    description:
      'Plataforma inteligente de gestão de leads, pipeline comercial e acompanhamento de vendas B2B em tempo real.',
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LeadFlow — Gestão Inteligente de Leads e Pipeline Comercial',
    description:
      'Plataforma inteligente de gestão de leads, pipeline comercial e acompanhamento de vendas B2B em tempo real.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${plusJakartaSans.variable} ${dmSans.variable} ${jetbrainsMono.variable} dark`}
    >
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[#0a0e1a] text-slate-100 font-sans antialiased selection:bg-[#7dd3fc]/25 selection:text-[#e0f2fe]"
      >
        {children}
      </body>
    </html>
  );
}
