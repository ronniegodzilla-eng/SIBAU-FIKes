'use client';

import dynamic from 'next/dynamic';
import BeritaAcaraPDF from './BeritaAcaraPDF';
import type { BeritaAcara, JadwalUjian, Periode, SettingsApp } from '@/lib/types';

// @react-pdf/renderer memakai API browser (canvas, fetch) yang tidak boleh
// dieksekusi saat SSR/prerender — wajib dynamic import dengan ssr:false.
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  {
    ssr: false,
    loading: () => (
      <span className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-gray-200 text-sm font-medium text-gray-500">
        Menyiapkan PDF...
      </span>
    ),
  }
);

export default function TombolUnduhPDF({
  ba,
  jadwal,
  periode,
  settings,
}: {
  ba: BeritaAcara;
  jadwal: JadwalUjian;
  periode: Periode;
  settings: SettingsApp;
}) {
  return (
    <PDFDownloadLink
      document={
        <BeritaAcaraPDF ba={ba} jadwal={jadwal} periode={periode} settings={settings} />
      }
      fileName={`${ba.nomorBA.replace(/\//g, '-')}.pdf`}
      className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-primary-600 px-4 text-sm font-medium text-white hover:bg-primary-700"
    >
      {({ loading, error }) =>
        error ? 'Gagal membuat PDF' : loading ? 'Menyiapkan PDF...' : 'Unduh PDF'
      }
    </PDFDownloadLink>
  );
}
