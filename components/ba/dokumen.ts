// Bentuk tunggal isi dokumen berita acara, dipakai bersama oleh tampilan di
// layar (DokumenBeritaAcara) dan PDF (BeritaAcaraPDF) untuk BA reguler
// maupun susulan — sehingga struktur dokumennya cukup ditulis sekali per
// media, bukan sekali per jenis BA.

import type {
  BeritaAcara,
  BeritaAcaraSusulan,
  FotoBukti,
  JadwalUjian,
  Periode,
  TandaTanganElektronik,
  TtePejabat,
} from '@/lib/types';

export interface DokumenBA {
  id: string;
  susulan: boolean;
  nomorBA: string;
  jenisUjian: Periode['jenis'] | null;
  semesterPeriode: Periode['semester'] | null;
  tahunAkademik: string | null;
  tanggalStr: string;
  /** Jam di jadwal; null untuk BA susulan (tidak terjadwal). */
  jamTerjadwal: string | null;
  kodeMK: string;
  namaMK: string;
  prodi: string;
  kelas: string;
  dosenPengajar: string;
  ruangan: string | null;
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
  fotoBukti: FotoBukti[];
  namaPengisi: string;
  locked: boolean;
  tte: TandaTanganElektronik | null;
  ttePejabat: TtePejabat | null;
}

type BagianBA = Pick<
  BeritaAcara,
  | 'nomorBA'
  | 'pengawas1'
  | 'pengawas2'
  | 'pesertaTerdaftar'
  | 'pesertaHadir'
  | 'pesertaTidakHadir'
  | 'daftarTidakHadir'
  | 'jamMulaiAktual'
  | 'jamSelesaiAktual'
  | 'jumlahBerkas'
  | 'kejadianKhusus'
  | 'fotoBukti'
  | 'namaPengisi'
  | 'locked'
  | 'tte'
  | 'ttePejabat'
>;

function bagianBA(ba: BagianBA) {
  return {
    nomorBA: ba.nomorBA,
    pengawas1: ba.pengawas1,
    pengawas2: ba.pengawas2 ?? null,
    pesertaTerdaftar: ba.pesertaTerdaftar,
    pesertaHadir: ba.pesertaHadir,
    pesertaTidakHadir: ba.pesertaTidakHadir,
    daftarTidakHadir: ba.daftarTidakHadir ?? null,
    jamMulaiAktual: ba.jamMulaiAktual,
    jamSelesaiAktual: ba.jamSelesaiAktual,
    jumlahBerkas: ba.jumlahBerkas ?? null,
    kejadianKhusus: ba.kejadianKhusus,
    fotoBukti: ba.fotoBukti ?? [],
    namaPengisi: ba.namaPengisi,
    locked: ba.locked,
    tte: ba.tte ?? null,
    ttePejabat: ba.ttePejabat ?? null,
  };
}

function bagianPeriode(periode: Periode | null) {
  return {
    jenisUjian: periode?.jenis ?? null,
    semesterPeriode: periode?.semester ?? null,
    tahunAkademik: periode?.tahunAkademik ?? null,
  };
}

export function dokumenReguler(
  ba: BeritaAcara,
  jadwal: JadwalUjian,
  periode: Periode | null
): DokumenBA {
  return {
    id: ba.id,
    susulan: false,
    ...bagianBA(ba),
    ...bagianPeriode(periode),
    tanggalStr: jadwal.tanggalStr,
    jamTerjadwal: `${jadwal.jamMulai} – ${jadwal.jamSelesai}`,
    kodeMK: jadwal.kodeMK,
    namaMK: jadwal.namaMK,
    prodi: jadwal.prodi,
    kelas: jadwal.kelas,
    dosenPengajar: jadwal.dosenPengajar,
    ruangan: jadwal.ruangan,
  };
}

export function dokumenSusulan(s: BeritaAcaraSusulan, periode: Periode | null): DokumenBA {
  return {
    id: s.id,
    susulan: true,
    ...bagianBA(s),
    ...bagianPeriode(periode),
    tanggalStr: s.tanggalStr,
    jamTerjadwal: null,
    kodeMK: s.kodeMK,
    namaMK: s.namaMK,
    prodi: s.prodi,
    kelas: s.kelas,
    dosenPengajar: s.dosenPengajar,
    ruangan: s.ruangan,
  };
}

function namaUjian(jenis: DokumenBA['jenisUjian']): string {
  if (jenis === 'UTS') return 'Ujian Tengah Semester (UTS)';
  if (jenis === 'UAS') return 'Ujian Akhir Semester (UAS)';
  return 'Ujian';
}

export interface TeksDokumen {
  judul: string;
  subjudul: string;
  /** Kalimat pembuka setelah "Pada hari ini, <tanggal>, pukul <jam> WIB,". */
  kegiatan: string;
}

export function teksDokumen(d: DokumenBA): TeksDokumen {
  const ujian = namaUjian(d.jenisUjian);
  const periode =
    d.semesterPeriode && d.tahunAkademik
      ? `Semester ${d.semesterPeriode} Tahun Akademik ${d.tahunAkademik}`
      : '';
  return {
    judul: d.susulan
      ? 'Berita Acara Pelaksanaan Ujian Susulan'
      : `Berita Acara Pelaksanaan ${ujian}`,
    subjudul: [d.susulan ? ujian : '', periode].filter(Boolean).join(' · '),
    kegiatan: d.susulan
      ? `ujian susulan ${d.jenisUjian ?? ''} mata kuliah ${d.namaMK}`.replace('  ', ' ')
      : `${ujian} mata kuliah ${d.namaMK}`,
  };
}

/** Pengawas yang tercantum, dalam urutan cetak. */
export function daftarPengawas(d: DokumenBA): string[] {
  return [d.pengawas1, d.pengawas2].filter((p): p is string => Boolean(p?.trim()));
}
