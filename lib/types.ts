// Tipe data Firestore sesuai PRD §5. Timestamp direpresentasikan sebagai
// string ISO di client (setelah serialisasi dari Firestore Timestamp) agar
// aman dipakai di Client & Server Component tanpa konversi kelas khusus.

export type JenisPeriode = 'UTS' | 'UAS';
export type Semester = 'Ganjil' | 'Genap';
export type StatusJadwal = 'belum_diisi' | 'terisi';

export interface Pejabat {
  nama: string;
  nip: string;
  jabatan: string;
}

export interface SettingsApp {
  namaUniversitas: string;
  namaFakultas: string;
  alamat: string;
  logoUrl: string;
  pejabat: Pejabat;
  formatNomorBA: string;
}

export interface Periode {
  id: string;
  jenis: JenisPeriode;
  tahunAkademik: string; // "2026/2027"
  semester: Semester;
  tanggalMulai: string; // ISO date string
  tanggalSelesai: string; // ISO date string
  aktif: boolean;
  counterBA: number;
  /** Counter terpisah untuk penomoran BA ujian susulan (insidental, tidak
   *  terjadwal) — lihat BeritaAcaraSusulan. */
  counterBASusulan: number;
  createdAt: string;
  updatedAt: string;
}

export interface JadwalUjian {
  id: string;
  periodeId: string;
  tanggal: string; // ISO datetime, tengah hari WIB
  tanggalStr: string; // "YYYY-MM-DD"
  jamMulai: string; // "08:00"
  jamSelesai: string; // "09:40"
  kodeMK: string;
  namaMK: string;
  prodi: string;
  kelas: string;
  dosenPengajar: string;
  ruangan: string | null;
  status: StatusJadwal;
  beritaAcaraId: string | null;
  /** Field di bawah ini hanya diisi oleh GET /api/admin/jadwal untuk tabel
   *  rekap (join dari dokumen berita_acara terkait); tidak disimpan di
   *  dokumen jadwal_ujian itu sendiri. */
  nomorBA?: string | null;
  pengawas1?: string | null;
  pengawas2?: string | null;
  pesertaTerdaftar?: number | null;
  pesertaHadir?: number | null;
  baLocked?: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface FotoBukti {
  fileId: string;
  url: string;
  namaFile: string;
}

export interface BeritaAcara {
  id: string;
  jadwalId: string;
  nomorBA: string;
  pengawas1: string;
  pengawas2: string | null;
  pesertaTerdaftar: number;
  pesertaHadir: number;
  pesertaTidakHadir: number;
  daftarTidakHadir: string | null;
  jamMulaiAktual: string;
  jamSelesaiAktual: string;
  jumlahBerkas: number | null;
  kejadianKhusus: string;
  narasiDibantuAI: boolean;
  fotoBukti: FotoBukti[]; // 1-3
  namaPengisi: string;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
}

// Berita acara ujian susulan — diinput insidental oleh pengawas (tidak lewat
// jadwal_ujian yang sudah terjadwal), karena itu field jadwal (tanggal, MK,
// prodi, dst) digabung langsung ke dokumen ini alih-alih di-join dari
// jadwal_ujian seperti BeritaAcara biasa. jamMulaiAktual/jamSelesaiAktual
// dipakai ganda: sebagai "jam ujian" (header dokumen) sekaligus jam aktual.
export interface BeritaAcaraSusulan {
  id: string;
  periodeId: string;
  tanggalStr: string; // "YYYY-MM-DD"
  kodeMK: string;
  namaMK: string;
  prodi: string;
  kelas: string;
  dosenPengajar: string;
  ruangan: string | null;
  nomorBA: string;
  pengawas1: string;
  pengawas2: string | null;
  pesertaTerdaftar: number;
  pesertaHadir: number;
  pesertaTidakHadir: number;
  daftarTidakHadir: string | null;
  jamMulaiAktual: string;
  jamSelesaiAktual: string;
  jumlahBerkas: number | null;
  kejadianKhusus: string;
  narasiDibantuAI: boolean;
  fotoBukti: FotoBukti[]; // 1-3
  namaPengisi: string;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
}

// Payload untuk POST /api/berita-acara-susulan (form yang diisi pengawas)
export interface SubmitBeritaAcaraSusulanPayload {
  periodeId: string;
  tanggalStr: string;
  kodeMK: string;
  namaMK: string;
  prodi: string;
  kelas: string;
  dosenPengajar: string;
  ruangan?: string | null;
  pengawas1: string;
  pengawas2?: string | null;
  pesertaTerdaftar: number;
  pesertaHadir: number;
  daftarTidakHadir?: string | null;
  jamMulaiAktual: string;
  jamSelesaiAktual: string;
  jumlahBerkas?: number | null;
  kejadianKhusus: string;
  narasiDibantuAI: boolean;
  fotoBukti: FotoBukti[];
  namaPengisi: string;
}

export type AdminRole = 'admin' | 'co_admin';

export interface AdminAccount {
  uid: string;
  email: string;
  role: AdminRole;
  createdAt: string;
  createdBy: string;
}

export type AksiAuditLog =
  | 'submit_ba'
  | 'edit_ba'
  | 'unlock_ba'
  | 'hapus_ba'
  | 'submit_ba_susulan'
  | 'edit_ba_susulan'
  | 'unlock_ba_susulan'
  | 'hapus_ba_susulan'
  | 'crud_jadwal'
  | 'import_jadwal'
  | 'crud_periode'
  | 'update_pengaturan'
  | 'login_admin'
  | 'buat_co_admin'
  | 'hapus_co_admin';

export interface AuditLog {
  id: string;
  aksi: AksiAuditLog;
  aktor: string; // "publik" | email admin
  targetId: string;
  detail: Record<string, unknown>;
  ip: string;
  timestamp: string;
}

// Payload untuk POST /api/berita-acara (form yang diisi pengawas)
export interface SubmitBeritaAcaraPayload {
  jadwalId: string;
  pengawas1: string;
  pengawas2?: string | null;
  pesertaTerdaftar: number;
  pesertaHadir: number;
  daftarTidakHadir?: string | null;
  jamMulaiAktual: string;
  jamSelesaiAktual: string;
  jumlahBerkas?: number | null;
  kejadianKhusus: string;
  narasiDibantuAI: boolean;
  fotoBukti: FotoBukti[];
  namaPengisi: string;
}

// Baris jadwal untuk import Excel (sebelum divalidasi/diberi id)
export interface BarisImportJadwal {
  tanggalStr: string;
  jamMulai: string;
  jamSelesai: string;
  kodeMK: string;
  namaMK: string;
  prodi: string;
  kelas: string;
  dosenPengajar: string;
  ruangan?: string | null;
}
