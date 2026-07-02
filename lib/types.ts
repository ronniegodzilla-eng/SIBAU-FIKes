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

export type AksiAuditLog =
  | 'submit_ba'
  | 'edit_ba'
  | 'unlock_ba'
  | 'hapus_ba'
  | 'crud_jadwal'
  | 'import_jadwal'
  | 'crud_periode'
  | 'update_pengaturan'
  | 'login_admin';

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
