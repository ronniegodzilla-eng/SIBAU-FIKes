// URL foto bukti dibangun dari fileId Drive saat render, BUKAN dipakai dari
// field `url` yang tersimpan di Firestore — format "drive.google.com/uc?
// export=view" (dipakai saat upload, lihat apps-script/Code.gs) terbukti
// gagal dimuat sebagai <img> yang di-embed di halaman pihak ketiga (selalu
// naturalWidth/Height 0 walau request selesai), meski URL yang sama sukses
// dibuka lewat navigasi langsung atau fetch/curl biasa — perilaku anti-
// hotlink Google Drive yang spesifik ke elemen <img>. Format "thumbnail"
// terbukti stabil di kedua konteks, jadi dipakai untuk SEMUA foto (termasuk
// yang sudah terlanjur tersimpan dengan url lama) tanpa perlu migrasi data.

/** Thumbnail untuk ditampilkan di halaman on-screen maupun PDF. */
export function urlThumbnailFoto(fileId: string, lebar = 1000): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${lebar}`;
}

/** Halaman viewer Drive resmi — dipakai saat foto diklik untuk lihat ukuran penuh. */
export function urlLihatFoto(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}
