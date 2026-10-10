'use client';

import dynamic from 'next/dynamic';
import BeritaAcaraPDF from './BeritaAcaraPDF';
import type { DokumenBA } from '@/components/ba/dokumen';
import type { KopSurat } from '@/lib/kop';
import type { Pejabat } from '@/lib/types';

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
  dok,
  kop,
  pejabat,
  qr,
  urlVerifikasi,
}: {
  dok: DokumenBA;
  kop: KopSurat;
  pejabat: Pejabat | null;
  qr: string;
  urlVerifikasi: string;
}) {
  return (
    <PDFDownloadLink
      document={
        <BeritaAcaraPDF
          dok={dok}
          kop={kop}
          pejabat={pejabat}
          qr={qr}
          urlVerifikasi={urlVerifikasi}
        />
      }
      fileName={`${dok.nomorBA.replace(/\//g, '-')}.pdf`}
      className="flex min-h-[38px] items-center justify-center whitespace-nowrap rounded-[9px] bg-warn-accent px-3.5 text-[12.5px] font-extrabold text-[#3D2E00] hover:brightness-95"
    >
      {({ loading, error }) =>
        error ? 'Gagal membuat PDF' : loading ? 'Menyiapkan...' : '⬇ Unduh PDF'
      }
    </PDFDownloadLink>
  );
}
