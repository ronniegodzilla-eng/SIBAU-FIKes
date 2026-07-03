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
      <span className="flex min-h-[38px] items-center justify-center rounded-[9px] bg-white/40 px-3.5 text-[12.5px] font-extrabold text-[#3D2E00]">
        Menyiapkan...
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
      className="flex min-h-[38px] items-center justify-center whitespace-nowrap rounded-[9px] bg-warn-accent px-3.5 text-[12.5px] font-extrabold text-[#3D2E00] hover:brightness-95"
    >
      {({ loading, error }) =>
        error ? 'Gagal membuat PDF' : loading ? 'Menyiapkan...' : '⬇ Unduh PDF'
      }
    </PDFDownloadLink>
  );
}
