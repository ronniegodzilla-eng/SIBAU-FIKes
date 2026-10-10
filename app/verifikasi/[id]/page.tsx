import type { Metadata } from 'next';
import Link from 'next/link';
import type { DocumentData } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import KopSuratBA from '@/components/ba/KopSuratBA';
import { kopDari } from '@/lib/kop';
import { kodeVerifikasi } from '@/lib/kode-tte';
import { isiTteReguler, isiTteSusulan, tteMasihUtuh, type IsiTte } from '@/lib/tte';
import { formatTanggalIndonesia, formatTanggalJamWIB } from '@/lib/tanggal';
import type { SettingsApp, TandaTanganElektronik } from '@/lib/types';

export const runtime = 'nodejs';
// Halaman ini dibuka dari QR pada lembar yang beredar; statusnya harus status
// hari ini, bukan status saat build.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Verifikasi Berita Acara — SIBAU',
  robots: { index: false, follow: false },
};

interface Ditemukan {
  susulan: boolean;
  data: DocumentData;
  isi: IsiTte | null;
  jenisUjian: string | null;
}

/** Cari id di BA reguler dulu, lalu BA susulan — satu alamat untuk keduanya. */
async function cari(id: string): Promise<Ditemukan | null> {
  // Id dokumen Firestore buatan sistem; nilai lain (mis. "..") ditolak dulu
  // karena bisa membuat Admin SDK melempar galat path.
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return null;
  const [baSnap, susulanSnap] = await Promise.all([
    adminDb.collection('berita_acara').doc(id).get(),
    adminDb.collection('berita_acara_susulan').doc(id).get(),
  ]);

  if (baSnap.exists) {
    const data = baSnap.data()!;
    const jadwalSnap = data.jadwalId
      ? await adminDb.collection('jadwal_ujian').doc(String(data.jadwalId)).get()
      : null;
    const jadwal = jadwalSnap?.exists ? jadwalSnap.data()! : null;
    return {
      susulan: false,
      data: { ...data, ...(jadwal ? pickJadwal(jadwal) : {}) },
      isi: jadwal ? isiTteReguler(id, data, jadwal) : null,
      jenisUjian: await jenisUjian(jadwal?.periodeId),
    };
  }

  if (susulanSnap.exists) {
    const data = susulanSnap.data()!;
    return {
      susulan: true,
      data,
      isi: isiTteSusulan(id, data),
      jenisUjian: await jenisUjian(data.periodeId),
    };
  }

  return null;
}

function pickJadwal(j: DocumentData) {
  return {
    tanggalStr: j.tanggalStr,
    jamMulai: j.jamMulai,
    jamSelesai: j.jamSelesai,
    kodeMK: j.kodeMK,
    namaMK: j.namaMK,
    prodi: j.prodi,
    kelas: j.kelas,
    ruangan: j.ruangan,
  };
}

async function jenisUjian(periodeId: unknown): Promise<string | null> {
  if (typeof periodeId !== 'string' || !periodeId) return null;
  const snap = await adminDb.collection('periode').doc(periodeId).get();
  if (!snap.exists) return null;
  const p = snap.data()!;
  return `${p.jenis} Semester ${p.semester} T.A. ${p.tahunAkademik}`;
}

/**
 * Verifikasi publik tanda tangan elektronik berita acara — tujuan QR pada
 * dokumen BA. Dibaca lewat Admin SDK di server karena hash TTE harus dihitung
 * ulang dari data terkini, dan perhitungan itu tidak boleh dipercayakan ke
 * browser.
 *
 * Yang ditampilkan dibatasi pada data yang perlu dicocokkan dengan lembar di
 * tangan pemindai. Nama mahasiswa yang tidak hadir sengaja tidak ikut: halaman
 * ini bisa dibuka siapa saja yang memegang kertasnya.
 */
export default async function VerifikasiBeritaAcara({ params }: { params: { id: string } }) {
  const [hasil, settingsSnap] = await Promise.all([
    cari(params.id),
    adminDb.collection('settings').doc('app').get(),
  ]);
  const kop = kopDari(settingsSnap.exists ? (settingsSnap.data() as SettingsApp) : null);

  const tte = (hasil?.data.tte as TandaTanganElektronik | undefined) ?? null;
  const utuh = Boolean(hasil?.isi && tte && tteMasihUtuh(hasil.isi, tte));
  const dalamKoreksi = hasil?.data.locked === false;
  const d = hasil?.data;

  return (
    <main className="min-h-dvh bg-app px-3 py-6 sm:px-4 sm:py-10">
      <div className="mx-auto max-w-[760px] rounded-xl border border-line bg-white p-5 shadow-sm sm:p-8">
        <KopSuratBA kop={kop} />

        {!hasil || !d ? (
          <Blok
            nada="galat"
            judul="Dokumen tidak dikenali"
            pesan="Kode pada QR ini tidak cocok dengan berita acara ujian mana pun di SIBAU Fakultas Ilmu Kesehatan UIS. Mohon periksa kembali lembar aslinya."
          />
        ) : !tte ? (
          <Blok
            nada="galat"
            judul="Berita acara ini belum ditandatangani secara elektronik"
            pesan={`Berita acara nomor ${d.nomorBA} tercatat di SIBAU, tetapi belum memiliki tanda tangan elektronik. Keabsahannya mengikuti tanda tangan basah pada lembar cetaknya.`}
          />
        ) : dalamKoreksi ? (
          <Blok
            nada="galat"
            judul="Berita acara ini sedang dikoreksi"
            pesan={`Kunci berita acara nomor ${d.nomorBA} sedang dibuka panitia untuk perbaikan. Tanda tangan elektronik baru akan diterbitkan setelah pengawas mengirim ulang; lembar yang dicetak sebelumnya mungkin sudah tidak sesuai.`}
          />
        ) : !utuh ? (
          <Blok
            nada="galat"
            judul="Isi berita acara berubah setelah ditandatangani"
            pesan={`Data berita acara nomor ${d.nomorBA} di SIBAU tidak lagi sama dengan yang ditandatangani pengawas pada ${formatTanggalJamWIB(tte.ditandatanganiAt)}. Mohon tidak memprosesnya dan hubungi panitia ujian.`}
          />
        ) : (
          <Blok
            nada="sah"
            judul="Berita acara ini sah"
            pesan="Tanda tangan elektronik cocok dengan data di SIBAU. Data di bawah ini diambil langsung dari sistem dan harus sama dengan lembar yang Anda pegang."
          />
        )}

        {hasil && d && tte && (
          <dl className="mt-5 divide-y divide-line text-[14px]">
            <Baris
              k="Jenis dokumen"
              v={`Berita acara pelaksanaan ujian${hasil.susulan ? ' susulan' : ''}${
                hasil.jenisUjian ? ` — ${hasil.jenisUjian}` : ''
              }`}
              tebal
            />
            <Baris k="Nomor" v={String(d.nomorBA ?? '—')} tebal />
            <Baris k="Mata kuliah" v={`${d.namaMK ?? '—'} (${d.kodeMK ?? '—'})`} />
            <Baris k="Program studi" v={String(d.prodi ?? '—')} />
            <Baris k="Kelas" v={String(d.kelas ?? '—')} />
            <Baris
              k="Tanggal & jam pelaksanaan"
              v={`${d.tanggalStr ? formatTanggalIndonesia(String(d.tanggalStr)) : '—'}, ${
                d.jamMulaiAktual ?? '—'
              } – ${d.jamSelesaiAktual ?? '—'} WIB`}
            />
            <Baris k="Ruangan" v={String(d.ruangan ?? '—')} />
            <Baris
              k="Pengawas"
              v={[d.pengawas1, d.pengawas2].filter(Boolean).join(', ') || '—'}
            />
            <Baris
              k="Kehadiran peserta"
              v={`${d.pesertaHadir ?? 0} hadir dari ${d.pesertaTerdaftar ?? 0} terdaftar`}
            />
            <Baris
              k="Ditandatangani elektronik"
              v={`${formatTanggalJamWIB(tte.ditandatanganiAt)} oleh ${tte.oleh}`}
            />
            <Baris k="Kode verifikasi" v={kodeVerifikasi(tte.hash)} mono />
          </dl>
        )}

        {hasil && (
          <Link
            href={
              hasil.susulan ? `/berita-acara-susulan/${params.id}` : `/berita-acara/${params.id}`
            }
            className="mt-5 inline-block text-[13px] font-semibold text-primary-600 underline underline-offset-4"
          >
            Lihat dokumen berita acara
          </Link>
        )}

        <p className="mt-6 border-t border-line pt-4 text-[12px] leading-relaxed text-muted">
          Halaman ini adalah kanal verifikasi resmi SIBAU — Sistem Informasi Berita Acara Ujian,
          Fakultas Ilmu Kesehatan Universitas Ibnu Sina. Bila ada keraguan, hubungi panitia ujian
          atau Tata Usaha FIKes di{' '}
          <span className="underline underline-offset-2">{kop.email}</span>.
        </p>
      </div>
    </main>
  );
}

function Blok({ nada, judul, pesan }: { nada: 'sah' | 'galat'; judul: string; pesan: string }) {
  const sah = nada === 'sah';
  return (
    <div
      className={`mt-6 rounded-lg border p-4 ${
        sah ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50'
      }`}
    >
      <h1 className={`text-[16px] font-bold ${sah ? 'text-emerald-900' : 'text-amber-900'}`}>
        {sah ? '✓ ' : '! '}
        {judul}
      </h1>
      <p className={`mt-1 text-[13px] leading-relaxed ${sah ? 'text-emerald-800' : 'text-amber-800'}`}>
        {pesan}
      </p>
    </div>
  );
}

function Baris({ k, v, tebal, mono }: { k: string; v: string; tebal?: boolean; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:gap-3">
      <dt className="shrink-0 text-muted sm:w-52">{k}</dt>
      <dd
        className={`min-w-0 flex-1 break-words ${tebal ? 'font-bold' : ''} ${
          mono ? 'font-mono tracking-wide' : ''
        }`}
      >
        {v}
      </dd>
    </div>
  );
}
