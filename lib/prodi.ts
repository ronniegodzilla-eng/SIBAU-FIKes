// Daftar resmi program studi FIKes UIS — dipakai sebagai satu-satunya sumber
// kebenaran di form admin (JadwalModal), form ujian susulan, dan validasi
// server-side, agar nilai prodi selalu konsisten (tidak ada variasi ejaan).

export const DAFTAR_PRODI = [
  'S1 Kesehatan dan Keselamatan Kerja (K3)',
  'S1 Kesehatan Lingkungan (Kesling)',
  'S2 Kesehatan Masyarakat',
] as const;

export type Prodi = (typeof DAFTAR_PRODI)[number];
