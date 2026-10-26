'use client';

import PanelUjian from '@/components/publik/PanelUjian';
import { ujianSudahLewat } from '@/lib/tanggal';
import type { JadwalUjian } from '@/lib/types';

/**
 * Ujian pada tanggal yang dipilih yang sudah selesai dan berita acaranya
 * sudah diisi — dipindah dari daftar jadwal supaya daftar hanya berisi ujian
 * yang belum selesai. Bawaannya tertutup karena tidak butuh tindakan.
 */
export default function PanelSudahDiisi({
  daftar,
  labelTanggal,
}: {
  daftar: JadwalUjian[];
  labelTanggal: string;
}) {
  return (
    <PanelUjian
      nada="sukses"
      judul={(n) => `✓ ${n} ujian ${labelTanggal} sudah selesai & berita acaranya terisi`}
      daftar={daftar}
      saring={(j) => j.status === 'terisi' && ujianSudahLewat(j)}
      lencana={() => 'Terisi'}
      hrefAksi={(j) => `/berita-acara/${j.beritaAcaraId}`}
      labelAksi="Lihat"
      kunciSimpan="sibau:panel-sudah-diisi"
      bawaanTerbuka={false}
    />
  );
}
