import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Source_Serif_4 } from 'next/font/google';
import ToastProvider from '@/components/ui/ToastProvider';
import ConfirmProvider from '@/components/ui/ConfirmDialog';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-source-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SIBAU — Sistem Berita Acara Ujian FIKes UIS',
  description:
    'Sistem pengisian berita acara ujian UTS/UAS Fakultas Ilmu Kesehatan Universitas Ibnu Sina',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${jakarta.variable} ${sourceSerif.variable}`}>
      <body className="min-h-screen bg-app font-sans text-ink antialiased">
        <ToastProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
