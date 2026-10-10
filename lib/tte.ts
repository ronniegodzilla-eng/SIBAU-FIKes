// Tanda tangan elektronik (TTE) berita acara — HANYA dipakai di server (API
// Routes & halaman /verifikasi), karena memakai modul crypto Node.
//
// Yang ditandatangani adalah isi BA saat pengawas mengirimkannya: SHA-256
// atas seluruh field yang tercetak di dokumen, ditambah waktu tanda tangan.
// Halaman verifikasi menghitung ulang hash dari data terkini di Firestore;
// bila berbeda dari hash tersimpan, berarti isi BA berubah setelah
// ditandatangani (mis. dikoreksi langsung di basis data) dan verifikasi
// melaporkannya alih-alih menyatakan dokumen sah.
//
// Data jadwal (MK, kelas, ruangan, dst) ikut di-hash karena tercetak di BA —
// mengubah jadwal setelah BA ditandatangani juga harus terdeteksi.

import { createHash } from 'crypto';
import type { DocumentData } from 'firebase-admin/firestore';
import type { TandaTanganElektronik } from '@/lib/types';

export interface IsiTte {
  jenis: 'reguler' | 'susulan';
  id: string;
  nomorBA: string;
  tanggalStr: string;
  jamMulai: string;
  jamSelesai: string;
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
  daftarTidakHadir: string | null;
  jamMulaiAktual: string;
  jamSelesaiAktual: string;
  jumlahBerkas: number | null;
  kejadianKhusus: string;
  fotoFileId: string[];
  namaPengisi: string;
}

// Urutan tetap, terpisah dari urutan properti objek, supaya hash tidak
// berubah hanya karena objeknya dirakit dengan urutan berbeda.
const URUTAN_FIELD: (keyof IsiTte)[] = [
  'jenis',
  'id',
  'nomorBA',
  'tanggalStr',
  'jamMulai',
  'jamSelesai',
  'kodeMK',
  'namaMK',
  'prodi',
  'kelas',
  'dosenPengajar',
  'ruangan',
  'pengawas1',
  'pengawas2',
  'pesertaTerdaftar',
  'pesertaHadir',
  'daftarTidakHadir',
  'jamMulaiAktual',
  'jamSelesaiAktual',
  'jumlahBerkas',
  'kejadianKhusus',
  'fotoFileId',
  'namaPengisi',
];

export function hitungHashTte(isi: IsiTte, ditandatanganiAt: string): string {
  const kanonik = JSON.stringify([...URUTAN_FIELD.map((k) => isi[k]), ditandatanganiAt]);
  return createHash('sha256').update(kanonik, 'utf8').digest('hex');
}

export function tandatangani(
  isi: IsiTte,
  oleh: string,
  waktu: Date = new Date()
): TandaTanganElektronik {
  const ditandatanganiAt = waktu.toISOString();
  return { hash: hitungHashTte(isi, ditandatanganiAt), ditandatanganiAt, oleh };
}

export function tteMasihUtuh(isi: IsiTte, tte: TandaTanganElektronik): boolean {
  return hitungHashTte(isi, tte.ditandatanganiAt) === tte.hash;
}

function bagianBA(id: string, ba: DocumentData) {
  return {
    id,
    nomorBA: String(ba.nomorBA ?? ''),
    pengawas1: String(ba.pengawas1 ?? ''),
    pengawas2: (ba.pengawas2 as string | null) ?? null,
    pesertaTerdaftar: Number(ba.pesertaTerdaftar),
    pesertaHadir: Number(ba.pesertaHadir),
    daftarTidakHadir: (ba.daftarTidakHadir as string | null) ?? null,
    jamMulaiAktual: String(ba.jamMulaiAktual ?? ''),
    jamSelesaiAktual: String(ba.jamSelesaiAktual ?? ''),
    jumlahBerkas: ba.jumlahBerkas != null ? Number(ba.jumlahBerkas) : null,
    kejadianKhusus: String(ba.kejadianKhusus ?? ''),
    fotoFileId: Array.isArray(ba.fotoBukti)
      ? ba.fotoBukti.map((f: { fileId: string }) => f.fileId)
      : [],
    namaPengisi: String(ba.namaPengisi ?? ''),
  };
}

/** BA reguler: field jadwal diambil dari dokumen jadwal_ujian-nya. */
export function isiTteReguler(id: string, ba: DocumentData, jadwal: DocumentData): IsiTte {
  return {
    jenis: 'reguler',
    ...bagianBA(id, ba),
    tanggalStr: String(jadwal.tanggalStr ?? ''),
    jamMulai: String(jadwal.jamMulai ?? ''),
    jamSelesai: String(jadwal.jamSelesai ?? ''),
    kodeMK: String(jadwal.kodeMK ?? ''),
    namaMK: String(jadwal.namaMK ?? ''),
    prodi: String(jadwal.prodi ?? ''),
    kelas: String(jadwal.kelas ?? ''),
    dosenPengajar: String(jadwal.dosenPengajar ?? ''),
    ruangan: (jadwal.ruangan as string | null) ?? null,
  };
}

/** BA susulan: field jadwal tersimpan di dokumen yang sama; jam ujiannya
 *  adalah jam aktual (tidak ada jadwal terencana). */
export function isiTteSusulan(id: string, s: DocumentData): IsiTte {
  return {
    jenis: 'susulan',
    ...bagianBA(id, s),
    tanggalStr: String(s.tanggalStr ?? ''),
    jamMulai: String(s.jamMulaiAktual ?? ''),
    jamSelesai: String(s.jamSelesaiAktual ?? ''),
    kodeMK: String(s.kodeMK ?? ''),
    namaMK: String(s.namaMK ?? ''),
    prodi: String(s.prodi ?? ''),
    kelas: String(s.kelas ?? ''),
    dosenPengajar: String(s.dosenPengajar ?? ''),
    ruangan: (s.ruangan as string | null) ?? null,
  };
}
