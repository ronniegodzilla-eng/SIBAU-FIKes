// Validasi baris jadwal ujian — dipakai bareng oleh create manual (F-07)
// dan import massal Excel (F-07) agar aturan konsisten di satu tempat.

import { DAFTAR_PRODI } from '@/lib/prodi';

const REGEX_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;
const REGEX_JAM = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface BarisJadwalMentah {
  tanggalStr?: unknown;
  jamMulai?: unknown;
  jamSelesai?: unknown;
  kodeMK?: unknown;
  namaMK?: unknown;
  prodi?: unknown;
  kelas?: unknown;
  dosenPengajar?: unknown;
  ruangan?: unknown;
}

export function validasiBarisJadwal(baris: BarisJadwalMentah): string | null {
  if (typeof baris.tanggalStr !== 'string' || !REGEX_TANGGAL.test(baris.tanggalStr)) {
    return 'Tanggal harus berformat YYYY-MM-DD.';
  }
  if (typeof baris.jamMulai !== 'string' || !REGEX_JAM.test(baris.jamMulai)) {
    return 'Jam mulai harus berformat HH:MM.';
  }
  if (typeof baris.jamSelesai !== 'string' || !REGEX_JAM.test(baris.jamSelesai)) {
    return 'Jam selesai harus berformat HH:MM.';
  }
  if (baris.jamSelesai <= baris.jamMulai) {
    return 'Jam selesai harus setelah jam mulai.';
  }
  if (typeof baris.kodeMK !== 'string' || !baris.kodeMK.trim()) {
    return 'Kode mata kuliah wajib diisi.';
  }
  if (typeof baris.namaMK !== 'string' || !baris.namaMK.trim()) {
    return 'Nama mata kuliah wajib diisi.';
  }
  if (
    typeof baris.prodi !== 'string' ||
    !(DAFTAR_PRODI as readonly string[]).includes(baris.prodi.trim())
  ) {
    return `Prodi harus salah satu dari: ${DAFTAR_PRODI.join(', ')}.`;
  }
  if (typeof baris.kelas !== 'string' || !baris.kelas.trim()) {
    return 'Kelas wajib diisi.';
  }
  if (typeof baris.dosenPengajar !== 'string' || !baris.dosenPengajar.trim()) {
    return 'Nama dosen pengajar wajib diisi.';
  }
  return null;
}

/** Kunci unik (periodeId, tanggalStr, jamMulai, kodeMK, prodi, kelas) — §5 PRD. */
export function kunciUnikJadwal(baris: {
  periodeId: string;
  tanggalStr: string;
  jamMulai: string;
  kodeMK: string;
  prodi: string;
  kelas: string;
}): string {
  return [
    baris.periodeId,
    baris.tanggalStr,
    baris.jamMulai,
    baris.kodeMK.trim().toUpperCase(),
    baris.prodi.trim().toUpperCase(),
    baris.kelas.trim().toUpperCase(),
  ].join('|');
}
