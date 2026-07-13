// URL foto bukti dibangun dari fileId Drive saat render, BUKAN dipakai dari
// field `url` yang tersimpan di Firestore — format "drive.google.com/uc?
// export=view" (dipakai saat upload, lihat apps-script/Code.gs) terbukti
// gagal dimuat sebagai <img> yang di-embed di halaman pihak ketiga (selalu
// naturalWidth/Height 0 walau request selesai), meski URL yang sama sukses
// dibuka lewat navigasi langsung atau fetch/curl biasa — perilaku anti-
// hotlink Google Drive yang spesifik ke elemen <img>.
//
// "drive.google.com/thumbnail?id=..." memperbaiki tampilan <img> di layar,
// TAPI tetap gagal dipakai @react-pdf/renderer — komponen <Image>-nya
// mengambil byte gambar lewat fetch()/XHR (perlu baca body respons untuk
// di-embed ke PDF, beda dari <img> yang cuma perlu render piksel), dan
// fetch() ke domain itu gagal "TypeError: Failed to fetch" karena URL-nya
// redirect (302) lintas origin ke lh3.googleusercontent.com.
//
// "lh3.googleusercontent.com/d/{fileId}" langsung ke origin akhir (tanpa
// redirect), terbukti sukses di KEDUA konteks (dites: <img> dan fetch()
// langsung) — dipakai sebagai satu-satunya format URL foto.
export function urlThumbnailFoto(fileId: string): string {
  return `https://lh3.googleusercontent.com/d/${fileId}`;
}

/** Halaman viewer Drive resmi — dipakai saat foto diklik untuk lihat ukuran penuh. */
export function urlLihatFoto(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}
