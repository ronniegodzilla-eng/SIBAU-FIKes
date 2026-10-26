'use client';

import PanelUjian from '@/components/publik/PanelUjian';
import { selisihHariDariSekarang, ujianSudahLewat } from '@/lib/tanggal';
import type { JadwalUjian } from '@/lib/types';

/** Semua ujian yang sudah lewat tetapi berita acaranya belum diisi (lintas hari). */
export default function PanelBelumDiisi({ daftar }: { daftar: JadwalUjian[] }) {
  return (
    <PanelUjian
      nada="bahaya"
      judul={(n) => `⚠ ${n} ujian belum diisi berita acaranya`}
      daftar={daftar}
      // Ujian hari ini baru dianggap tertunggak setelah jam selesainya lewat.
      saring={(j) => ujianSudahLewat(j)}
      lencana={(j) => {
        const n = selisihHariDariSekarang(j.tanggalStr);
        return n <= 0 ? 'Hari ini' : `H+${n}`;
      }}
      hrefAksi={(j) => `/isi/${j.id}`}
      labelAksi="Isi"
      kunciSimpan="sibau:panel-belum-diisi-tutup"
      bawaanTerbuka
    />
  );
}
