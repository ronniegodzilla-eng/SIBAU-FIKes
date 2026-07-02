import type { Metadata } from 'next';
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
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
