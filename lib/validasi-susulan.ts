// Validasi form Berita Acara Ujian Susulan — dipakai bareng oleh client (UX
// cepat) dan API /api/berita-acara-susulan (keamanan, sumber kebenaran
// akhir), sama seperti pola lib/validasi.ts untuk BA reguler.
//
// Bedanya dari BA reguler: tidak ada jadwal_ujian yang di-join, jadi field
// "jadwal" (tanggal, MK, prodi, dst) divalidasi di sini juga, lalu bagian
// isian pengawas (pengawas, peserta, kejadian, dst) didelegasikan ke
// validasiFormBA yang sudah ada agar aturannya tetap satu sumber.

import { DAFTAR_PRODI } from '@/lib/prodi';
import { validasiFormBA, type FormBAMentah } from '@/lib/validasi';

const REGEX_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;

export interface FormSusulanMentah extends FormBAMentah {
  periodeId?: unknown;
  tanggalStr?: unknown;
  kodeMK?: unknown;
  namaMK?: unknown;
  prodi?: unknown;
  kelas?: unknown;
  dosenPengajar?: unknown;
  ruangan?: unknown;
}

export function validasiFormSusulan(
  body: FormSusulanMentah,
  { wajibkanFoto = true }: { wajibkanFoto?: boolean } = {}
): string | null {
  if (typeof body.periodeId !== 'string' || !body.periodeId) {
    return 'Periode ujian tidak ditemukan.';
  }
  if (typeof body.tanggalStr !== 'string' || !REGEX_TANGGAL.test(body.tanggalStr)) {
    return 'Tanggal ujian susulan wajib diisi.';
  }
  if (typeof body.kodeMK !== 'string' || !body.kodeMK.trim()) {
    return 'Kode mata kuliah wajib diisi.';
  }
  if (typeof body.namaMK !== 'string' || !body.namaMK.trim()) {
    return 'Nama mata kuliah wajib diisi.';
  }
  if (
    typeof body.prodi !== 'string' ||
    !(DAFTAR_PRODI as readonly string[]).includes(body.prodi.trim())
  ) {
    return `Prodi harus salah satu dari: ${DAFTAR_PRODI.join(', ')}.`;
  }
  if (typeof body.kelas !== 'string' || !body.kelas.trim()) {
    return 'Kelas wajib diisi.';
  }
  if (typeof body.dosenPengajar !== 'string' || !body.dosenPengajar.trim()) {
    return 'Nama dosen pengajar wajib diisi.';
  }

  return validasiFormBA(body, { wajibkanFoto });
}
