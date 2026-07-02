// Validasi form Berita Acara (F-03) — dipakai bareng oleh client (UX cepat)
// dan API /api/berita-acara (keamanan, sumber kebenaran akhir). §"Konvensi
// kerja": validasi selalu dua lapis.
//
// Catatan M3→M4: pada M3 foto belum bisa diunggah (endpoint upload baru ada
// di M4), jadi MAKS_FOTO_WAJIB sengaja 0 di sini dan akan dinaikkan ke 1
// begitu UploadFotoInput terpasang di form.

const REGEX_JAM = /^([01]\d|2[0-3]):[0-5]\d$/;

export const MIN_FOTO_WAJIB = 1;
export const MAKS_FOTO = 3;

export interface FormBAMentah {
  pengawas1?: unknown;
  pengawas2?: unknown;
  pesertaTerdaftar?: unknown;
  pesertaHadir?: unknown;
  daftarTidakHadir?: unknown;
  jamMulaiAktual?: unknown;
  jamSelesaiAktual?: unknown;
  jumlahBerkas?: unknown;
  kejadianKhusus?: unknown;
  namaPengisi?: unknown;
  fotoBukti?: unknown;
}

export function validasiFormBA(
  body: FormBAMentah,
  { wajibkanFoto = true }: { wajibkanFoto?: boolean } = {}
): string | null {
  if (typeof body.pengawas1 !== 'string' || body.pengawas1.trim().length < 3) {
    return 'Nama pengawas 1 wajib diisi (minimal 3 karakter).';
  }
  if (body.pengawas2 != null && typeof body.pengawas2 !== 'string') {
    return 'Nama pengawas 2 tidak valid.';
  }

  const terdaftar = Number(body.pesertaTerdaftar);
  if (!Number.isFinite(terdaftar) || terdaftar < 0 || !Number.isInteger(terdaftar)) {
    return 'Jumlah peserta terdaftar tidak valid.';
  }
  const hadir = Number(body.pesertaHadir);
  if (!Number.isFinite(hadir) || hadir < 0 || !Number.isInteger(hadir)) {
    return 'Jumlah peserta hadir tidak valid.';
  }
  if (hadir > terdaftar) {
    return 'Jumlah peserta hadir tidak boleh melebihi jumlah terdaftar.';
  }

  if (typeof body.jamMulaiAktual !== 'string' || !REGEX_JAM.test(body.jamMulaiAktual)) {
    return 'Jam mulai aktual tidak valid.';
  }
  if (typeof body.jamSelesaiAktual !== 'string' || !REGEX_JAM.test(body.jamSelesaiAktual)) {
    return 'Jam selesai aktual tidak valid.';
  }
  if (body.jamSelesaiAktual <= body.jamMulaiAktual) {
    return 'Jam selesai aktual harus setelah jam mulai aktual.';
  }

  if (body.jumlahBerkas != null && body.jumlahBerkas !== '') {
    const berkas = Number(body.jumlahBerkas);
    if (!Number.isFinite(berkas) || berkas < 0 || !Number.isInteger(berkas)) {
      return 'Jumlah berkas tidak valid.';
    }
  }

  if (typeof body.kejadianKhusus !== 'string' || !body.kejadianKhusus.trim()) {
    return 'Kejadian khusus wajib diisi (boleh "Nihil").';
  }

  if (typeof body.namaPengisi !== 'string' || !body.namaPengisi.trim()) {
    return 'Nama pengisi wajib diisi.';
  }

  const foto = Array.isArray(body.fotoBukti) ? body.fotoBukti : [];
  if (foto.length > MAKS_FOTO) {
    return `Foto bukti maksimal ${MAKS_FOTO} foto.`;
  }
  if (wajibkanFoto && foto.length < MIN_FOTO_WAJIB) {
    return 'Foto bukti pelaksanaan wajib diunggah minimal 1 foto.';
  }

  return null;
}
