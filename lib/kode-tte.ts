// Bagian TTE yang aman dipakai di browser (tanpa modul crypto) — dipakai
// dokumen BA di layar, PDF, dan halaman verifikasi.

/** 16 karakter pertama hash, dicetak di dokumen agar bisa dicocokkan dengan
 *  halaman verifikasi tanpa memindai QR: "3F9A-C21B-77D0-E4A8". */
export function kodeVerifikasi(hash: string): string {
  return (hash.slice(0, 16).toUpperCase().match(/.{4}/g) ?? []).join('-');
}

export function pathVerifikasi(baId: string): string {
  return `/verifikasi/${baId}`;
}
