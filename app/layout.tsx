import type { Metadata } from 'next';
import ToastProvider from '@/components/ui/ToastProvider';
import ConfirmProvider from '@/components/ui/ConfirmDialog';
import './globals.css';

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
    <html lang="id">
      {/*
        <head> di sini ada di ROOT layout App Router (berlaku untuk semua
        halaman sekaligus), bukan per-halaman seperti kasus yang diperingatkan
        aturan no-page-custom-font (aturan itu ditulis untuk Pages Router).
        <link> klasik dipakai (bukan next/font/google) karena next/font
        mengunduh banyak file font saat compile pertama dan pernah membuat
        dev server macet di lingkungan dengan jaringan terbatas.
      */}
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-app font-sans text-ink antialiased">
        <ToastProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
