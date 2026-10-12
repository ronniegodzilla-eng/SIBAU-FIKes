// Normalisasi nama pengawas untuk rekap. Nama pengawas di BA diketik bebas,
// jadi satu orang bisa muncul dalam banyak ejaan ("JUHANDA KARTIKA WIJAYA",
// "Juhanda Kartika Wijaya, S.KL.M.K.M", "juhanda kartika wijaya").
//
// Dua lapis:
// 1. Otomatis — kunciNama() membuang gelar, huruf kapital, tanda baca, dan
//    spasi berlebih. Ejaan dengan kunci yang sama otomatis dianggap satu orang.
// 2. Manual — singkatan dan salah ketik ("Dwi Ani R", "Icr Irawati") tidak
//    bisa dipastikan otomatis. sarankanGabungan() hanya MENYARANKAN; admin
//    yang memutuskan, dan keputusannya disimpan sebagai alias.
//
// Data BA tidak pernah diubah: BA sudah ditandatangani elektronik, mengubah
// nama pengawasnya akan membatalkan TTE. Normalisasi hanya berlaku di rekap.

/** Penggabungan nama yang diputuskan admin (dokumen settings/pengawas). */
export interface AliasPengawas {
  /** kunci ejaan → kunci orang yang dituju. */
  alias: Record<string, string>;
  /** kunci → nama baku yang ditampilkan di rekap & saran isian form. */
  namaBaku: Record<string, string>;
  /** kunci isian yang bukan nama orang (mis. data uji coba). */
  abaikan: string[];
  /** Pasangan kunci (lihat pasangan()) yang ditandai admin sebagai orang berbeda. */
  bukanSama: string[];
  /** Nama baku semua pengawas — dipakai sebagai saran isian di form BA. */
  daftarNama: string[];
}

export const ALIAS_KOSONG: AliasPengawas = {
  alias: {},
  namaBaku: {},
  abaikan: [],
  bukanSama: [],
  daftarNama: [],
};

const POLA_KUNCI = /^[a-z]+(?: [a-z]+)*$/;
const BATAS_ENTRI = 3000;

function teksPendek(v: unknown, maks: number): string | null {
  if (typeof v !== 'string') return null;
  const t = v.replace(/\s+/g, ' ').trim();
  return t && t.length <= maks ? t : null;
}

/**
 * Bentuk aman dari data alias — dipakai server untuk memvalidasi isian admin
 * dan klien untuk membaca dokumen settings/pengawas yang mungkin belum ada.
 * Entri yang tidak sah dibuang diam-diam, bukan menggagalkan semuanya.
 */
export function bersihkanAlias(input: unknown): AliasPengawas {
  const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const rekam = (v: unknown, cek: (val: unknown) => string | null) => {
    const hasil: Record<string, string> = {};
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const [k, val] of Object.entries(v).slice(0, BATAS_ENTRI)) {
        const bersih = cek(val);
        if (POLA_KUNCI.test(k) && k.length <= 80 && bersih) hasil[k] = bersih;
      }
    }
    return hasil;
  };
  const larik = (v: unknown, cek: (val: unknown) => string | null) =>
    Array.isArray(v)
      ? Array.from(new Set(v.slice(0, BATAS_ENTRI).map(cek).filter((x): x is string => !!x)))
      : [];
  const kunci = (v: unknown) =>
    typeof v === 'string' && POLA_KUNCI.test(v) && v.length <= 80 ? v : null;

  const alias = rekam(o.alias, kunci);
  for (const k of Object.keys(alias)) if (alias[k] === k) delete alias[k];
  return {
    alias,
    namaBaku: rekam(o.namaBaku, (v) => teksPendek(v, 120)),
    abaikan: larik(o.abaikan, kunci),
    bukanSama: larik(o.bukanSama, (v) =>
      typeof v === 'string' && v.split('|').length === 2 && v.split('|').every((x) => kunci(x))
        ? v
        : null
    ),
    daftarNama: larik(o.daftarNama, (v) => teksPendek(v, 120)).sort((a, b) =>
      a.localeCompare(b, 'id')
    ),
  };
}

const GELAR_DEPAN = /^(?:(?:dr|drg|prof|ir|hj|h|ns)\b\.?\s*)+/;

// Gelar di belakang nama yang ditulis tanpa koma: "Amirullah S.Kom.",
// "Nanda jarti.M.Kom". Hanya dicocokkan setelah spasi/titik supaya awal nama
// seperti "M. Kafit" tidak ikut terbuang.
const GELAR_BELAKANG =
  /[\s.]+(?:s|m|a|d)\.?\s?(?:kom|km|kl|kes|kkk|pd|si|tr|kep|ph|p\.h|mm|m|md|ked|farm|gz|keb|t|sos|e|h)\b[\s\S]*$/;

/**
 * Kunci pembanding: huruf kecil, tanpa gelar, tanpa tanda baca. Mengembalikan
 * '' untuk isian yang bukan nama ("-", "0", "Tdk ada").
 */
function tanpaGelar(nama: string): string {
  let s = nama.normalize('NFKC').toLowerCase();
  s = s.split(',')[0]!;
  s = s.replace(GELAR_DEPAN, '');
  s = s.replace(GELAR_BELAKANG, '');
  // Sisa gelar satu huruf yang menempel: "Rasmin Nur Jading.S,KM" → "…jading".
  return s.replace(/\.\s*[a-z]\.?$/, '').replace(/\s+/g, ' ').trim();
}

export function kunciNama(nama: string | null | undefined): string {
  if (!nama) return '';
  const s = tanpaGelar(nama).replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (s.replace(/\s/g, '').length < 3) return '';
  if (/^(tdk|tidak|blm|belum) ada$/.test(s) || s === 'nihil') return '';
  return s;
}

/** "juhanda kartika wijaya" → "Juhanda Kartika Wijaya". */
export function kapitalisasi(kunci: string): string {
  return kunci.replace(/\b[a-z]/g, (h) => h.toUpperCase());
}

/** Ikuti rantai alias sampai kunci orang terakhir (tahan terhadap siklus). */
export function kunciOrang(kunci: string, alias: Record<string, string>): string {
  let k = kunci;
  const dilalui = new Set<string>();
  while (alias[k] && !dilalui.has(k)) {
    dilalui.add(k);
    k = alias[k]!;
  }
  return k;
}

export interface Penugasan {
  /** id dokumen BA (reguler atau susulan). */
  id: string;
  susulan: boolean;
  tanggalStr: string;
  jamMulai: string;
  jamSelesai: string;
  namaMK: string;
  kodeMK: string;
  prodi: string;
  kelas: string;
  ruangan: string | null;
  nomorBA: string | null;
  pengawas: (string | null | undefined)[];
}

export interface RekapPengawas {
  kunci: string;
  nama: string;
  /** Ejaan asli yang tergabung ke orang ini beserta jumlah kemunculannya. */
  ejaan: { teks: string; jumlah: number }[];
  reguler: number;
  susulan: number;
  total: number;
  menit: number;
  tugas: Penugasan[];
}

function selisihMenit(mulai: string, selesai: string): number {
  const [h1, m1] = mulai.split(':').map(Number);
  const [h2, m2] = selesai.split(':').map(Number);
  if ([h1, m1, h2, m2].some((x) => x == null || Number.isNaN(x))) return 0;
  return Math.max(0, h2! * 60 + m2! - (h1! * 60 + m1!));
}

/**
 * Ejaan paling sering dipakai, tanpa gelar, huruf kapital di awal setiap kata
 * ("Drg. Chandra rizal" → "Chandra Rizal", "M.Kafit, M.Kes" → "M.Kafit").
 */
function namaTampil(ejaan: Map<string, number>, kunci: string): string {
  const terbanyak = [...ejaan.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  )[0]?.[0];
  const rapi = terbanyak
    ? tanpaGelar(terbanyak).replace(/(^|[\s.'-])([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase())
    : '';
  return rapi || kapitalisasi(kunci);
}

/** Hitung jumlah mengawas per orang. Satu BA dihitung sekali per orang. */
export function rekapPengawas(daftar: Penugasan[], a: AliasPengawas): {
  rekap: RekapPengawas[];
  tanpaNama: number;
} {
  const abaikan = new Set(a.abaikan);
  const peta = new Map<
    string,
    { ejaan: Map<string, number>; tugas: Penugasan[]; reguler: number; susulan: number; menit: number }
  >();
  let tanpaNama = 0;

  for (const t of daftar) {
    const orangDiBA = new Set<string>();
    for (const teks of t.pengawas) {
      const kunci = kunciNama(teks);
      if (!kunci || abaikan.has(kunci)) {
        if (teks?.trim()) tanpaNama++;
        continue;
      }
      const orang = kunciOrang(kunci, a.alias);
      if (abaikan.has(orang)) continue;
      let e = peta.get(orang);
      if (!e) {
        e = { ejaan: new Map(), tugas: [], reguler: 0, susulan: 0, menit: 0 };
        peta.set(orang, e);
      }
      const asli = teks!.replace(/\s+/g, ' ').trim();
      e.ejaan.set(asli, (e.ejaan.get(asli) ?? 0) + 1);
      if (orangDiBA.has(orang)) continue;
      orangDiBA.add(orang);
      e.tugas.push(t);
      if (t.susulan) e.susulan++;
      else e.reguler++;
      e.menit += selisihMenit(t.jamMulai, t.jamSelesai);
    }
  }

  const rekap = [...peta.entries()].map(([kunci, e]) => ({
    kunci,
    nama: a.namaBaku[kunci]?.trim() || namaTampil(e.ejaan, kunci),
    ejaan: [...e.ejaan.entries()]
      .map(([teks, jumlah]) => ({ teks, jumlah }))
      .sort((x, y) => y.jumlah - x.jumlah),
    reguler: e.reguler,
    susulan: e.susulan,
    total: e.reguler + e.susulan,
    menit: e.menit,
    tugas: e.tugas.sort((x, y) =>
      `${x.tanggalStr} ${x.jamMulai}`.localeCompare(`${y.tanggalStr} ${y.jamMulai}`)
    ),
  }));
  rekap.sort((x, y) => y.total - x.total || x.nama.localeCompare(y.nama));
  return { rekap, tanpaNama };
}

function jarakEdit(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let sebelum = dp[0]!;
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const simpan = dp[j]!;
      dp[j] = Math.min(dp[j]! + 1, dp[j - 1]! + 1, sebelum + (a[i - 1] === b[j - 1] ? 0 : 1));
      sebelum = simpan;
    }
  }
  return dp[b.length]!;
}

/**
 * Apakah `pendek` kemungkinan singkatan dari `panjang`: setiap kata pendek
 * cocok berurutan dengan kata panjang, baik utuh maupun sebagai inisial.
 * "dwi ani r" ~ "dwi ani rahmawati", "juhanda k wijaya" ~ "juhanda kartika
 * wijaya", "dwi ani" ~ "dwi ani rahmawati". Kata pertama wajib utuh.
 */
function singkatanDari(pendek: string, panjang: string): boolean {
  const p = pendek.split(' ');
  const q = panjang.split(' ');
  if (p.length > q.length || p[0] !== q[0]) return false;
  let j = 0;
  for (const kata of p) {
    while (j < q.length && !(q[j] === kata || (kata.length === 1 && q[j]!.startsWith(kata)))) j++;
    if (j === q.length) return false;
    j++;
  }
  return true;
}

function mirip(a: string, b: string): boolean {
  if (singkatanDari(a, b) || singkatanDari(b, a)) {
    // Satu kata saja ("jamal", "juhanda") terlalu lemah bila namanya umum,
    // tetapi tetap layak DISARANKAN — admin yang memutuskan.
    return true;
  }
  const panjang = Math.max(a.length, b.length);
  const jarak = jarakEdit(a, b);
  return panjang >= 8 && jarak <= Math.max(1, Math.floor(panjang * 0.12));
}

export interface SaranGabungan {
  /** Kunci yang paling sering muncul — kandidat tujuan penggabungan. */
  tujuan: string;
  anggota: string[];
}

/**
 * Kelompok nama yang mirip tetapi belum digabung. `jumlah` = banyak
 * kemunculan per kunci orang, untuk memilih tujuan yang paling lazim.
 */
export function sarankanGabungan(
  jumlah: Map<string, number>,
  sudahDitolak: Set<string> = new Set()
): SaranGabungan[] {
  const kunci = [...jumlah.keys()];
  const induk = new Map(kunci.map((k) => [k, k]));
  const cari = (k: string): string => {
    while (induk.get(k) !== k) k = induk.get(k)!;
    return k;
  };
  for (let i = 0; i < kunci.length; i++) {
    for (let j = i + 1; j < kunci.length; j++) {
      const a = kunci[i]!;
      const b = kunci[j]!;
      if (sudahDitolak.has(pasangan(a, b))) continue;
      if (mirip(a, b)) induk.set(cari(a), cari(b));
    }
  }
  const kelompok = new Map<string, string[]>();
  for (const k of kunci) {
    const akar = cari(k);
    kelompok.set(akar, [...(kelompok.get(akar) ?? []), k]);
  }
  return [...kelompok.values()]
    .filter((g) => g.length > 1)
    .map((g) => {
      const urut = [...g].sort(
        (x, y) => (jumlah.get(y) ?? 0) - (jumlah.get(x) ?? 0) || y.length - x.length
      );
      return { tujuan: urut[0]!, anggota: urut };
    });
}

/** Kunci pasangan yang urutannya tidak berpengaruh, untuk daftar "bukan orang yang sama". */
export function pasangan(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function formatDurasi(menit: number): string {
  const j = Math.floor(menit / 60);
  const m = menit % 60;
  return j ? `${j} jam${m ? ` ${m} mnt` : ''}` : `${m} mnt`;
}
