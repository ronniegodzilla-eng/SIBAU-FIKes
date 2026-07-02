// Semua logika tanggal aplikasi WAJIB lewat file ini. Zona waktu di-hardcode
// WIB (UTC+7) secara eksplisit lewat aritmatika epoch ms — tidak pernah
// bergantung pada timezone lokal server/browser (Vercel = UTC).

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

const NAMA_HARI = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

const NAMA_BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

/** Menggeser instant UTC +7 jam agar getter `getUTC*` membaca wall-clock WIB. */
function keTampilanWIB(date: Date): Date {
  return new Date(date.getTime() + WIB_OFFSET_MS);
}

/** "YYYY-MM-DD" versi WIB dari sebuah instant (default: sekarang). */
export function tanggalStrWIB(date: Date = new Date()): string {
  const wib = keTampilanWIB(date);
  const y = wib.getUTCFullYear();
  const m = String(wib.getUTCMonth() + 1).padStart(2, '0');
  const d = String(wib.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** tanggalStr untuk "hari ini" menurut WIB. */
export function hariIniStrWIB(): string {
  return tanggalStrWIB(new Date());
}

/** "HH:mm" versi WIB dari sebuah instant (default: sekarang). */
export function jamStrWIB(date: Date = new Date()): string {
  const wib = keTampilanWIB(date);
  const h = String(wib.getUTCHours()).padStart(2, '0');
  const mnt = String(wib.getUTCMinutes()).padStart(2, '0');
  return `${h}:${mnt}`;
}

/**
 * Bangun instant UTC yang merepresentasikan pukul 12:00 WIB pada tanggalStr
 * yang diberikan. Dipakai sebagai anchor `jadwal_ujian.tanggal` (Timestamp)
 * agar aman dari pergeseran zona waktu (§5 PRD).
 */
export function buatTimestampTengahHariWIB(tanggalStr: string): Date {
  const [y, m, d] = tanggalStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12 - 7, 0, 0));
}

/** Format tampilan "Rabu, 2 Juli 2026" dari tanggalStr "YYYY-MM-DD". */
export function formatTanggalIndonesia(tanggalStr: string): string {
  const anchor = buatTimestampTengahHariWIB(tanggalStr);
  const wib = keTampilanWIB(anchor);
  const hari = NAMA_HARI[wib.getUTCDay()];
  const tanggal = wib.getUTCDate();
  const bulan = NAMA_BULAN[wib.getUTCMonth()];
  const tahun = wib.getUTCFullYear();
  return `${hari}, ${tanggal} ${bulan} ${tahun}`;
}

/** Format singkat "2 Jul 2026" untuk tempat sempit (kartu, tabel). */
export function formatTanggalSingkat(tanggalStr: string): string {
  const anchor = buatTimestampTengahHariWIB(tanggalStr);
  const wib = keTampilanWIB(anchor);
  const tanggal = wib.getUTCDate();
  const bulan = NAMA_BULAN[wib.getUTCMonth()].slice(0, 3);
  const tahun = wib.getUTCFullYear();
  return `${tanggal} ${bulan} ${tahun}`;
}

/** Selisih hari (positif = di masa lalu) antara hari ini WIB dan tanggalStr. */
export function selisihHariDariSekarang(tanggalStr: string): number {
  const hariIni = buatTimestampTengahHariWIB(hariIniStrWIB()).getTime();
  const target = buatTimestampTengahHariWIB(tanggalStr).getTime();
  return Math.round((hariIni - target) / 86_400_000);
}

/** Label tunggakan untuk panel "Belum Diisi" (F-02): "H+2 belum diisi". */
export function labelTertunggak(tanggalStr: string): string {
  const n = selisihHariDariSekarang(tanggalStr);
  if (n <= 0) return 'Hari ini';
  return `H+${n} belum diisi`;
}

/** Nama bulan romawi (I–XII) untuk format nomor BA. */
export function bulanKeRomawi(bulan1to12: number): string {
  const romawi = [
    'I',
    'II',
    'III',
    'IV',
    'V',
    'VI',
    'VII',
    'VIII',
    'IX',
    'X',
    'XI',
    'XII',
  ];
  return romawi[bulan1to12 - 1] ?? '';
}
