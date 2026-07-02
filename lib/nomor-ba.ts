// Format nomor Berita Acara otomatis berurutan per periode (§15 keputusan #3).
// Template disimpan di settings.formatNomorBA, mis:
//   "BA/{nomor}/FIKes-UIS/{jenis}/{bulanRomawi}/{tahun}"
// menghasilkan "BA/007/FIKes-UIS/UTS/VII/2026".

import { bulanKeRomawi } from '@/lib/tanggal';

export const FORMAT_NOMOR_BA_DEFAULT =
  'BA/{nomor}/FIKes-UIS/{jenis}/{bulanRomawi}/{tahun}';

export interface ParamsNomorBA {
  /** Nilai counterBA SETELAH increment (nomor urut BA ini). */
  nomorUrut: number;
  jenis: 'UTS' | 'UAS';
  /** Tanggal acuan (WIB) untuk bulan romawi & tahun — pakai tanggal submit. */
  bulanWIB: number; // 1-12
  tahunWIB: number;
}

export function formatNomorBA(
  template: string,
  params: ParamsNomorBA
): string {
  const nomor = String(params.nomorUrut).padStart(3, '0');
  return template
    .replaceAll('{nomor}', nomor)
    .replaceAll('{jenis}', params.jenis)
    .replaceAll('{bulanRomawi}', bulanKeRomawi(params.bulanWIB))
    .replaceAll('{tahun}', String(params.tahunWIB));
}
