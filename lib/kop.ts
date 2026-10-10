// Isi kop surat resmi FIKes UIS, disamakan dengan kop SIMANTAP. Setiap baris
// bisa ditimpa dari halaman Pengaturan; baris yang dikosongkan di sana jatuh
// kembali ke nilai bawaan ini supaya kop tidak pernah tercetak bolong.

import type { SettingsApp } from '@/lib/types';

export interface KopSurat {
  namaYayasan: string;
  namaUniversitas: string;
  namaFakultas: string;
  alamat: string;
  telepon: string;
  email: string;
  logoUrl: string;
}

export const KOP_BAWAAN: KopSurat = {
  namaYayasan: 'Yayasan Pendidikan Ibnu Sina Batam (YAPISTA)',
  namaUniversitas: 'Universitas Ibnu Sina (UIS)',
  namaFakultas: 'Fakultas Ilmu Kesehatan',
  alamat: 'Jalan Teuku Umar, Lubuk Baja Kota Batam',
  telepon: '(0778) 4083113',
  email: 'FIKes.UIS@uis.ac.id',
  logoUrl: '/logo-uis.png',
};

export function kopDari(settings?: Partial<SettingsApp> | null): KopSurat {
  const pilih = (nilai: string | undefined, bawaan: string) => nilai?.trim() || bawaan;
  return {
    namaYayasan: pilih(settings?.namaYayasan, KOP_BAWAAN.namaYayasan),
    namaUniversitas: pilih(settings?.namaUniversitas, KOP_BAWAAN.namaUniversitas),
    namaFakultas: pilih(settings?.namaFakultas, KOP_BAWAAN.namaFakultas),
    alamat: pilih(settings?.alamat, KOP_BAWAAN.alamat),
    telepon: pilih(settings?.telepon, KOP_BAWAAN.telepon),
    email: pilih(settings?.email, KOP_BAWAAN.email),
    logoUrl: pilih(settings?.logoUrl, KOP_BAWAAN.logoUrl),
  };
}
