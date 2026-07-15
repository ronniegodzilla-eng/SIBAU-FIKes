'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { formatTanggalIndonesia, jamStrWIB } from '@/lib/tanggal';
import { validasiFormBA } from '@/lib/validasi';
import { useToast } from '@/components/ui/ToastProvider';
import UploadFotoInput from '@/components/publik/UploadFotoInput';
import type { BeritaAcara, JadwalUjian, Periode, FotoBukti } from '@/lib/types';

const KEJADIAN_DEFAULT = 'Nihil';

const inputCls =
  'mt-1.5 min-h-[44px] w-full rounded-[9px] border-[1.5px] border-line px-3 py-2.5 text-sm text-ink box-border';
const labelCls = 'block text-[12.5px] font-bold text-label';

export default function IsiBeritaAcaraPage({
  params,
}: {
  params: { jadwalId: string };
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [jadwal, setJadwal] = useState<JadwalUjian | null | undefined>(undefined);
  const [periode, setPeriode] = useState<Periode | null>(null);
  const [errorMuat, setErrorMuat] = useState('');
  /** Terisi jika jadwal sudah punya BA yang kuncinya dibuka admin (F-09) —
   *  form berubah jadi mode edit ulang dan submit memakai PUT. */
  const [baEdit, setBaEdit] = useState<BeritaAcara | null>(null);

  const [pengawas1, setPengawas1] = useState('');
  const [pengawas2, setPengawas2] = useState('');
  const [pesertaTerdaftar, setPesertaTerdaftar] = useState('');
  const [pesertaHadir, setPesertaHadir] = useState('');
  const [daftarTidakHadir, setDaftarTidakHadir] = useState('');
  const [jamMulaiAktual, setJamMulaiAktual] = useState('');
  const [jamSelesaiAktual, setJamSelesaiAktual] = useState('');
  const [jumlahBerkas, setJumlahBerkas] = useState('');
  const [kejadianKhusus, setKejadianKhusus] = useState(KEJADIAN_DEFAULT);
  const [narasiDibantuAI, setNarasiDibantuAI] = useState(false);
  const [merapikanNarasi, setMerapikanNarasi] = useState(false);
  const [namaPengisi, setNamaPengisi] = useState('');
  const [fotoBukti, setFotoBukti] = useState<FotoBukti[]>([]);

  const [mengirim, setMengirim] = useState(false);

  async function handleBantuNarasi() {
    if (!kejadianKhusus.trim() || kejadianKhusus.trim() === KEJADIAN_DEFAULT) return;
    setMerapikanNarasi(true);
    try {
      const res = await fetch('/api/ai-narasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teks: kejadianKhusus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal merapikan narasi.');
      setKejadianKhusus(data.narasi);
      setNarasiDibantuAI(true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal merapikan narasi.', 'error');
    } finally {
      setMerapikanNarasi(false);
    }
  }

  useEffect(() => {
    async function muat() {
      try {
        const jadwalSnap = await getDoc(doc(db, 'jadwal_ujian', params.jadwalId));
        if (!jadwalSnap.exists()) {
          setJadwal(null);
          return;
        }
        const jadwalData = { id: jadwalSnap.id, ...jadwalSnap.data() } as unknown as JadwalUjian;
        setJamMulaiAktual(jadwalData.jamMulai || jamStrWIB());

        // Jadwal terisi tapi BA-nya dibuka kuncinya oleh admin → mode edit
        // ulang: prefill seluruh isian lama (termasuk foto) sebelum render.
        if (jadwalData.status === 'terisi' && jadwalData.beritaAcaraId) {
          const baSnap = await getDoc(doc(db, 'berita_acara', jadwalData.beritaAcaraId));
          if (baSnap.exists() && baSnap.data().locked === false) {
            const ba = { id: baSnap.id, ...baSnap.data() } as unknown as BeritaAcara;
            setPengawas1(ba.pengawas1);
            setPengawas2(ba.pengawas2 ?? '');
            setPesertaTerdaftar(String(ba.pesertaTerdaftar));
            setPesertaHadir(String(ba.pesertaHadir));
            setDaftarTidakHadir(ba.daftarTidakHadir ?? '');
            setJamMulaiAktual(ba.jamMulaiAktual);
            setJamSelesaiAktual(ba.jamSelesaiAktual);
            setJumlahBerkas(ba.jumlahBerkas != null ? String(ba.jumlahBerkas) : '');
            setKejadianKhusus(ba.kejadianKhusus);
            setNarasiDibantuAI(Boolean(ba.narasiDibantuAI));
            setNamaPengisi(ba.namaPengisi);
            setFotoBukti(ba.fotoBukti ?? []);
            setBaEdit(ba);
          }
        }
        setJadwal(jadwalData);

        const periodeSnap = await getDoc(doc(db, 'periode', jadwalData.periodeId));
        if (periodeSnap.exists()) {
          setPeriode({ id: periodeSnap.id, ...periodeSnap.data() } as unknown as Periode);
        }
      } catch {
        setErrorMuat('Gagal memuat data jadwal. Periksa koneksi internet Anda.');
      }
    }
    muat();
  }, [params.jadwalId]);

  const pesertaTidakHadir =
    pesertaTerdaftar !== '' && pesertaHadir !== ''
      ? Math.max(0, Number(pesertaTerdaftar) - Number(pesertaHadir))
      : '—';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const payload = {
      pengawas1,
      pengawas2: pengawas2 || null,
      pesertaTerdaftar: Number(pesertaTerdaftar),
      pesertaHadir: Number(pesertaHadir),
      daftarTidakHadir: daftarTidakHadir || null,
      jamMulaiAktual,
      jamSelesaiAktual,
      jumlahBerkas: jumlahBerkas || null,
      kejadianKhusus,
      namaPengisi,
      fotoBukti,
    };

    const errorValidasi = validasiFormBA(payload, { wajibkanFoto: true });
    if (errorValidasi) {
      showToast(errorValidasi, 'error');
      return;
    }

    setMengirim(true);
    try {
      const res = await fetch(baEdit ? `/api/berita-acara/${baEdit.id}` : '/api/berita-acara', {
        method: baEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jadwalId: params.jadwalId, narasiDibantuAI, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan berita acara.');
      showToast(
        baEdit ? 'Perubahan berita acara berhasil disimpan.' : 'Berita acara berhasil disimpan.',
        'success'
      );
      router.push(`/berita-acara/${data.baId}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan berita acara.', 'error');
    } finally {
      setMengirim(false);
    }
  }

  if (jadwal === undefined) {
    return (
      <main className="mx-auto max-w-[600px] px-4 py-10 text-center text-sm text-faint">
        {errorMuat || 'Memuat...'}
      </main>
    );
  }

  if (jadwal === null) {
    return (
      <main className="mx-auto max-w-[600px] px-4 py-10 text-center">
        <p className="text-sm text-faint">Jadwal ujian tidak ditemukan.</p>
      </main>
    );
  }

  if (jadwal.status === 'terisi' && !baEdit) {
    return (
      <main className="mx-auto max-w-[600px] px-4 py-10 text-center">
        <p className="text-sm text-faint">Berita acara untuk jadwal ini sudah diisi.</p>
        {jadwal.beritaAcaraId && (
          <a
            href={`/berita-acara/${jadwal.beritaAcaraId}`}
            className="mt-3 inline-block min-h-[44px] rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-700"
          >
            Lihat Berita Acara
          </a>
        )}
      </main>
    );
  }

  return (
    <div className="pb-[60px]">
      <div className="flex items-center gap-3 bg-primary-600 px-[18px] py-4 lg:px-8">
        <Link
          href="/"
          className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-white/[0.14] text-base text-white"
        >
          ←
        </Link>
        <div className="text-[15px] font-extrabold text-white">
          {baEdit ? 'Edit Berita Acara Ujian' : 'Isi Berita Acara Ujian'}
        </div>
      </div>

      <div className="p-4 lg:mx-auto lg:grid lg:max-w-5xl lg:grid-cols-[320px_1fr] lg:items-start lg:gap-5 lg:p-8">
        <section className="mb-3.5 rounded-2xl bg-white p-4 shadow-[0_4px_14px_rgba(15,60,30,0.06)] sm:px-[18px] lg:sticky lg:top-6 lg:mb-0">
          <h2 className="mb-2.5 text-[11.5px] font-bold uppercase tracking-wide text-primary-600">
            Data Jadwal (Otomatis)
          </h2>
          <dl className="grid grid-cols-2 gap-x-3.5 gap-y-2.5">
            <div>
              <dt className="text-[11px] font-semibold text-faint">Periode</dt>
              <dd className="text-[13px] font-bold text-ink">
                {periode ? `${periode.jenis} ${periode.semester} T.A. ${periode.tahunAkademik}` : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold text-faint">Hari / Tanggal</dt>
              <dd className="text-[13px] font-bold text-ink">{formatTanggalIndonesia(jadwal.tanggalStr)}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold text-faint">Jam Terjadwal</dt>
              <dd className="text-[13px] font-bold text-ink">{jadwal.jamMulai} – {jadwal.jamSelesai}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold text-faint">Ruangan</dt>
              <dd className="text-[13px] font-bold text-ink">{jadwal.ruangan ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold text-faint">Mata Kuliah</dt>
              <dd className="text-[13px] font-bold text-ink">{jadwal.namaMK} ({jadwal.kodeMK})</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold text-faint">Prodi / Kelas</dt>
              <dd className="text-[13px] font-bold text-ink">{jadwal.prodi} · {jadwal.kelas}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-[11px] font-semibold text-faint">Dosen Pengajar</dt>
              <dd className="text-[13px] font-bold text-ink">{jadwal.dosenPengajar}</dd>
            </div>
          </dl>
        </section>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3.5 rounded-2xl bg-white p-4 shadow-[0_4px_14px_rgba(15,60,30,0.06)] sm:px-[18px]"
        >
          <h2 className="text-[11.5px] font-bold uppercase tracking-wide text-primary-600">
            Diisi Pengawas
          </h2>

          {baEdit && (
            <div className="rounded-[9px] border-[1.5px] border-warn-border bg-warn-bg px-3 py-2.5 text-xs font-semibold text-warn-text">
              Berita acara {baEdit.nomorBA} telah dibuka kuncinya oleh admin. Perbaiki isian di
              bawah, lalu simpan — setelah disimpan berita acara akan terkunci kembali.
            </div>
          )}

          <div>
            <label className={labelCls}>Nama Pengawas 1 *</label>
            <input
              value={pengawas1}
              onChange={(e) => setPengawas1(e.target.value)}
              placeholder="Nama lengkap"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Nama Pengawas 2 (opsional)</label>
            <input
              value={pengawas2}
              onChange={(e) => setPengawas2(e.target.value)}
              placeholder="Nama lengkap"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Peserta Terdaftar *</label>
              <input
                type="number"
                min={0}
                value={pesertaTerdaftar}
                onChange={(e) => setPesertaTerdaftar(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Peserta Hadir *</label>
              <input
                type="number"
                min={0}
                value={pesertaHadir}
                onChange={(e) => setPesertaHadir(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <div className="rounded-[9px] bg-app px-3 py-2.5 text-[13px] font-semibold text-body">
            Tidak hadir (otomatis): <span className="font-extrabold text-ink">{pesertaTidakHadir}</span>
          </div>

          <div>
            <label className={labelCls}>Nama / NIM Peserta Tidak Hadir (opsional)</label>
            <textarea
              value={daftarTidakHadir}
              onChange={(e) => setDaftarTidakHadir(e.target.value)}
              rows={2}
              placeholder="mis. Rudi Hartono (2022001102) — sakit"
              className={`${inputCls} resize-y`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Jam Mulai Aktual *</label>
              <input
                type="time"
                value={jamMulaiAktual}
                onChange={(e) => setJamMulaiAktual(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Jam Selesai Aktual *</label>
              <input
                type="time"
                value={jamSelesaiAktual}
                onChange={(e) => setJamSelesaiAktual(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Jumlah Berkas / Lembar Jawaban Diserahkan</label>
            <input
              type="number"
              min={0}
              value={jumlahBerkas}
              onChange={(e) => setJumlahBerkas(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className={labelCls}>Kejadian Khusus / Catatan Pelanggaran *</label>
              <button
                type="button"
                onClick={handleBantuNarasi}
                disabled={
                  merapikanNarasi ||
                  !kejadianKhusus.trim() ||
                  kejadianKhusus.trim() === KEJADIAN_DEFAULT
                }
                className="text-xs font-bold text-primary-600 hover:text-primary-700 disabled:opacity-40"
              >
                {merapikanNarasi ? 'Merapikan...' : '✨ Bantu Narasi'}
              </button>
            </div>
            <textarea
              value={kejadianKhusus}
              onChange={(e) => {
                setKejadianKhusus(e.target.value);
                setNarasiDibantuAI(false);
              }}
              rows={2}
              className={`${inputCls} resize-y`}
            />
            {narasiDibantuAI && (
              <p className="mt-1.5 text-[11.5px] font-semibold text-primary-600">
                Teks dirapikan dengan bantuan AI — silakan tinjau sebelum menyimpan.
              </p>
            )}
          </div>

          <div>
            <label className={labelCls}>Foto Bukti Pelaksanaan * (min 1, maks 3)</label>
            <div className="mt-1.5">
              <UploadFotoInput
                jadwalId={params.jadwalId}
                fotoAwal={baEdit?.fotoBukti}
                onChange={setFotoBukti}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Nama Pengisi (Penanggung Jawab Isian) *</label>
            <input
              value={namaPengisi}
              onChange={(e) => setNamaPengisi(e.target.value)}
              placeholder="Nama lengkap"
              className={inputCls}
            />
          </div>

          <div className="rounded-[9px] border-[1.5px] border-warn-border bg-warn-bg px-3 py-2.5 text-xs font-semibold text-warn-text">
            Setelah disimpan, berita acara akan terkunci dan tidak dapat diubah kembali oleh
            publik.
          </div>

          <button
            type="submit"
            disabled={mengirim}
            className="min-h-[44px] w-full rounded-[11px] bg-primary-600 py-3.5 text-[15px] font-extrabold text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {mengirim ? 'Menyimpan...' : baEdit ? 'Simpan Perubahan' : 'Simpan Berita Acara'}
          </button>
        </form>
      </div>
    </div>
  );
}
